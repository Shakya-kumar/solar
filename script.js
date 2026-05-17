/*
Quotation flow maintenance guide:
- Change the pricing arrays below to update plant, kit, inverter, and panel options.
- Change the form submission payload and backend logic to alter how quote data is shared.
- Change the invoice renderers to alter the downloadable quotation layout.
*/
const GST_RATE = 0.138;
const QUOTE_STATE_STORAGE_KEY = "vaibhav_quotation_state";
const QUOTE_PREFILL_STORAGE_KEY = "vaibhav_quote_prefill";
const QUOTE_STATUS_ELEMENT_ID = "quoteStatusMessage";
<<<<<<< HEAD
let quoteSubmissionInProgress = false;
=======
>>>>>>> 81f5cb3012d451a619506ecba522b329391da7eb

function getQuoteStatusContainer() {
  let container = document.getElementById(QUOTE_STATUS_ELEMENT_ID);
  if (!container) {
    container = document.createElement("div");
    container.id = QUOTE_STATUS_ELEMENT_ID;
    container.className = "status-banner status-info";
    document.body.insertBefore(container, document.body.firstChild);
  }
  return container;
}

function setQuoteStatus(message, type = "info") {
  const container = getQuoteStatusContainer();
  if (!container) return;
  container.textContent = message;
  container.className = `status-banner status-${type}`;
  container.style.display = message ? "block" : "none";
}

function setQuoteRetryStatus(message) {
  const container = getQuoteStatusContainer();
  if (!container) return;
  container.className = "status-banner status-error status-with-action";
  container.innerHTML = `<span>${escapeHtml(message)}</span><button class="status-retry-btn" type="button" data-retry-quote-pdf>Retry PDF</button>`;
  container.style.display = "flex";
}

<<<<<<< HEAD
async function submitQuotePayload(payload) {
  if (!window.VSS_API?.submitLead) throw new Error("Submission module is not loaded.");
  return window.VSS_API.submitLead({
    ...payload,
    type: "quotation",
    sourcePage: "Quotation Page",
    pdfName: `vaibhav-quotation-${payload.quotationId || payload.quoteNo || "quote"}.pdf`,
    pdfStatus: "Downloaded"
  });
=======
const GOOGLE_SHEETS_URL = "https://script.google.com/macros/s/AKfycbx6PeY1ywgHn7S81tBsOUvIqne2JIqpleEDywMrbEm55mw10MNM0poq8bxnI4c4SwCO/exec";
const GOOGLE_SHEET_SAVE_RETRY_DELAY = 800;
const GOOGLE_SHEET_SAVE_MAX_RETRIES = 2;
const SENT_QUOTES = new Set();

function buildSheetPayload(quotePayload) {
  return {
    type: "QUOTE",
    quoteNo: quotePayload.quoteNo || `VSQ-${Date.now().toString().slice(-8)}`,
    timestamp: new Date().toISOString(),
    name: quotePayload.name || "-",
    phone: quotePayload.phone || "-",
    plantSize: quotePayload.plantLabel || `${quotePayload.plantKw || 0}kW`,
    inverter: quotePayload.inverterName || "-",
    panel: quotePayload.panelName || "-",
    kit: quotePayload.kitName || "-",
    totalCost: quotePayload.grossTotal || 0,
    subsidy: quotePayload.subsidy || 0,
    netPayable: quotePayload.netPayable || 0,
    monthlyBill: quotePayload.monthlyBill || 0,
    monthlySavings: quotePayload.monthlySavings || 0,
    source: "quotation_page"
  };
}

async function sendQuoteToSheet(quotePayload) {
  const sheetData = buildSheetPayload(quotePayload);
  if (SENT_QUOTES.has(sheetData.quoteNo)) {
    console.info("Duplicate quote prevented:", sheetData.quoteNo);
    return { status: "duplicate", quoteNo: sheetData.quoteNo };
  }

  console.log("[QUOTE] Sending payload:", sheetData);
  
  let lastError = null;
  for (let attempt = 1; attempt <= GOOGLE_SHEET_SAVE_MAX_RETRIES; attempt += 1) {
    try {
      const response = await fetch(GOOGLE_SHEETS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sheetData)
      });

      if (!response.ok) {
        const bodyText = await response.text().catch(() => "<no response body>");
        throw new Error(`HTTP ${response.status}: ${bodyText}`);
      }

      const result = await response.json().catch(() => {
        throw new Error("Invalid JSON response from server");
      });

      if (result.status === "success") {
        SENT_QUOTES.add(sheetData.quoteNo);
        console.log("[QUOTE] ✅ Saved:", result);
        return result;
      } else {
        throw new Error(result.message || "Server returned error");
      }
    } catch (error) {
      lastError = error;
      console.warn(`[QUOTE] Attempt ${attempt} failed:`, error.message);
      if (attempt < GOOGLE_SHEET_SAVE_MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, GOOGLE_SHEET_SAVE_RETRY_DELAY));
      }
    }
  }

  console.error("[QUOTE] All attempts failed. Final error:", lastError);
  SENT_QUOTES.add(sheetData.quoteNo);
  return { status: "error", message: lastError?.message, quoteNo: sheetData.quoteNo };
>>>>>>> 81f5cb3012d451a619506ecba522b329391da7eb
}

// Updated all-in pricing (includes all other costs) per latest sheet.
// `referencePrice` is the company reference price used for normalization.
const plantData = [
  { kw: 3, label: "3kW", referencePrice: 190000, subsidy: 78000 },
  { kw: 4, label: "4kW", referencePrice: 240000, subsidy: 78000 },
  { kw: 5, label: "5kW", referencePrice: 290000, subsidy: 78000 },
  { kw: 6, label: "6kW", referencePrice: 330000, subsidy: 78000 },
  { kw: 7, label: "7kW", referencePrice: 370000, subsidy: 78000 },
  { kw: 8, label: "8kW+", referencePrice: 410000, subsidy: 78000 }
];

const kits = [
  {
    name: "Tata Solar Kit",
    priceAdjustment: 12000,
    note: "Complete Tata Power Solar package with matched system components.",
    logo: "images/tata solar power.jpg",
    kitLogoAlt: "Tata Power Solar logo",
    inverterName: "Tata Power Solar inverter package",
    panelName: "Tata Power Solar module package",
    warranty: "25 Years module warranty"
  },
  {
    name: "Waaree Solar Kit",
    priceAdjustment: 8000,
    note: "Complete Waaree package with matched system components.",
    logo: "images/Waaree-Solar.png",
    kitLogoAlt: "Waaree Solar logo",
    inverterName: "Waaree solar inverter package",
    panelName: "Waaree solar module package",
    warranty: "25 Years module warranty"
  },
  {
    name: "Adani Solar Kit",
    priceAdjustment: 10000,
    note: "Complete Adani Solar package with matched system components.",
    logo: "images/AdaniPower.png",
    kitLogoAlt: "Adani Solar logo",
    inverterName: "Adani Solar inverter package",
    panelName: "Adani Solar module package",
    warranty: "25 Years module warranty"
  }
];

const inverters = [
  { name: "Havells Solar Inverter", warranty: "10 Years", logo: "images/Havells-Logo.svg", alias: "Havells" },
  { name: "Polycab Solar Inverter", warranty: "10 Years", logo: "images/Polycab-Logo.png", alias: "Polycab" },
  { name: "Waaree Solar Inverter", warranty: "10 Years", logo: "images/Waaree-Solar.png", alias: "Waaree" },
  { name: "Sungrow Solar Inverter", warranty: "10 Years", logo: "images/Sungrow_Power_Supply.svg", alias: "Sungrow" },
  { name: "Others", warranty: "Custom", logo: "", alias: "Others", fallbackName: "Custom Inverter" }
];

const panels = [
  { name: "Waaree Solar Panel 545W", warranty: "25 Years", logo: "images/Waaree-Solar.png", alias: "Waaree" },
  { name: "Adani Solar Panel 545W", warranty: "25 Years", logo: "images/AdaniPower.png", alias: "Adani" },
  { name: "Others", warranty: "Custom", logo: "", alias: "Others", fallbackName: "Custom Panel" }
];

const appState = {
  step: 1,
  monthlyBill: 0,
  stateName: "",
  city: "",
  propertyType: "",
  plant: null,
  kit: null,
  inverter: null,
  panel: null,
  quoteNo: "",
  generatedAt: "",
  systemType: kits[0].name,
  lastAutoSelectionNote: ""
};

function formatINR(value) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.round(value || 0));
}

function formatMoney(value) {
  return `INR ${formatINR(value || 0)}`;
}

function roundToNearestThousand(value) {
  return Math.round((value || 0) / 1000) * 1000;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

<<<<<<< HEAD
/** True after the user changes quote data; blocks accidental navigation away from the wizard. */
let quoteWizardDirty = false;
/** True after PDF + server save succeeded — user may leave freely. */
let quoteWizardCompleted = false;

function markQuoteDirty() {
  quoteWizardDirty = true;
  quoteWizardCompleted = false;
}

function markQuoteFlowCompleted() {
  quoteWizardDirty = false;
  quoteWizardCompleted = true;
}

function resetQuoteFlowFlags() {
  quoteWizardDirty = false;
  quoteWizardCompleted = false;
=======
function markQuoteDirty() {}

function getNavigationType() {
  try {
    const entry = performance.getEntriesByType?.("navigation")?.[0];
    if (entry && typeof entry.type === "string") return entry.type;
  } catch {
    // Ignore browsers that do not expose navigation timing entries.
  }
  return "navigate";
}

function getHtml2Canvas() {
  if (typeof html2canvas === "function") return html2canvas;
  if (window.html2canvas && typeof window.html2canvas === "function") return window.html2canvas;
  if (window.html2canvas && typeof window.html2canvas.default === "function") return window.html2canvas.default;
  throw new Error("html2canvas library is not loaded.");
}

function getJsPDF() {
  if (window.jspdf && typeof window.jspdf.jsPDF === "function") return window.jspdf.jsPDF;
  if (window.jspdf && window.jspdf.default && typeof window.jspdf.default.jsPDF === "function") return window.jspdf.default.jsPDF;
  if (typeof jsPDF === "function") return jsPDF;
  if (window.jsPDF && typeof window.jsPDF === "function") return window.jsPDF;
  throw new Error("jsPDF library is not loaded.");
}

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
  throw lastError || new Error("Unable to load PDF library.");
>>>>>>> 81f5cb3012d451a619506ecba522b329391da7eb
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

function insertPdfPageBreakSpacers(sheet, pageHeightCss) {
  sheet.querySelectorAll(".pdf-page-spacer").forEach((spacer) => spacer.remove());
  const avoidSplitSelector = [
    ".proposal-card",
    ".proposal-total-focus",
    ".proposal-footnote",
    ".invoice-panel",
    ".quote-total-banner",
    ".invoice-note"
  ].join(",");

  for (let pass = 0; pass < 12; pass += 1) {
    let inserted = false;
    const sheetTop = sheet.getBoundingClientRect().top;
    const avoidSplitElements = Array.from(sheet.querySelectorAll(avoidSplitSelector));

    for (const element of avoidSplitElements) {
      const rect = element.getBoundingClientRect();
      const top = rect.top - sheetTop;
      const height = rect.height;
      if (height <= 0 || height >= pageHeightCss - 48) continue;

      const currentPageTop = Math.floor(top / pageHeightCss) * pageHeightCss;
      const currentPageBottom = currentPageTop + pageHeightCss;
      const startsNearPageTop = top - currentPageTop < 32;
      const crossesPageBottom = top + height > currentPageBottom - 28;

      if (!startsNearPageTop && crossesPageBottom) {
        const spacer = document.createElement("div");
        const spacerHeight = Math.ceil(currentPageBottom - top) + 18;
        spacer.className = "pdf-page-spacer";
        spacer.style.height = `${spacerHeight}px`;
        spacer.style.pointerEvents = "none";
        if (spacerHeight >= 90) {
          spacer.innerHTML = `
            <div class="pdf-spacer-mark">
              <span>Vaibhav Solar Solutions</span>
              <strong>Proposal continues on next page</strong>
            </div>
          `;
        }
        element.parentNode.insertBefore(spacer, element);
        inserted = true;
        break;
      }
    }

    if (!inserted) break;
  }
}

function addPdfPageFooter(pdf, pageWidth, pageHeight, pageNumber) {
  pdf.setDrawColor("#d7e4d4");
  pdf.line(28, pageHeight - 14, pageWidth - 28, pageHeight - 14);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7);
  pdf.setTextColor("#5c6b61");
  pdf.text("Vaibhav Solar Solutions | +91 9301533258 | +91 9111533258", 30, pageHeight - 7);
  pdf.text(`Page ${pageNumber}`, pageWidth - 58, pageHeight - 7);
}

async function renderSheetHtmlToPdfBlob(html, emptyMessage) {
  await ensurePdfLibraries();
  const html2canvasFn = getHtml2Canvas();
  const JsPDF = getJsPDF();
  const captureSheet = document.createElement("article");
  captureSheet.className = "download-sheet pdf-capture-sheet";
  captureSheet.innerHTML = html;
  Object.assign(captureSheet.style, {
    position: "absolute",
    left: "0",
    top: "0",
    width: "900px",
    margin: "0",
    opacity: "1",
    visibility: "visible",
    pointerEvents: "none",
    transform: "none",
    zIndex: "2147483647",
    background: "#ffffff",
    overflow: "hidden"
  });
  document.body.appendChild(captureSheet);

  try {
    await waitForPdfSheetAssets(captureSheet);
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    const pdf = new JsPDF({ unit: "pt", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const imgWidth = pageWidth - margin * 2;
    const pageHeightCss = ((pageHeight - margin * 2) * captureSheet.offsetWidth) / imgWidth;
    insertPdfPageBreakSpacers(captureSheet, pageHeightCss);
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    const canvas = await html2canvasFn(captureSheet, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      allowTaint: true,
      scrollX: 0,
      scrollY: 0,
      windowWidth: 1000
    });
    if (!canvas.width || !canvas.height) {
      throw new Error(emptyMessage);
    }

    const pageCanvasHeight = Math.floor((pageHeight - margin * 2) * canvas.width / imgWidth);
    let sourceY = 0;
    let pageIndex = 0;

    while (sourceY < canvas.height) {
      const sliceHeight = Math.min(pageCanvasHeight, canvas.height - sourceY);
      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = canvas.width;
      pageCanvas.height = sliceHeight;
      const ctx = pageCanvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
      ctx.drawImage(canvas, 0, sourceY, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);

      if (pageIndex > 0) pdf.addPage();
      const imgHeight = (sliceHeight * imgWidth) / canvas.width;
      pdf.addImage(pageCanvas.toDataURL("image/jpeg", 0.95), "JPEG", margin, margin, imgWidth, imgHeight);
      addPdfPageFooter(pdf, pageWidth, pageHeight, pageIndex + 1);
      sourceY += sliceHeight;
      pageIndex += 1;
    }

    return pdf.output("blob");
  } finally {
    captureSheet.remove();
  }
}

const pages = Array.from(document.querySelectorAll(".step-page"));
if (pages.length) {
  const steps = Array.from(document.querySelectorAll("#stepper li"));
  const plantOptions = document.getElementById("plantOptions");
  const kitSelector = document.getElementById("kitSelector");
  const inverterSelector = document.getElementById("inverterSelector");
  const panelSelector = document.getElementById("panelSelector");
  const quotePreview = document.getElementById("quotePreview");
  const downloadContent = document.getElementById("downloadContent");
  const quoteMeta = document.getElementById("quoteMeta");
  const autoSelectionNote = document.getElementById("autoSelectionNote");
  const inverterOtherWrap = document.getElementById("inverterOtherWrap");
  const inverterOtherInput = document.getElementById("inverterOtherInput");
  const panelOtherWrap = document.getElementById("panelOtherWrap");
  const panelOtherInput = document.getElementById("panelOtherInput");

  const monthlyBillEl = document.getElementById("wizardMonthlyBill");
  const stateEl = document.getElementById("wizardState");
  const cityEl = document.getElementById("wizardCity");
  const propertyTypeEl = document.getElementById("propertyType");
  const customerNameEl = document.getElementById("customerName");
  const customerPhoneEl = document.getElementById("customerPhone");
  const customerEmailEl = document.getElementById("customerEmail");
  const customerLocationEl = document.getElementById("customerLocation");

  async function generateQuotePdfBlobClientSide() {
    const quoteMetaText = quoteMeta?.textContent || "";
    const quoteHtml = quoteDownloadHtml();
    downloadContent.innerHTML = quoteHtml;
    return renderSheetHtmlToPdfBlob(`
      <div class="sheet-header invoice-header">
        <div class="invoice-brand">
          <img src="brand-logo.png" alt="Vaibhav Solar Solutions logo" class="invoice-logo" />
          <div>
            <h3>VAIBHAV SOLAR SOLUTIONS</h3>
            <p>Solar System Quotation</p>
            <small>${escapeHtml(quoteMetaText)}</small>
          </div>
        </div>
      </div>
      <div id="downloadContent">${quoteHtml}</div>
    `, "Quotation PDF content could not be rendered.");
  }

  async function generateQuotePdfBlobSimple(quote) {
    await ensurePdfLibraries();
    const JsPDF = getJsPDF();
    const pdf = new JsPDF({ unit: "pt", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 42;
    let y = 48;

    const addText = (text, size = 10, style = "normal", color = "#202420") => {
      pdf.setFont("helvetica", style);
      pdf.setFontSize(size);
      pdf.setTextColor(color);
      const lines = pdf.splitTextToSize(String(text || "-"), pageWidth - margin * 2);
      pdf.text(lines, margin, y);
      y += lines.length * (size + 4) + 6;
    };
    const addRow = (label, value) => {
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.setTextColor("#5c6b61");
      pdf.text(String(label), margin, y);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor("#202420");
      pdf.text(pdf.splitTextToSize(String(value || "-"), pageWidth - margin * 2 - 150), margin + 150, y);
      y += 18;
    };
    const addSection = (title) => {
      y += 8;
      pdf.setDrawColor("#d7e4d4");
      pdf.line(margin, y, pageWidth - margin, y);
      y += 18;
      addText(title, 12, "bold", "#bf6c2b");
    };

    pdf.setFillColor("#0f5c27");
    pdf.roundedRect(36, 34, pageWidth - 72, 72, 14, 14, "F");
    pdf.setTextColor("#ffffff");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);
    pdf.text("VAIBHAV SOLAR SOLUTIONS", 54, 66);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.text("Solar System Quotation", 54, 84);
    pdf.text(`Quotation ID: ${quote.quoteNo || "-"}`, pageWidth - 210, 66);
    y = 132;

    addSection("Customer Details");
    addRow("Name", quote.name);
    addRow("Phone", quote.phone);
    addRow("Email", quote.email);
    addRow("Address", quote.location);
    addRow("Property Type", quote.propertyType);

    addSection("Selected Configuration");
    addRow("Plant Size", quote.plantLabel || `${quote.plantKw || 0}kW`);
    addRow("Quote Type", quote.systemType);
    addRow("Kit", quote.kitName);
    addRow("Panel", quote.panelName);
    addRow("Inverter", quote.inverterName);

    addSection("Financial Summary");
    addRow("Total Cost", formatMoney(quote.grossTotal));
    addRow("Government Subsidy", formatMoney(quote.subsidy));

    y += 12;
    pdf.setFillColor("#0f5c27");
    pdf.roundedRect(margin, y, pageWidth - margin * 2, 54, 14, 14, "F");
    pdf.setTextColor("#ffffff");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.text("NET PAYABLE", margin + 18, y + 22);
    pdf.setFontSize(20);
    pdf.text(formatMoney(quote.netPayable), margin + 18, y + 45);

    return pdf.output("blob");
  }

  async function downloadAndShareQuote() {
<<<<<<< HEAD
    if (quoteSubmissionInProgress) return;
=======
>>>>>>> 81f5cb3012d451a619506ecba522b329391da7eb
    if (!customerNameEl.value || !customerPhoneEl.value) {
      setQuoteStatus("Please enter customer name and phone before downloading.", "error");
      return;
    }
    if (!validateEquipmentSelection()) {
      setQuoteStatus("Please complete equipment selection before downloading.", "error");
      return;
    }
<<<<<<< HEAD
    quoteSubmissionInProgress = true;
    const downloadButton = document.getElementById("downloadQuote");
    if (downloadButton) downloadButton.disabled = true;
=======
>>>>>>> 81f5cb3012d451a619506ecba522b329391da7eb
    ensureQuoteMeta();
    const quotePayload = buildQuotePayload();
    setQuoteStatus("Generating your quotation PDF. Please wait...", "info");

    let pdfBlob = null;
    try {
      pdfBlob = await generateQuotePdfBlobClientSide();
<<<<<<< HEAD
    } catch {
=======
    } catch (clientErr) {
>>>>>>> 81f5cb3012d451a619506ecba522b329391da7eb
      try {
        pdfBlob = await generateQuotePdfBlobSimple(quotePayload);
      } catch (simpleErr) {
        setQuoteRetryStatus(`PDF generation failed: ${simpleErr.message}. Please try again.`);
<<<<<<< HEAD
        quoteSubmissionInProgress = false;
        if (downloadButton) downloadButton.disabled = false;
=======
>>>>>>> 81f5cb3012d451a619506ecba522b329391da7eb
        return;
      }
    }

    try {
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const downloadLink = document.createElement("a");
      downloadLink.href = pdfUrl;
      downloadLink.download = `vaibhav-quotation-${appState.quoteNo}.pdf`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      window.setTimeout(() => URL.revokeObjectURL(pdfUrl), 5000);

<<<<<<< HEAD
      setQuoteStatus("PDF downloaded. Saving quotation to your records...", "info");

      await submitQuotePayload(quotePayload);
      markQuoteFlowCompleted();
      setQuoteStatus("Quotation generated, downloaded, and saved successfully.", "success");
    } catch (err) {
      setQuoteRetryStatus(`PDF downloaded, but saving failed: ${err.message}. Please try again.`);
    } finally {
      quoteSubmissionInProgress = false;
      if (downloadButton) downloadButton.disabled = false;
=======
      setQuoteStatus("Quotation downloaded. Saving quotation details to Google Sheets...", "info");
      sendQuoteToSheet(quotePayload)
        .then((result) => {
          console.info("Google Sheets save result:", result);
          setQuoteStatus("✅ Quotation downloaded successfully and saved to our database!", "success");
        })
        .catch((err) => {
          console.error("Sheet save failed:", err);
          setQuoteStatus("✅ Quotation downloaded successfully, but saving to Google Sheets failed. Please retry.", "warning");
        });
    } catch (err) {
      setQuoteRetryStatus(`Download failed: ${err.message}. Please try again.`);
>>>>>>> 81f5cb3012d451a619506ecba522b329391da7eb
    }
  }

  function saveQuotationState() {
    const state = {
      step: appState.step,
      monthlyBill: monthlyBillEl?.value || appState.monthlyBill || "",
      stateName: stateEl?.value || "",
      city: cityEl?.value || "",
      propertyType: propertyTypeEl?.value || "",
      plantKw: appState.plant?.kw || null,
      kitName: appState.kit?.name || null,
      inverterAlias: appState.inverter?.alias || null,
      panelAlias: appState.panel?.alias || null,
      inverterCustom: inverterOtherInput?.value || "",
      panelCustom: panelOtherInput?.value || "",
      customerName: customerNameEl?.value || "",
      customerPhone: customerPhoneEl?.value || "",
      customerEmail: customerEmailEl?.value || "",
      customerLocation: customerLocationEl?.value || "",
      quoteNo: appState.quoteNo,
      generatedAt: appState.generatedAt,
      timestamp: Date.now()
    };
    sessionStorage.setItem(QUOTE_STATE_STORAGE_KEY, JSON.stringify(state));
  }

  function loadQuotationState() {
    const saved = sessionStorage.getItem(QUOTE_STATE_STORAGE_KEY);
    if (!saved) return false;

    try {
      const state = JSON.parse(saved);
      appState.monthlyBill = Number(state.monthlyBill || 0);
      appState.stateName = state.stateName;
      appState.city = state.city;
      appState.propertyType = state.propertyType;
      appState.quoteNo = state.quoteNo;
      appState.generatedAt = state.generatedAt;
      appState.step = Math.min(4, Math.max(1, Number(state.step) || 1));

      if (customerNameEl) customerNameEl.value = state.customerName;
      if (customerPhoneEl) customerPhoneEl.value = state.customerPhone;
      if (customerEmailEl) customerEmailEl.value = state.customerEmail;
      if (customerLocationEl) customerLocationEl.value = state.customerLocation;
      if (stateEl) stateEl.value = state.stateName;
      if (cityEl) cityEl.value = state.city;
      if (propertyTypeEl) propertyTypeEl.value = state.propertyType;
      if (monthlyBillEl) monthlyBillEl.value = state.monthlyBill;

      if (state.plantKw) appState.plant = plantData.find((p) => p.kw === state.plantKw);
      if (state.kitName) appState.kit = kits.find((k) => k.name === state.kitName);
      if (state.inverterAlias) appState.inverter = inverters.find((i) => i.alias === state.inverterAlias);
      if (state.panelAlias) appState.panel = panels.find((p) => p.alias === state.panelAlias);
      if (inverterOtherInput && state.inverterCustom) inverterOtherInput.value = state.inverterCustom;
      if (panelOtherInput && state.panelCustom) panelOtherInput.value = state.panelCustom;

      syncSystemType();
<<<<<<< HEAD
      if (appState.step > 1 || (state.customerName && String(state.customerName).trim())) {
        markQuoteDirty();
      }
      return true;
    } catch {
=======
      return true;
    } catch (_e) {
>>>>>>> 81f5cb3012d451a619506ecba522b329391da7eb
      return false;
    }
  }

  function clearQuotationState() {
    sessionStorage.removeItem(QUOTE_STATE_STORAGE_KEY);
<<<<<<< HEAD
    resetQuoteFlowFlags();
=======
>>>>>>> 81f5cb3012d451a619506ecba522b329391da7eb
  }

  function getKitAdjustment() {
    return appState.kit?.priceAdjustment || 0;
  }

  function getDisplayComponentName(component, customValue) {
    if (!component) return "-";
    if (component.alias === "Others") {
      return customValue || component.fallbackName || "Other Brand";
    }
    return component.name;
  }

  function getComponentLogo(component) {
    return component?.logo ? component.logo : "";
  }

  function getSelectedInverterName() {
    if (appState.kit) return appState.kit.inverterName || `${appState.kit.name} inverter package`;
    return getDisplayComponentName(appState.inverter, inverterOtherInput?.value.trim());
  }

  function getSelectedPanelName() {
    if (appState.kit) return appState.kit.panelName || `${appState.kit.name} module package`;
    return getDisplayComponentName(appState.panel, panelOtherInput?.value.trim());
  }

  function getSelectedInverterLogo() {
    return appState.kit?.logo || getComponentLogo(appState.inverter);
  }

  function getSelectedPanelLogo() {
    return appState.kit?.logo || getComponentLogo(appState.panel);
  }

  function getSelectionLogoHtml(src, label, className = "proposal-brand-logo") {
    return src
      ? `<img class="${className}" src="${src}" alt="${escapeHtml(label)} logo" onerror="this.style.display='none'">`
      : `<div class="${className} placeholder"></div>`;
  }

  function getFinancialRows(q) {
    return [
      ["Total Cost", `Rs. ${formatINR(q.adjusted_total || q.grossTotal || 0)}`],
      ["Government Subsidy", `- Rs. ${formatINR(q.subsidy)}`],
      ["Net Payable", `Rs. ${formatINR(q.final_price || q.netPayable || 0)}`]
    ];
  }

  function getSelectedEquipmentItems() {
    if (appState.kit) {
      return [{
        type: "Kit",
        name: appState.kit.name,
        logo: appState.kit.logo || "",
        note: appState.kit.note || appState.kit.warranty || ""
      }];
    }

    return [
      {
        type: "Inverter",
        name: getSelectedInverterName(),
        logo: getSelectedInverterLogo(),
        note: appState.inverter?.warranty ? `Warranty: ${appState.inverter.warranty}` : ""
      },
      {
        type: "Panel",
        name: getSelectedPanelName(),
        logo: getSelectedPanelLogo(),
        note: appState.panel?.warranty ? `Warranty: ${appState.panel.warranty}` : ""
      }
    ];
  }

  function renderProposalEquipmentCards() {
    return getSelectedEquipmentItems().map((item) => `
      <div class="proposal-brand-card">
        <div class="proposal-brand-head">${escapeHtml(item.type)}</div>
        <div class="proposal-brand-body">
          ${getSelectionLogoHtml(item.logo, item.name)}
          <div class="proposal-brand-copy">
            <strong>${escapeHtml(item.name)}</strong>
            ${item.note ? `<span>${escapeHtml(item.note)}</span>` : ""}
          </div>
        </div>
      </div>
    `).join("");
  }

  function renderPreviewEquipmentCards() {
    return getSelectedEquipmentItems().map((item) => `
      <div class="quote-system-card">
        <span>${escapeHtml(item.type)}</span>
        ${getSelectionLogoHtml(item.logo, item.name, "quote-system-logo")}
        <strong>${escapeHtml(item.name)}</strong>
      </div>
    `).join("");
  }

  function getPricingPanelAlias() {
    if (!appState.kit) return appState.panel?.alias || "Waaree";
    if (/adani/i.test(appState.kit.name)) return "Adani";
    if (/waaree/i.test(appState.kit.name)) return "Waaree";
    return "Waaree";
  }

  function getQuoteTimestamp() {
    return appState.generatedAt || new Date().toISOString();
  }

  function buildBrandSelect(target, items, selectedItem, placeholder, key) {
    const selectedLabel = selectedItem
      ? `<div class="brand-select-value">
          ${selectedItem.logo ? `<img src="${selectedItem.logo}" alt="${escapeHtml(selectedItem.alias || selectedItem.name)} logo" onerror="this.style.display='none'">` : ''}
          <div>
            <strong>${escapeHtml(selectedItem.alias || selectedItem.name)}</strong>
            <small>${escapeHtml(selectedItem.warranty || selectedItem.note || placeholder)}</small>
          </div>
        </div>`
      : `<div class="brand-select-value"><div><strong>${escapeHtml(placeholder)}</strong><small>Tap to choose</small></div></div>`;

    target.innerHTML = `
      <div class="brand-select" data-select-key="${key}">
        <button class="brand-select-trigger" type="button" aria-expanded="false">
          ${selectedLabel}
          <span class="brand-select-caret"><i class="fas fa-chevron-down"></i></span>
        </button>
        <div class="brand-select-menu">
          ${items.map((item, index) => `
            <button class="brand-option ${selectedItem && selectedItem.name === item.name ? "is-selected" : ""}" type="button" data-select-option="${key}" data-index="${index}">
              <span class="brand-option-media">${item.logo ? `<img src="${item.logo}" alt="${escapeHtml(item.alias || item.name)} logo" onerror="this.style.display='none'">` : ''}</span>
              <span class="brand-option-text">
                <strong>${escapeHtml(item.alias || item.name)}</strong>
                <small>${escapeHtml(item.warranty || item.note || "Select option")}</small>
              </span>
            </button>
          `).join("")}
        </div>
      </div>
    `;
  }

  function renderPlants() {
    plantOptions.innerHTML = plantData
      .map((item, idx) => {
        const selected = appState.plant && appState.plant.kw === item.kw;
<<<<<<< HEAD
        return `<button type="button" class="select-card ${selected ? "selected" : ""}" data-key="plant" data-idx="${idx}">
=======
        return `<button class="select-card ${selected ? "selected" : ""}" data-key="plant" data-idx="${idx}">
>>>>>>> 81f5cb3012d451a619506ecba522b329391da7eb
          <strong>${item.label}</strong><span>Solar Plant</span></button>`;
      })
      .join("");
  }

  function renderEquipmentSelectors() {
    buildBrandSelect(kitSelector, kits, appState.kit, "Choose solar kit", "kit");
    buildBrandSelect(inverterSelector, inverters, appState.inverter, "Choose inverter brand", "inverter");
    buildBrandSelect(panelSelector, panels, appState.panel, "Choose solar panel brand", "panel");
    inverterOtherWrap.classList.toggle("hidden", appState.inverter?.alias !== "Others");
    panelOtherWrap.classList.toggle("hidden", appState.panel?.alias !== "Others");
    autoSelectionNote.textContent = appState.lastAutoSelectionNote || "";
  }

  function calculateQuote() {
    if (!appState.plant) return null;
    const plantSize = Number(appState.plant.kw || 0);
    const normalizedPlantSize = plantSize >= 8 ? 8 : plantSize;
    const panelRates = { waaree: 26, adani: 30 };
    const inverterCosts = { 3: 25000, 4: 30000, 5: 40000, 6: 50000, 7: 60000, 8: 80000 };
    const referencePrices = { 3: 190000, 4: 240000, 5: 290000, 6: 330000, 7: 370000, 8: 410000 };

    const panelKey = String(getPricingPanelAlias()).toLowerCase();
    const panelRate = panelRates[panelKey] ?? panelRates.waaree;
    const panel_cost = roundToNearestThousand(plantSize * 1000 * panelRate);
    const inverter_cost = roundToNearestThousand(inverterCosts[normalizedPlantSize] || 0);
    const installation_cost = roundToNearestThousand(plantSize * 12000);
    const transport = 4500;
    const earthing = 3600;
    const acdb = 3500;
    const netMetering = 11500;
    const wiring = roundToNearestThousand(Math.max(0, installation_cost - (transport + earthing + acdb + netMetering)));
    const subtotal = roundToNearestThousand(panel_cost + inverter_cost + installation_cost);
    const gst = roundToNearestThousand(subtotal * GST_RATE);
    const total_before_subsidy = roundToNearestThousand(subtotal + gst);
    const reference_price = referencePrices[normalizedPlantSize] || 0;
    const adjustment_factor = total_before_subsidy ? reference_price / total_before_subsidy : 1;
    const adjusted_total = roundToNearestThousand(total_before_subsidy * adjustment_factor);
    const subsidy = 78000;
    const final_price = roundToNearestThousand(Math.max(0, adjusted_total - subsidy));
    const price_per_kw = plantSize ? roundToNearestThousand(final_price / plantSize) : 0;
    const monthlySavings = Math.round(appState.monthlyBill * 0.85);
    const annualSavings = monthlySavings * 12;
    const paybackYears = annualSavings > 0 ? Number((final_price / annualSavings).toFixed(1)) : 0;
    const annualInterestRate = final_price < 200000 ? 5.75 : 9;
    const emi = Math.round((final_price * (1 + annualInterestRate / 100)) / 60);

    return {
      panel_cost,
      inverter_cost,
      installation_cost,
      subtotal,
      gst,
      total_before_subsidy,
      adjusted_total,
      subsidy,
      final_price,
      price_per_kw,
      grossTotal: adjusted_total,
      netPayable: final_price,
      emi,
      annualInterestRate: annualInterestRate,
      monthlySavings,
      annualSavings,
      paybackYears,
      transport,
      earthing,
      acdb,
      netMetering,
      wiring
    };
  }

  function invoiceHtml(mode = "preview") {
    const q = calculateQuote();
    if (!q) return "<p>Please complete all previous steps.</p>";
    const panelDisplayName = getSelectedPanelName();
    const inverterDisplayName = getSelectedInverterName();
    const kitDisplayName = appState.kit?.name || "Custom brand selection";
    const panelLogo = getSelectedPanelLogo();
    const inverterLogo = getSelectedInverterLogo();
    const kitLogo = appState.kit?.logo || "";

    const financialSummary = `
      <table class="quote-table bill-table">
        ${getFinancialRows(q).map(([label, value]) => `<tr><td>${label}</td><td>${value}</td></tr>`).join("")}
      </table>
    `;

    if (mode === "download") {
      const kitOrBrandsLabel = appState.kit?.name
        ? appState.kit.name
        : `${inverterDisplayName}, ${panelDisplayName}`;
      return `
        <div class="proposal-shell">
          <div class="proposal-top">
            <div class="proposal-meta">
              <div class="proposal-title">Solar Quotation</div>
              <div class="proposal-sub">Quotation ID: ${escapeHtml(appState.quoteNo || "Pending")} &bull; Date: ${escapeHtml(new Date(getQuoteTimestamp()).toLocaleDateString("en-IN"))}</div>
              <div class="proposal-sub">Quote Type: <strong>${escapeHtml(appState.systemType || "-")}</strong></div>
            </div>
            <div class="proposal-badges">
              <div class="proposal-badge">
                <span>Plant</span>
                <strong>${escapeHtml(appState.plant.label)}</strong>
              </div>
            </div>
          </div>

          <div class="proposal-grid">
            <section class="proposal-card">
              <div class="proposal-card-title">Customer Details</div>
              <div class="proposal-kv"><span>Name</span><strong>${escapeHtml(customerNameEl.value || "-")}</strong></div>
              <div class="proposal-kv"><span>Phone</span><strong>${escapeHtml(customerPhoneEl.value || "-")}</strong></div>
              <div class="proposal-kv"><span>Email</span><strong>${escapeHtml(customerEmailEl.value || "-")}</strong></div>
              <div class="proposal-kv"><span>Address</span><strong>${escapeHtml(customerLocationEl.value || "-")}</strong></div>
              <div class="proposal-kv"><span>Property Type</span><strong>${escapeHtml(appState.propertyType || "-")}</strong></div>
            </section>

            <section class="proposal-card">
              <div class="proposal-card-title">Quotation Snapshot</div>
              <div class="proposal-kv"><span>Quotation ID</span><strong>${escapeHtml(appState.quoteNo || "-")}</strong></div>
              <div class="proposal-kv"><span>Date & Time</span><strong>${escapeHtml(new Date(getQuoteTimestamp()).toLocaleString("en-IN"))}</strong></div>
              <div class="proposal-kv"><span>Plant Size</span><strong>${escapeHtml(appState.plant.label)}</strong></div>
              <div class="proposal-kv"><span>Selected</span><strong>${escapeHtml(kitOrBrandsLabel)}</strong></div>
              <div class="proposal-kv"><span>Monthly Bill</span><strong>Rs. ${formatINR(appState.monthlyBill)}</strong></div>
              <div class="proposal-kv"><span>Monthly Savings</span><strong>Rs. ${formatINR(q.monthlySavings)}</strong></div>
              <div class="proposal-kv"><span>Payback</span><strong>${q.paybackYears} years</strong></div>
            </section>
          </div>

          <section class="proposal-card proposal-full proposal-equipment-card">
            <div class="proposal-card-title proposal-centered-title">Selected Equipment</div>
            <div class="proposal-brand-grid ${appState.kit ? "single-equipment" : "dual-equipment"}">
              ${renderProposalEquipmentCards()}
            </div>
          </section>

          <section class="proposal-card proposal-full proposal-insight-panel">
            <div class="proposal-card-title proposal-centered-title">Savings & Benefits</div>
            <div class="proposal-insight-grid">
              <div class="proposal-insight-card bill">
                <span>Monthly Bill</span>
                <strong>Rs. ${formatINR(appState.monthlyBill)}</strong>
              </div>
              <div class="proposal-insight-card savings">
                <span>Monthly Savings</span>
                <strong>Rs. ${formatINR(q.monthlySavings)}</strong>
              </div>
              <div class="proposal-insight-card annual">
                <span>Annual Savings</span>
                <strong>Rs. ${formatINR(q.annualSavings)}</strong>
              </div>
              <div class="proposal-insight-card roi">
                <span>ROI Benefit</span>
                <strong>${q.paybackYears} Years</strong>
              </div>
            </div>
          </section>

          <section class="proposal-card proposal-full">
            <div class="proposal-card-title">Required Financial Summary</div>
            ${financialSummary}
          </section>
          <div class="proposal-footnote proposal-footnote-standalone">
            This quotation is valid for 30 days. Prices include standard installation scope, structure, ACDB, wiring, earthing, transportation, and net metering.
          </div>

          <div class="proposal-total-focus proposal-net-payable">
            <span>Net Payable</span>
            <strong>Rs. ${formatINR(q.final_price)}</strong>
          </div>
        </div>
      `;
    }

    const kitOrBrandsLabel = appState.kit?.name
      ? appState.kit.name
      : `${inverterDisplayName}, ${panelDisplayName}`;

    return `
      <div class="invoice-shell">
        <section class="quote-system-panel ${appState.kit ? "single-equipment" : "dual-equipment"}">
          ${renderPreviewEquipmentCards()}
        </section>
        <section class="quote-insight-grid">
          <div class="quote-insight-card bill">
            <span>Monthly Bill</span>
            <strong>Rs. ${formatINR(appState.monthlyBill)}</strong>
          </div>
          <div class="quote-insight-card savings">
            <span>Monthly Savings</span>
            <strong>Rs. ${formatINR(q.monthlySavings)}</strong>
          </div>
          <div class="quote-insight-card roi">
            <span>ROI Benefit</span>
            <strong>${q.paybackYears} Years</strong>
            <small>Estimated payback with Rs. ${formatINR(q.annualSavings)} yearly savings</small>
          </div>
        </section>
        <div class="invoice-grid">
          <section class="invoice-panel">
            <h4>Customer Details</h4>
            <p><strong>Name:</strong> ${escapeHtml(customerNameEl.value || "-")}</p>
            <p><strong>Phone:</strong> ${escapeHtml(customerPhoneEl.value || "-")}</p>
            <p><strong>Email:</strong> ${escapeHtml(customerEmailEl.value || "-")}</p>
            <p><strong>Address:</strong> ${escapeHtml(customerLocationEl.value || `${appState.city || "-"}, ${appState.stateName || "-"}`)}</p>
            <p><strong>Property Type:</strong> ${escapeHtml(appState.propertyType || "-")}</p>
          </section>
          <section class="invoice-panel">
            <h4>Quotation Snapshot</h4>
            <p><strong>Quotation ID:</strong> ${escapeHtml(appState.quoteNo || "Pending")}</p>
            <p><strong>Date & Time:</strong> ${escapeHtml(new Date(getQuoteTimestamp()).toLocaleString("en-IN"))}</p>
            <p><strong>Plant Size:</strong> ${escapeHtml(appState.plant.label)}</p>
            <p><strong>Selected:</strong> ${escapeHtml(kitOrBrandsLabel)}</p>
          </section>
        </div>
        <section class="invoice-panel quote-financial-panel">
          <h4>Financial Summary</h4>
          ${financialSummary}
        </section>
        <div class="quote-total-banner">
          <span>Net Payable</span>
          <strong>Rs. ${formatINR(q.final_price)}</strong>
        </div>
        <p class="invoice-note">This quotation is valid for 30 days. ${mode === "download" ? "Prices are summarized as bill values while component names are shown without individual pricing." : "Final printable bill layout will be downloaded from the next step."}</p>
      </div>
    `;
  }

  function quotePreviewHtml() {
    return invoiceHtml("preview");
  }

  function quoteDownloadHtml() {
    return invoiceHtml("download");
  }

  function saveStepHtml() {
    const q = calculateQuote();
    if (!q) return "<p>Please complete all previous steps.</p>";
<<<<<<< HEAD
    const locationLine = [customerLocationEl.value?.trim(), appState.city, appState.stateName].filter(Boolean).join(" · ") || "—";
=======
>>>>>>> 81f5cb3012d451a619506ecba522b329391da7eb
    return `
      <div class="quote-customer">
        <h4>Quotation Ready</h4>
        <p>Your quotation has been prepared in invoice format and is ready for download.</p>
        <p>Use the button below to download the PDF and send the quotation details directly to our team.</p>
      </div>
<<<<<<< HEAD
      <div class="quote-top-grid quote-top-grid--summary">
        <div class="mini-card"><span>Quotation ID</span><strong>${escapeHtml(appState.quoteNo || "-")}</strong></div>
        <div class="mini-card"><span>Customer</span><strong>${escapeHtml(customerNameEl.value || "-")}</strong></div>
        <div class="mini-card"><span>Phone</span><strong>${escapeHtml(customerPhoneEl.value || "-")}</strong></div>
        <div class="mini-card"><span>Email</span><strong>${escapeHtml(customerEmailEl.value || "—")}</strong></div>
        <div class="mini-card"><span>Address / City / State</span><strong>${escapeHtml(locationLine)}</strong></div>
        <div class="mini-card"><span>Property type</span><strong>${escapeHtml(appState.propertyType || "—")}</strong></div>
        <div class="mini-card"><span>Monthly electricity bill</span><strong>Rs. ${formatINR(appState.monthlyBill || 0)}</strong></div>
        <div class="mini-card"><span>Plant size</span><strong>${escapeHtml(appState.plant?.label || "-")}</strong></div>
        <div class="mini-card"><span>Equipment</span><strong>${escapeHtml(appState.systemType || "-")}</strong></div>
=======
      <div class="quote-top-grid">
        <div class="mini-card"><span>Quotation ID</span><strong>${escapeHtml(appState.quoteNo || "-")}</strong></div>
        <div class="mini-card"><span>Customer</span><strong>${escapeHtml(customerNameEl.value || "-")}</strong></div>
        <div class="mini-card"><span>Plant</span><strong>${escapeHtml(appState.plant?.label || "-")}</strong></div>
>>>>>>> 81f5cb3012d451a619506ecba522b329391da7eb
        <div class="mini-card net-payable-card"><span>Net Payable</span><strong>Rs. ${formatINR(q.final_price)}</strong></div>
      </div>
    `;
  }

  function buildQuotePayload() {
    const q = calculateQuote();
<<<<<<< HEAD
    const dateTime = new Date().toLocaleString("en-IN");
    return {
      quotationId: appState.quoteNo,
      dateTime,
      customerName: customerNameEl.value,
      phone: customerPhoneEl.value,
      email: customerEmailEl.value,
      address: customerLocationEl.value || `${appState.city || ""}, ${appState.stateName || ""}`,
      city: appState.city || "",
      state: appState.stateName || "",
      propertyType: appState.propertyType,
      roofType: "Rooftop",
      plantSize: appState.plant?.label || `${appState.plant?.kw || 0}kW`,
      quoteType: appState.systemType,
      selectedKit: appState.kit?.name || "",
      inverterName: getSelectedInverterName(),
      panelName: getSelectedPanelName(),
      battery: "Not included",
      structureType: "Standard rooftop structure",
      installationType: appState.systemType,
      monthlyBill: appState.monthlyBill || 0,
      monthlySavings: q?.monthlySavings || 0,
      annualSavings: q?.annualSavings || 0,
      roiYears: q?.paybackYears || 0,
      paybackPeriod: q?.paybackYears ? `${q.paybackYears} years` : "",
      totalCost: q?.adjusted_total || q?.grossTotal || q?.total_before_subsidy || 0,
      subsidy: q?.subsidy || 0,
      netPayable: q?.final_price || q?.netPayable || 0,
      timestamp: new Date().toISOString()
=======
    return {
      quoteNo: appState.quoteNo,
      date: getQuoteTimestamp(),
      name: customerNameEl.value,
      phone: customerPhoneEl.value,
      email: customerEmailEl.value,
      location: customerLocationEl.value || `${appState.city || ""}, ${appState.stateName || ""}`,
      city: appState.city,
      stateName: appState.stateName,
      propertyType: appState.propertyType,
      monthlyBill: appState.monthlyBill,
      plantKw: appState.plant?.kw || 0,
      plantLabel: appState.plant?.label || "",
      plantBase: q?.subtotal || 0,
      kitName: appState.kit?.name || "",
      kitPriceAdjustment: getKitAdjustment(),
      kitLogo: appState.kit?.logo || "",
      panelName: getSelectedPanelName(),
      panelWarranty: appState.kit?.warranty || appState.panel?.warranty || "",
      panelPrice: q?.panel_cost || 0,
      panelLogo: getSelectedPanelLogo(),
      inverterName: getSelectedInverterName(),
      inverterWarranty: appState.kit?.warranty || appState.inverter?.warranty || "",
      inverterPrice: q?.inverter_cost || 0,
      inverterLogo: getSelectedInverterLogo(),
      installationCost: q?.installation_cost || 0,
      transport: q?.transport || 0,
      earthing: q?.earthing || 0,
      acdb: q?.acdb || 0,
      netMetering: q?.netMetering || 0,
      wiring: q?.wiring || 0,
      subtotal: q?.subtotal || 0,
      gst: q?.gst || 0,
      total_before_subsidy: q?.total_before_subsidy || 0,
      adjusted_total: q?.adjusted_total || 0,
      grossTotal: q?.adjusted_total || 0,
      subsidy: q?.subsidy || 0,
      final_price: q?.final_price || 0,
      price_per_kw: q?.price_per_kw || 0,
      netPayable: q?.final_price || 0,
      systemType: appState.systemType,
      annualInterestRate: q?.annualInterestRate || 0,
      emi: q?.emi || 0,
      monthlySavings: q?.monthlySavings || 0,
      annualSavings: q?.annualSavings || 0,
      paybackYears: q?.paybackYears || 0,
      source: "quotation_page"
>>>>>>> 81f5cb3012d451a619506ecba522b329391da7eb
    };
  }

  function applyQueryPrefill() {
    const params = new URLSearchParams(window.location.search);
    const bill = Number(params.get("bill") || 0);
    const stateValue = (params.get("state") || "").trim();
    const city = (params.get("city") || "").trim();
    const propertyType = (params.get("propertyType") || "").trim();
    let prefillApplied = false;
    if (bill > 0) monthlyBillEl.value = String(bill);
    if (stateValue) stateEl.value = stateValue;
    if (city) cityEl.value = city;
    if (propertyType) propertyTypeEl.value = propertyType;
    if (bill > 0 || stateValue || city || propertyType) {
      prefillApplied = true;
    }

    try {
<<<<<<< HEAD
      const savedPrefill = JSON.parse(sessionStorage.getItem(QUOTE_PREFILL_STORAGE_KEY) || "null");
=======
      const savedPrefill = JSON.parse(localStorage.getItem(QUOTE_PREFILL_STORAGE_KEY) || "null");
>>>>>>> 81f5cb3012d451a619506ecba522b329391da7eb
      if (savedPrefill && typeof savedPrefill === "object") {
        if (!customerNameEl.value && savedPrefill.customerName) customerNameEl.value = savedPrefill.customerName;
        if (!customerPhoneEl.value && savedPrefill.customerPhone) customerPhoneEl.value = savedPrefill.customerPhone;
        if (!customerEmailEl.value && savedPrefill.customerEmail) customerEmailEl.value = savedPrefill.customerEmail;
        if (!customerLocationEl.value && savedPrefill.customerAddress) customerLocationEl.value = savedPrefill.customerAddress;
        if (!monthlyBillEl.value && savedPrefill.bill) monthlyBillEl.value = String(savedPrefill.bill);
        if (!stateEl.value && savedPrefill.stateName) stateEl.value = savedPrefill.stateName;
        if (!cityEl.value && savedPrefill.city) cityEl.value = savedPrefill.city;
        if (!propertyTypeEl.value && savedPrefill.propertyType) propertyTypeEl.value = savedPrefill.propertyType;
        prefillApplied = true;
      }
<<<<<<< HEAD
    } catch {
    } finally {
      // Quote prefill should only apply for the immediate ROI -> Quote redirect.
      sessionStorage.removeItem(QUOTE_PREFILL_STORAGE_KEY);
=======
    } catch (_error) {
    } finally {
      // Quote prefill should only apply for the immediate ROI -> Quote redirect.
      localStorage.removeItem(QUOTE_PREFILL_STORAGE_KEY);
>>>>>>> 81f5cb3012d451a619506ecba522b329391da7eb
    }

    return prefillApplied;
  }

  function syncAppStateFromInputs() {
    appState.monthlyBill = Number(monthlyBillEl?.value || 0);
    appState.stateName = stateEl?.value || "";
    appState.city = cityEl?.value.trim() || "";
    appState.propertyType = propertyTypeEl?.value || "";
  }

  function initQuotationStateRestore() {
    const navType = getNavigationType();
    if (navType === "reload") {
      clearQuotationState();
      sessionStorage.removeItem(QUOTE_PREFILL_STORAGE_KEY);
      return false;
    }
    if (navType === "back_forward") {
      return loadQuotationState();
    }
    clearQuotationState();
    return false;
  }

  function setFieldError(id, message) {
    const field = document.getElementById(id);
    if (!field) return;
    const next = field.nextElementSibling;
    if (next && next.classList.contains("field-error")) next.remove();
    if (!message) return;
    const error = document.createElement("div");
    error.className = "field-error";
    error.textContent = message;
    field.insertAdjacentElement("afterend", error);
  }

<<<<<<< HEAD
  function fieldValue(field) {
    return String(field?.value || "").trim();
  }

  function validateStepOne() {
    const bill = Number(monthlyBillEl.value);
    const validations = [
      { id: "customerName", field: customerNameEl, message: "Name is required.", invalid: !fieldValue(customerNameEl) },
      { id: "customerPhone", field: customerPhoneEl, message: "Phone is required.", invalid: !fieldValue(customerPhoneEl) },
      { id: "wizardMonthlyBill", field: monthlyBillEl, message: "Please enter a valid monthly bill of at least 500.", invalid: !bill || bill < 500 },
      { id: "wizardState", field: stateEl, message: "State is required.", invalid: !fieldValue(stateEl) },
      { id: "propertyType", field: propertyTypeEl, message: "Property type is required.", invalid: !fieldValue(propertyTypeEl) }
    ];

    let firstInvalid = null;
    validations.forEach((item) => {
      setFieldError(item.id, item.invalid ? item.message : "");
      if (item.invalid && !firstInvalid) firstInvalid = item;
    });

    if (firstInvalid) {
      setQuoteStatus("Please complete the highlighted required fields to continue.", "error");
      firstInvalid.field?.focus({ preventScroll: true });
      firstInvalid.field?.scrollIntoView({ behavior: "smooth", block: "center" });
      return false;
    }

    setQuoteStatus("");
    return true;
  }

=======
>>>>>>> 81f5cb3012d451a619506ecba522b329391da7eb
  function ensureQuoteMeta() {
    if (!appState.quoteNo) appState.quoteNo = `VSQ-${Date.now().toString().slice(-8)}`;
    if (!appState.generatedAt) appState.generatedAt = new Date().toISOString();
    quoteMeta.textContent = `Quotation ID: ${appState.quoteNo} | ${new Date(appState.generatedAt).toLocaleString("en-IN")}`;
  }

  function showStep(step) {
    closeAllBrandMenus();
    appState.step = step;
    pages.forEach((page) => page.classList.toggle("active", Number(page.dataset.step) === step));
    steps.forEach((item, idx) => item.classList.toggle("active", idx + 1 <= step));
    const activePage = pages.find((page) => page.classList.contains("active"));
    if (activePage) {
      activePage.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    }
    if (step === 4) {
      ensureQuoteMeta();
      quotePreview.innerHTML = quotePreviewHtml();
      document.getElementById("saveSummary").innerHTML = saveStepHtml();
      downloadContent.innerHTML = quoteDownloadHtml();
    }
  }

  function closeAllBrandMenus(except) {
    document.querySelectorAll(".brand-select").forEach((select) => {
      if (select !== except) select.classList.remove("open");
      const trigger = select.querySelector(".brand-select-trigger");
      if (trigger) trigger.setAttribute("aria-expanded", select.classList.contains("open") ? "true" : "false");
    });
  }

  function syncSystemType() {
    const plantLabel = appState.plant?.label || "Plant Pending";
    if (appState.kit) {
      appState.systemType = `Kit Quote: ${appState.kit.name} | ${plantLabel}`;
      return;
    }
    if (appState.inverter || appState.panel) {
      const inv = appState.inverter?.alias || "Inverter Pending";
      const pan = appState.panel?.alias || "Panel Pending";
      appState.systemType = `Custom Quote: ${inv} Inverter + ${pan} Panel | ${plantLabel}`;
      return;
    }
    appState.systemType = `Quote Pending | ${plantLabel}`;
  }

  function clearBrandMode(mode) {
    // Keep a single selection mode active:
    // - "kit": selecting a kit clears inverter/panel selections
    // - "brands": selecting inverter/panel clears kit selection
    if (mode === "kit") {
      appState.inverter = null;
      appState.panel = null;
      inverterOtherInput.value = "";
      panelOtherInput.value = "";
      inverterOtherWrap.classList.add("hidden");
      panelOtherWrap.classList.add("hidden");
      return;
    }
    if (mode === "brands") {
      appState.kit = null;
    }
  }

  function applyKitDefaults(kit) {
    appState.inverter = null;
    appState.panel = null;
    inverterOtherInput.value = "";
    panelOtherInput.value = "";
  }

  function selectBrand(key, item, options = {}) {
    appState[key] = item;
    appState.lastAutoSelectionNote = options.note || "";
    markQuoteDirty();
    
    // If kit selected, auto-advance to Step 4
    if (key === "kit") {
      clearBrandMode("kit");
      applyKitDefaults(item);
      syncSystemType();
      appState.lastAutoSelectionNote = "Kit selected. Moving to quotation.";
      renderEquipmentSelectors();
      showStep(4);
      return;
    }

    // Selecting inverter/panel means we're in brand mode (not kit mode)
    if (key === "inverter" || key === "panel") {
      clearBrandMode("brands");
    }
    
    if (appState.inverter && appState.panel) {
      appState.lastAutoSelectionNote = appState.lastAutoSelectionNote || "Inverter and panel selected. Moving to quotation.";
      syncSystemType();
      renderEquipmentSelectors();
      showStep(4);
      return;
    }
    
    syncSystemType();
    renderEquipmentSelectors();
  }

  function validateEquipmentSelection() {
    // Equipment selection is optional for price (latest pricing is plant-size based),
    // but still required to produce a complete quote record.
    const hasKit = appState.kit !== null;
    const hasInverterAndPanel = Boolean(appState.inverter && appState.panel);
    if (!hasKit && !hasInverterAndPanel) {
      alert("Please select a solar kit OR both inverter and solar panel brands.");
      return false;
    }

    if (appState.inverter && appState.inverter.alias === "Others" && !inverterOtherInput.value.trim()) {
      alert("Please enter the inverter brand name for Others.");
      inverterOtherInput.focus();
      return false;
    }
    if (appState.panel && appState.panel.alias === "Others" && !panelOtherInput.value.trim()) {
      alert("Please enter the solar panel brand name for Others.");
      panelOtherInput.focus();
      return false;
    }
    return true;
  }

  document.getElementById("toStep2").addEventListener("click", () => {
<<<<<<< HEAD
    if (!validateStepOne()) return;
=======
    const bill = Number(monthlyBillEl.value);
    setFieldError("customerName", !customerNameEl.value ? "Name is required." : "");
    setFieldError("customerPhone", !customerPhoneEl.value ? "Phone is required." : "");
    setFieldError("customerLocation", !customerLocationEl.value ? "Address is required." : "");
    setFieldError("wizardMonthlyBill", (!bill || bill < 500) ? "Please enter valid monthly bill (minimum 500)." : "");
    setFieldError("wizardState", !stateEl.value ? "State is required." : "");
    setFieldError("propertyType", !propertyTypeEl.value ? "Property type is required." : "");
    if (!customerNameEl.value || !customerPhoneEl.value || !customerLocationEl.value || !bill || bill < 500 || !stateEl.value || !propertyTypeEl.value) return;
>>>>>>> 81f5cb3012d451a619506ecba522b329391da7eb
    syncAppStateFromInputs();
    markQuoteDirty();
    saveQuotationState();
    showStep(2);
  });

  document.getElementById("downloadQuote")?.addEventListener("click", async () => {
    await downloadAndShareQuote();
  });

  document.querySelectorAll(".back-btn").forEach((btn) => btn.addEventListener("click", () => showStep(Math.max(1, appState.step - 1))));

<<<<<<< HEAD
  plantOptions?.addEventListener("click", (event) => {
    const plantTarget = event.target.closest(".select-card");
    if (!plantTarget) return;
    const idx = Number(plantTarget.dataset.idx);
    if (Number.isNaN(idx) || idx < 0 || idx >= plantData.length) return;
    appState.plant = plantData[idx];
    syncSystemType();
    markQuoteDirty();
    renderPlants();
    showStep(3);
  });

  plantOptions?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const plantTarget = event.target.closest(".select-card");
    if (!plantTarget) return;
    event.preventDefault();
    plantTarget.click();
  });

  document.addEventListener("click", (event) => {
    const retryQuotePdf = event.target.closest("[data-retry-quote-pdf]");
=======
  document.addEventListener("click", (event) => {
    const retryQuotePdf = event.target.closest("[data-retry-quote-pdf]");
    const plantTarget = event.target.closest(".select-card");
>>>>>>> 81f5cb3012d451a619506ecba522b329391da7eb
    const trigger = event.target.closest(".brand-select-trigger");
    const option = event.target.closest(".brand-option");

    if (retryQuotePdf) {
      downloadAndShareQuote();
      return;
    }

    if (trigger) {
      const select = trigger.closest(".brand-select");
      const willOpen = !select.classList.contains("open");
      closeAllBrandMenus(select);
      select.classList.toggle("open", willOpen);
      trigger.setAttribute("aria-expanded", willOpen ? "true" : "false");
      return;
    }

    if (option) {
      const key = option.dataset.selectOption;
      const index = Number(option.dataset.index);
      if (key === "kit") selectBrand("kit", kits[index]);
      if (key === "inverter") selectBrand("inverter", inverters[index]);
      if (key === "panel") selectBrand("panel", panels[index]);
      closeAllBrandMenus();
      return;
    }

<<<<<<< HEAD
=======
    if (plantTarget) {
      appState.plant = plantData[Number(plantTarget.dataset.idx)];
      syncSystemType();
      markQuoteDirty();
      renderPlants();
      showStep(3);
      return;
    }

>>>>>>> 81f5cb3012d451a619506ecba522b329391da7eb
    if (!event.target.closest(".brand-select")) {
      closeAllBrandMenus();
    }
  });

  document.querySelectorAll("#stepper li").forEach((li, idx) => {
    li.style.cursor = "pointer";
    li.addEventListener("click", () => {
      const targetStep = idx + 1;
      if (targetStep <= appState.step) showStep(targetStep);
    });
  });

  [inverterOtherInput, panelOtherInput].forEach((input) => {
    input?.addEventListener("input", () => {
      appState.lastAutoSelectionNote = "";
      markQuoteDirty();
      renderEquipmentSelectors();
    });
  });

  [customerNameEl, customerPhoneEl, customerEmailEl, customerLocationEl, monthlyBillEl, stateEl, cityEl, propertyTypeEl].forEach((input) => {
    input?.addEventListener("input", () => {
      syncAppStateFromInputs();
      markQuoteDirty();
      saveQuotationState();
    });
    input?.addEventListener("change", () => {
      syncAppStateFromInputs();
      markQuoteDirty();
      saveQuotationState();
    });
  });

  const stateRestored = initQuotationStateRestore();
<<<<<<< HEAD
  window.addEventListener("beforeunload", (e) => {
    saveQuotationState();
    if (quoteWizardDirty && !quoteWizardCompleted) {
      e.preventDefault();
      e.returnValue = "";
    }
  });

  document.addEventListener(
    "click",
    (event) => {
      if (!quoteWizardDirty || quoteWizardCompleted) return;
      const link = event.target.closest("a[href]");
      if (!link) return;
      const href = link.getAttribute("href") || "";
      if (!href || href.startsWith("#") || href.startsWith("javascript:")) return;
      if (link.target === "_blank") return;
      if (/^(mailto:|tel:)/i.test(href)) return;
      if (/wa\.me|api\.whatsapp|facebook\.com|instagram\.com/i.test(href)) return;
      let url;
      try {
        url = new URL(link.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      const hereFile = (window.location.pathname.split("/").pop() || "").toLowerCase();
      const destFile = (url.pathname.split("/").pop() || "").toLowerCase();
      if (destFile === hereFile) return;
      const message =
        "You have an unfinished quotation. Leaving now may lose your progress. Continue to another page?";
      if (!window.confirm(message)) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    true
  );
=======
  window.addEventListener("beforeunload", () => {
    saveQuotationState();
  });
>>>>>>> 81f5cb3012d451a619506ecba522b329391da7eb
  
  renderPlants();
  renderEquipmentSelectors();
  const prefillApplied = applyQueryPrefill();
  syncAppStateFromInputs();
  if (prefillApplied) saveQuotationState();
  syncSystemType();
  showStep(stateRestored ? appState.step || 1 : 1);
}
