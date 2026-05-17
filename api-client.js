(function () {
  const inflight = new Map();

  function getConfig() {
    return window.VSS_CONFIG || {};
  }

  function toText(value) {
    return String(value == null ? "" : value).trim();
  }

  function normalizePhone(value) {
    return toText(value).replace(/[^\d+]/g, "");
  }

  function sanitizeText(value, maxLength = 2000) {
    return toText(value).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").slice(0, maxLength);
  }

  function requireFields(payload, fields) {
    const missing = fields.filter((field) => !toText(payload[field]));
    if (missing.length) {
      throw new Error(`Missing required field: ${missing.join(", ")}`);
    }
  }

  function sourcePage(source) {
    return toText(source) || getConfig().defaultSourcePage || window.location.pathname;
  }

  function makeId(prefix) {
    return `${prefix}-${Date.now().toString().slice(-8)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  }

  function normalizeType(type) {
    const value = toText(type).toLowerCase();
    if (value === "quote" || value === "quotation") return "quotation";
    if (value === "roi" || value === "roi_lead") return "roi";
    if (value.includes("service")) return "service";
    if (value.includes("support")) return "support";
    if (value.includes("download")) return "download";
    if (value.includes("contact")) return "contact";
    return "general";
  }

  function sanitizeMoneyField(raw) {
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0) return "";
    return String(n);
  }

  function mapPayload(input) {
    const type = normalizeType(input.type || input.source);
    const source = sourcePage(input.sourcePage || input.source);

    if (type === "quotation") {
      const payload = {
        type: "quotation",
        quoteId: toText(input.quotationId || input.quoteNo) || makeId("VSQ"),
        fullName: sanitizeText(input.customerName || input.name, 160),
        phone: normalizePhone(input.phone),
        email: sanitizeText(input.email, 254),
        address: sanitizeText(input.address, 500),
        city: sanitizeText(input.city, 120),
        state: sanitizeText(input.state || input.stateName, 120),
        pincode: sanitizeText(input.pincode, 20),
        propertyType: toText(input.propertyType),
        roofType: toText(input.roofType),
        plantSize: toText(input.plantSize || input.plantLabel),
        solarPanel: toText(input.solarPanel || input.panelName || input.panel),
        inverter: toText(input.inverterName || input.inverter),
        battery: toText(input.battery),
        structureType: toText(input.structureType),
        subsidy: Number(input.subsidy || 0),
        totalCost: Number(input.totalCost || input.grossTotal || 0),
        netPayable: Number(input.netPayable || input.final_price || 0),
        monthlyBill: Number(input.monthlyBill || 0),
        monthlySavings: Number(input.monthlySavings || 0),
        roiYears: Number(input.roiYears || input.paybackYears || 0),
        paybackPeriod: toText(input.paybackPeriod || input.roiYears || input.paybackYears),
        installationType: toText(input.installationType || input.quoteType),
        sourcePage: source,
        pdfName: toText(input.pdfName),
        pdfStatus: toText(input.pdfStatus || "Downloaded")
      };
      requireFields(payload, ["fullName", "phone", "plantSize"]);
      return payload;
    }

    if (type === "roi") {
      const roi = input.roi || input;
      const payload = {
        type: "roi",
        leadId: toText(roi.reportId || input.leadId) || makeId("ROI"),
        name: sanitizeText(roi.customerName || input.name, 160),
        phone: normalizePhone(roi.customerPhone || input.phone),
        email: sanitizeText(input.email || roi.email, 254),
        city: sanitizeText(input.city, 120),
        state: sanitizeText(roi.location || input.state, 120),
        monthlyElectricityBill: sanitizeMoneyField(roi.bill ?? roi.monthlyBill ?? input.monthlyElectricityBill),
        roofArea: toText(roi.roofArea || input.roofArea),
        recommendedPlant: toText(roi.plantLabel || roi.recommendedPlant),
        estimatedCost: Number(roi.netCost || roi.baseCost || 0),
        estimatedSavings: Number(roi.monthlySavings || 0),
        roi: toText(roi.roi || roi.paybackYears),
        payback: toText(roi.payback || roi.paybackYears),
        sourcePage: source
      };
      requireFields(payload, ["name", "phone", "monthlyElectricityBill"]);
      return payload;
    }

    if (type === "service") {
      const payload = {
        type: "service",
        requestId: makeId("SRV"),
        name: sanitizeText(input.name, 160),
        phone: normalizePhone(input.phone),
        email: sanitizeText(input.email, 254),
        address: sanitizeText(input.address, 500),
        city: sanitizeText(input.city, 120),
        serviceType: sanitizeText(input.serviceType || input.problem || input.type, 160),
        issueDescription: sanitizeText(input.issueDescription || input.message || input.problem),
        preferredVisitDate: toText(input.preferredVisitDate),
        sourcePage: source
      };
      requireFields(payload, ["name", "phone", "issueDescription"]);
      return payload;
    }

    if (type === "support") {
      const payload = {
        type: "support",
        supportId: makeId("SUP"),
        name: sanitizeText(input.name, 160),
        phone: normalizePhone(input.phone),
        email: sanitizeText(input.email, 254),
        problemType: sanitizeText(input.problemType || input.problem, 160),
        problemDescription: sanitizeText(input.problemDescription || input.message),
        deviceType: sanitizeText(input.deviceType, 160),
        priority: sanitizeText(input.priority || "Normal", 80),
        sourcePage: source
      };
      requireFields(payload, ["name", "phone", "problemDescription"]);
      return payload;
    }

    if (type === "download") {
      const payload = {
        type: "download",
        downloadId: makeId("DWN"),
        name: sanitizeText(input.name, 160),
        phone: normalizePhone(input.phone),
        email: sanitizeText(input.email, 254),
        pdfType: sanitizeText(input.pdfType, 160),
        downloadStatus: toText(input.downloadStatus || "Downloaded"),
        sourcePage: source
      };
      requireFields(payload, ["name", "phone", "pdfType"]);
      return payload;
    }

    if (type === "contact") {
      const payload = {
        type: "contact",
        messageId: makeId("MSG"),
        name: sanitizeText(input.name, 160),
        email: sanitizeText(input.email, 254),
        phone: normalizePhone(input.phone),
        subject: sanitizeText(input.subject || "Website contact", 160),
        message: sanitizeText(input.message),
        sourceUrl: window.location.href,
        sourcePage: source
      };
      requireFields(payload, ["name", "phone", "message"]);
      return payload;
    }

    const payload = {
      type: "general",
      leadId: makeId("LED"),
      name: sanitizeText(input.name, 160),
      phone: normalizePhone(input.phone),
      email: sanitizeText(input.email, 254),
      city: sanitizeText(input.city, 120),
      interestType: sanitizeText(input.interestType || input.type || "Website lead", 160),
      message: sanitizeText(input.message || input.problem),
      sourcePage: source
    };
    requireFields(payload, ["name", "phone"]);
    return payload;
  }

  function dedupeKey(payload) {
    return JSON.stringify([payload.type, payload.quoteId, payload.leadId, payload.messageId, payload.requestId, payload.supportId, payload.downloadId, payload.phone]);
  }

  function sleep(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  async function postWithTimeout(url, payload, timeoutMs) {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "X-Request-ID": payload.requestId || makeId("REQ")
        },
        body: JSON.stringify({
          formType: payload.type,
          sourcePage: payload.sourcePage,
          data: payload
        }),
        cache: "no-store",
        signal: controller.signal
      });
      const text = await response.text();
      let data = null;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(describeNonJsonResponse(url, response, text));
      }
      if (!response.ok || data.success !== true) {
        throw new Error(data.error?.message || data.error || `Form service returned HTTP ${response.status}.`);
      }
      return data;
    } finally {
      window.clearTimeout(timer);
    }
  }

  function describeNonJsonResponse(url, response, text) {
    const endpoint = String(url || "");
    const status = response.status ? `HTTP ${response.status}` : "an empty status";
    const contentType = response.headers.get("Content-Type") || "unknown content type";
    const looksHtml = /^\s*</.test(text || "") || contentType.includes("text/html");
    const isSameOriginApi = endpoint === "/api/submit" || endpoint.endsWith("/api/submit");

    if (isSameOriginApi && looksHtml) {
      return `Form API route /api/submit returned HTML instead of JSON (${status}). Run or deploy the Cloudflare Pages Function, or set VSS_API_ENDPOINT to a deployed Worker endpoint.`;
    }

    if (looksHtml) {
      return `Form service returned HTML instead of JSON (${status}). Check that the form endpoint is the Worker /api/submit route, not a static page or Google login/error page.`;
    }

    return `Form service returned a non-JSON response (${status}, ${contentType}).`;
  }

  async function submitLead(rawPayload) {
    const config = getConfig();
    if (!config.apiEndpoint) {
      throw new Error("Form API endpoint is not configured. Set VSS_API_ENDPOINT or deploy the Cloudflare Worker at /api/submit.");
    }

    const payload = mapPayload(rawPayload);
    const key = dedupeKey(payload);
    const now = Date.now();
    const existing = inflight.get(key);
    if (existing && now - existing.startedAt < (config.duplicateWindowMs || 5000)) {
      return existing.promise;
    }

    const promise = (async () => {
      let lastError = null;
      const attempts = Math.max(1, Number(config.requestRetries || 0) + 1);
      for (let attempt = 1; attempt <= attempts; attempt += 1) {
        try {
          return await postWithTimeout(config.apiEndpoint, payload, config.requestTimeoutMs || 15000);
        } catch (error) {
          lastError = error;
          if (attempt < attempts) await sleep(500 * attempt);
        }
      }
      throw lastError || new Error("Submission failed.");
    })();

    inflight.set(key, { startedAt: now, promise });
    try {
      return await promise;
    } finally {
      window.setTimeout(() => inflight.delete(key), config.duplicateWindowMs || 5000);
    }
  }

  window.VSS_API = Object.freeze({
    submitLead,
    mapPayload,
    makeId
  });
})();
