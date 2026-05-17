(function () {
  const env = window.__VSS_ENV || {};

  function resolveApiEndpoint() {
    const configured = env.VSS_API_ENDPOINT || "/api/submit";
    const isRelativeApi = configured === "/api/submit";
    const isLocalHost = ["localhost", "127.0.0.1", ""].includes(window.location.hostname);
    const isWrongLocalServer = isLocalHost && window.location.port && window.location.port !== "8788";

    if (isRelativeApi && (window.location.protocol === "file:" || isWrongLocalServer)) {
      return "http://127.0.0.1:8788/api/submit";
    }

    return configured;
  }

  window.VSS_CONFIG = Object.freeze({
    apiEndpoint: resolveApiEndpoint(),
    requestTimeoutMs: 15000,
    requestRetries: 2,
    duplicateWindowMs: 5000,
    defaultSourcePage: document.title || window.location.pathname,
    pdf: Object.freeze({
      html2canvasLocal: "vendor/html2canvas.min.js",
      jspdfLocal: "vendor/jspdf.umd.min.js"
    })
  });
})();
