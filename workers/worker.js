/**
 * Cloudflare Worker: production form gateway for Vaibhav Solar Solution.
 *
 * Responsibilities:
 * - Expose a same-origin /api/submit endpoint for Cloudflare Pages.
 * - Validate and normalize all website form submissions.
 * - Hide the Google Apps Script URL from the browser.
 * - Add CORS, no-store cache headers, request IDs, spam checks, and retry-safe forwarding.
 */

const FORM_TYPES = new Set(["quotation", "roi", "contact", "services"]);
const DEFAULT_TIMEOUT_MS = 25000;
const MAX_PAYLOAD_BYTES = 32 * 1024;
const MAX_TEXT_FIELD_LENGTH = 2000;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const DEFAULT_RATE_LIMIT = 30;

const memoryBuckets = new Map();

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const requestId = request.headers.get("X-Request-ID") || createId("REQ");

    if (request.method === "OPTIONS") {
      if (!isOriginAllowed(env, request)) {
        return jsonResponse({
          success: false,
          error: { code: "ORIGIN_NOT_ALLOWED", message: "Origin is not allowed." },
          requestId
        }, 403, env, request);
      }
      return corsResponse(null, 204, env, request);
    }

    if (request.method === "GET" && url.pathname === "/api/health") {
      return jsonResponse({
        success: true,
        status: "ok",
        service: "solar-forms-worker",
        timestamp: new Date().toISOString(),
        requestId
      }, 200, env, request);
    }

    if (request.method !== "POST" || url.pathname !== "/api/submit") {
      return jsonResponse({
        success: false,
        error: { code: "NOT_FOUND", message: "Endpoint not found." },
        requestId
      }, 404, env, request);
    }

    return handleSubmit(request, env, requestId);
  }
};

async function handleSubmit(request, env, requestId) {
  const startedAt = Date.now();

  try {
    assertConfigured(env);
    assertAllowedOrigin(env, request);
    assertContentType(request);
    const rawPayload = await readJsonBody(request);

    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    const rateLimit = Math.max(1, Number(env.RATE_LIMIT_REQUESTS || DEFAULT_RATE_LIMIT) || DEFAULT_RATE_LIMIT);
    if (!(await isRateLimitAllowed(env, ip, rateLimit))) {
      return jsonResponse({
        success: false,
        error: { code: "RATE_LIMITED", message: "Too many submissions. Please try again in a minute." },
        requestId
      }, 429, env, request, { "Retry-After": "60" });
    }

    const normalized = normalizePayload(rawPayload, request, requestId);
    validatePayload(normalized);

    if (isSpam(normalized)) {
      return jsonResponse({
        success: true,
        message: "Submission received.",
        requestId,
        filtered: true
      }, 200, env, request);
    }

    if (env.TURNSTILE_SECRET_KEY && !normalized.turnstileToken && String(env.TURNSTILE_REQUIRED || "").toLowerCase() === "true") {
      return jsonResponse({
        success: false,
        error: { code: "TURNSTILE_REQUIRED", message: "Security verification is required." },
        requestId
      }, 403, env, request);
    }

    if (env.TURNSTILE_SECRET_KEY && normalized.turnstileToken) {
      const turnstile = await verifyTurnstile(env.TURNSTILE_SECRET_KEY, normalized.turnstileToken, ip);
      if (!turnstile.success) {
        return jsonResponse({
          success: false,
          error: { code: "TURNSTILE_FAILED", message: "Security verification failed." },
          requestId
        }, 403, env, request);
      }
    }

    const backendResponse = await forwardToAppsScript(env, normalized, requestId);
    const responseMs = Date.now() - startedAt;

    return jsonResponse({
      ...backendResponse,
      requestId,
      formType: normalized.formType,
      edgeResponseTimeMs: responseMs
    }, backendResponse.success ? 200 : 502, env, request);
  } catch (error) {
    const status = error.status || 500;
    const log = {
      level: status >= 500 ? "error" : "warn",
      requestId,
      status,
      code: error.code || "WORKER_ERROR",
      message: error.message
    };
    if (status >= 500) log.stack = error.stack;
    console[status >= 500 ? "error" : "warn"](JSON.stringify(log));

    return jsonResponse({
      success: false,
      error: {
        code: error.code || "WORKER_ERROR",
        message: status >= 500 ? "Form service is temporarily unavailable." : error.message
      },
      requestId
    }, status, env, request);
  }
}

function assertConfigured(env) {
  if (!env.APPS_SCRIPT_URL || !/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(env.APPS_SCRIPT_URL)) {
    throw httpError(500, "APPS_SCRIPT_URL is not configured correctly.", "WORKER_MISCONFIGURED");
  }
}

function assertContentType(request) {
  const type = request.headers.get("Content-Type") || "";
  if (!type.includes("application/json")) {
    throw httpError(415, "Content-Type must be application/json.", "INVALID_CONTENT_TYPE");
  }
}

async function readJsonBody(request) {
  const length = Number(request.headers.get("Content-Length") || 0);
  if (length > MAX_PAYLOAD_BYTES) {
    throw httpError(413, "Payload is too large.", "PAYLOAD_TOO_LARGE");
  }

  const text = await request.text();
  if (new TextEncoder().encode(text).length > MAX_PAYLOAD_BYTES) {
    throw httpError(413, "Payload is too large.", "PAYLOAD_TOO_LARGE");
  }

  try {
    return JSON.parse(text);
  } catch {
    throw httpError(400, "Request body must be valid JSON.", "INVALID_JSON");
  }
}

function normalizePayload(input, request, requestId) {
  const sourceUrl = request.headers.get("Referer") || "";
  const userAgent = request.headers.get("User-Agent") || "";
  const data = input && typeof input.data === "object" && input.data !== null ? input.data : input;
  const type = normalizeFormType(input.formType || input.type || input.source || data?.type);

  return {
    requestId,
    formType: type,
    submittedAt: new Date().toISOString(),
    sourcePage: input.sourcePage || data?.sourcePage || sourceUrl,
    sourceUrl,
    userAgent: input.userAgent || userAgent,
    turnstileToken: input.turnstileToken || data?.turnstileToken || "",
    honeypot: input.website || input.companyWebsite || data?.website || data?.companyWebsite || "",
    data: normalizeData(type, data || {})
  };
}

function normalizeFormType(type) {
  const value = String(type || "").trim().toLowerCase();
  if (value === "quotation" || value === "quote") return "quotation";
  if (value === "roi" || value === "roi_lead") return "roi";
  if (value === "contact" || value === "messages") return "contact";
  if (value === "services" || value === "service") return "services";
  if (value.includes("quot")) return "quotation";
  if (value.includes("roi")) return "roi";
  if (value.includes("contact") || value.includes("message")) return "contact";
  if (value.includes("service") || value.includes("support")) return "services";
  return value;
}

function normalizeData(formType, data) {
  const clean = {};
  Object.keys(data).forEach((key) => {
    if (["turnstileToken", "website", "companyWebsite"].includes(key)) return;
    const value = data[key];
    clean[key] = normalizeFieldValue(value);
  });

  if (formType === "quotation") {
    clean.name = clean.fullName || clean.customerName || clean.name || "";
    clean.phone = clean.phone || "";
    clean.email = clean.email || "";
    clean.plantSize = clean.plantSize || clean.plantLabel || "";
  }

  if (formType === "roi") {
    clean.name = clean.name || clean.customerName || "";
    clean.phone = clean.phone || clean.customerPhone || "";
    clean.email = clean.email || "";
    clean.monthlyElectricityBill = clean.monthlyElectricityBill || clean.monthlyBill || clean.bill || "";
  }

  if (formType === "contact") {
    clean.name = clean.name || "";
    clean.phone = clean.phone || "";
    clean.email = clean.email || "";
    clean.message = clean.message || clean.problemDescription || "";
  }

  if (formType === "services") {
    clean.name = clean.name || "";
    clean.phone = clean.phone || "";
    clean.email = clean.email || "";
    clean.serviceType = clean.serviceType || clean.problem || "Service inquiry";
    clean.issueDescription = clean.issueDescription || clean.problemDescription || clean.description || clean.message || clean.problem || "";
  }

  return clean;
}

function normalizeFieldValue(value) {
  if (typeof value !== "string") return value;
  return value.trim().replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").slice(0, MAX_TEXT_FIELD_LENGTH);
}

function validatePayload(payload) {
  if (!FORM_TYPES.has(payload.formType)) {
    throw httpError(400, `Unknown form type: ${payload.formType || "missing"}.`, "UNKNOWN_FORM_TYPE");
  }

  const requiredByType = {
    quotation: ["name", "phone", "plantSize"],
    roi: ["name", "phone", "monthlyElectricityBill"],
    contact: ["name", "phone", "message"],
    services: ["name", "phone", "issueDescription"]
  };

  const missing = requiredByType[payload.formType].filter((field) => !String(payload.data[field] || "").trim());
  if (missing.length) {
    throw httpError(400, `Missing required field(s): ${missing.join(", ")}.`, "VALIDATION_FAILED");
  }

  if (!/^\+?\d[\d\s().-]{7,}$/.test(String(payload.data.phone || ""))) {
    throw httpError(400, "Please enter a valid phone number.", "INVALID_PHONE");
  }

  if (payload.data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(payload.data.email))) {
    throw httpError(400, "Please enter a valid email address.", "INVALID_EMAIL");
  }
}

function isSpam(payload) {
  return Boolean(String(payload.honeypot || "").trim());
}

async function verifyTurnstile(secret, token, ip) {
  const body = new FormData();
  body.append("secret", secret);
  body.append("response", token);
  body.append("remoteip", ip);

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body
  });

  try {
    return await response.json();
  } catch {
    return { success: false };
  }
}

async function forwardToAppsScript(env, payload, requestId) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(env.APPS_SCRIPT_TIMEOUT_MS || DEFAULT_TIMEOUT_MS));

  try {
    const response = await fetch(env.APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
      redirect: "follow",
      signal: controller.signal
    });

    const text = await response.text();
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      throw httpError(502, "Apps Script returned a non-JSON response.", "BAD_BACKEND_RESPONSE");
    }

    if (!response.ok || body.success !== true) {
      console.warn(JSON.stringify({ level: "warn", requestId, status: response.status, backend: body }));
      return {
        success: false,
        error: body.error || { code: "BACKEND_ERROR", message: "Google Sheets write failed." },
        backendStatus: response.status
      };
    }

    return body;
  } catch (error) {
    if (error.name === "AbortError") {
      throw httpError(504, "Apps Script timed out.", "BACKEND_TIMEOUT");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function isRateLimitAllowed(env, ip, limit) {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;

  if (env.RATE_LIMIT_KV) {
    const key = `rl:${ip}:${Math.floor(now / RATE_LIMIT_WINDOW_MS)}`;
    const current = Number((await env.RATE_LIMIT_KV.get(key)) || 0);
    if (current >= limit) return false;
    await env.RATE_LIMIT_KV.put(key, String(current + 1), { expirationTtl: 90 });
    return true;
  }

  const bucket = (memoryBuckets.get(ip) || []).filter((timestamp) => timestamp > windowStart);
  if (bucket.length >= limit) return false;
  bucket.push(now);
  memoryBuckets.set(ip, bucket);
  if (memoryBuckets.size > 10000) memoryBuckets.clear();
  return true;
}

function jsonResponse(data, status, env, request, extraHeaders = {}) {
  return corsResponse(JSON.stringify(data), status, env, request, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    "Pragma": "no-cache",
    "Expires": "0",
    ...extraHeaders
  });
}

function corsResponse(body, status, env, request, headers = {}) {
  const origin = request.headers.get("Origin") || "";
  const allowedOrigin = resolveAllowedOrigin(env, origin, new URL(request.url).origin);
  return new Response(body, {
    status,
    headers: {
      "Access-Control-Allow-Origin": allowedOrigin,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Request-ID, CF-Turnstile-Token, X-Turnstile-Token",
      "Access-Control-Max-Age": "86400",
      "Vary": "Origin",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
      ...headers
    }
  });
}

function assertAllowedOrigin(env, request) {
  if (!isOriginAllowed(env, request)) {
    throw httpError(403, "Origin is not allowed.", "ORIGIN_NOT_ALLOWED");
  }
}

function isOriginAllowed(env, request) {
  const origin = request.headers.get("Origin") || "";
  if (!origin) return true;
  const allowed = String(env.ALLOWED_ORIGINS || "").split(",").map((item) => item.trim()).filter(Boolean);
  if (allowed.includes("*")) return true;
  return resolveAllowedOrigin(env, origin, new URL(request.url).origin) === origin;
}

function resolveAllowedOrigin(env, origin, requestOrigin) {
  const allowed = String(env.ALLOWED_ORIGINS || "").split(",").map((item) => item.trim()).filter(Boolean);
  if (allowed.includes("*")) return "*";
  if (origin && (origin === requestOrigin || allowed.includes(origin))) return origin;
  return requestOrigin;
}

function httpError(status, message, code) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

function createId(prefix) {
  const stamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}_${stamp}_${random}`;
}
