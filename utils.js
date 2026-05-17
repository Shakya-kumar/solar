/*
Shared utility functions used across multiple pages.
These functions are extracted to avoid duplication between script.js and roi.js.
*/

/**
 * Get the navigation type from performance API
 * @returns {string} Navigation type: "navigate", "reload", "back_forward", or "prerender"
 */
function getNavigationType() {
  try {
    const entry = performance.getEntriesByType?.("navigation")?.[0];
    if (entry && typeof entry.type === "string") return entry.type;
  } catch {
    // Ignore browsers that do not expose navigation timing entries.
  }
  return "navigate";
}

/**
 * Get html2canvas library from various possible locations
 * @returns {Function} html2canvas function
 * @throws {Error} If html2canvas is not loaded
 */
function getHtml2Canvas() {
  if (typeof html2canvas === "function") return html2canvas;
  if (window.html2canvas && typeof window.html2canvas === "function") return window.html2canvas;
  if (window.html2canvas && typeof window.html2canvas.default === "function") return window.html2canvas.default;
  throw new Error("html2canvas library is not loaded.");
}

/**
 * Get jsPDF library from various possible locations
 * @returns {Function} jsPDF constructor
 * @throws {Error} If jsPDF is not loaded
 */
function getJsPDF() {
  if (window.jspdf && typeof window.jspdf.jsPDF === "function") return window.jspdf.jsPDF;
  if (window.jspdf && window.jspdf.default && typeof window.jspdf.default.jsPDF === "function") return window.jspdf.default.jsPDF;
  if (typeof jsPDF === "function") return jsPDF;
  if (window.jsPDF && typeof window.jsPDF === "function") return window.jsPDF;
  throw new Error("jsPDF library is not loaded.");
}

/**
 * Format a number as Indian currency (INR) with commas
 * @param {number} value The number to format
 * @returns {string} Formatted currency string
 */
function formatINR(value) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.round(value || 0));
}

/**
 * Escape HTML special characters to prevent XSS
 * @param {*} value The value to escape
 * @returns {string} Escaped string
 */
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Load an external script dynamically
 * @param {string} src The URL of the script to load
 * @returns {Promise<void>} Resolves when script is loaded
 */
function loadExternalScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === "true" || existing.readyState === "complete") {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

/**
 * Load the first available script from a list of sources
 * @param {string[]} sources Array of script URLs to try
 * @returns {Promise<void>} Resolves when first script loads successfully
 */
async function loadFirstAvailableScript(sources) {
  let lastError = null;
  for (const src of sources) {
    try {
      await loadExternalScript(src);
      return;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error("No script sources available.");
}

async function ensurePdfLibraries() {
  try {
    getHtml2Canvas();
    getJsPDF();
    return;
  } catch {
    // Load missing libraries from local assets first, then CDN fallback locations.
  }

  if (!window.html2canvas || typeof window.html2canvas !== "function") {
    await loadFirstAvailableScript([
      "vendor/html2canvas.min.js",
      "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"
    ]);
  }

  if (!window.jspdf || !window.jspdf.jsPDF) {
    await loadFirstAvailableScript([
      "vendor/jspdf.umd.min.js",
      "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"
    ]);
  }

  getHtml2Canvas();
  getJsPDF();
}

async function waitForPdfSheetAssets(sheet) {
  if (document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // Continue if the browser does not expose reliable font loading status.
    }
  }

  const imagePromises = Array.from(sheet.querySelectorAll("img")).map((img) => {
    if (img.complete && img.naturalWidth > 0) return Promise.resolve();
    if (typeof img.decode === "function") {
      return img.decode().catch(() => undefined);
    }
    return new Promise((resolve) => {
      img.addEventListener("load", resolve, { once: true });
      img.addEventListener("error", resolve, { once: true });
    });
  });
  await Promise.all(imagePromises);
}
