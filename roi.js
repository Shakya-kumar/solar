/*
ROI calculator maintenance guide:
- Change `estimateKwFromBill()` or `buildRoiMetrics()` to alter ROI math.
- Change the report renderers and backend payload to alter how report data is shared.
*/
const roiForm = document.getElementById("roiForm");
const roiOutput = document.getElementById("roiOutput");
const monthlyBillInput = document.getElementById("monthlyBill");
const locationInput = document.getElementById("location");
const roofTypeInput = document.getElementById("roofType");
const connectionTypeInput = document.getElementById("connectionType");
const customerNameRoi = document.getElementById("customerNameRoi");
const customerPhoneRoi = document.getElementById("customerPhoneRoi");
const customerAddressRoi = document.getElementById("customerAddressRoi");
const roiDownloadContent = document.getElementById("roiDownloadContent");
const roiReportMeta = document.getElementById("roiReportMeta");
const QUOTE_PREFILL_STORAGE_KEY = "vaibhav_quote_prefill";
const ROI_STATE_STORAGE_KEY = "vaibhav_roi_state";
const ROI_STATUS_ELEMENT_ID = "roiStatusMessage";
<<<<<<< HEAD
let roiSubmissionInProgress = false;
=======
const GOOGLE_SHEETS_URL = "https://script.google.com/macros/s/AKfycbx6PeY1ywgHn7S81tBsOUvIqne2JIqpleEDywMrbEm55mw10MNM0poq8bxnI4c4SwCO/exec";
const GOOGLE_SHEETS_MAX_RETRIES = 2;
const GOOGLE_SHEETS_RETRY_DELAY_MS = 800;
const SENT_ROI_REPORTS = new Set();
>>>>>>> 81f5cb3012d451a619506ecba522b329391da7eb

function getStatusContainer() {
  let container = document.getElementById(ROI_STATUS_ELEMENT_ID);
  if (!container && roiOutput) {
    container = document.createElement("div");
    container.id = ROI_STATUS_ELEMENT_ID;
    container.className = "status-banner status-info";
    roiOutput.insertAdjacentElement("afterbegin", container);
  }
  return container;
}

function setRoiStatus(message, type = "info") {
  const container = getStatusContainer();
  if (!container) return;
  container.textContent = message;
  container.className = `status-banner status-${type}`;
  container.style.display = message ? "block" : "none";
}

const INDIA_STATES = [
  "Madhya Pradesh",
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal"
];

let lastRoiData = null;

<<<<<<< HEAD
=======
function getNavigationType() {
  try {
    const entry = performance.getEntriesByType?.("navigation")?.[0];
    if (entry && typeof entry.type === "string") return entry.type;
  } catch {
    // Ignore environments where navigation timing is unavailable.
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
      existing.addEventListener("error", () => reject(new Error(`Unable to load ${src}`)), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => reject(new Error(`Unable to load ${src}`));
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
}

>>>>>>> 81f5cb3012d451a619506ecba522b329391da7eb
async function ensurePdfLibraries() {
  try {
    getHtml2Canvas();
    getJsPDF();
    return;
  } catch {
<<<<<<< HEAD
    // Load missing libraries from local assets first, then CDN fallback locations.
  }

  if (!window.html2canvas || typeof window.html2canvas !== "function") {
=======
    // Load missing browser PDF libraries when the page-level CDN script is unavailable.
  }

  try {
    getHtml2Canvas();
  } catch {
>>>>>>> 81f5cb3012d451a619506ecba522b329391da7eb
    await loadFirstAvailableScript([
      "vendor/html2canvas.min.js",
      "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"
    ]);
  }

<<<<<<< HEAD
  if (!window.jspdf || !window.jspdf.jsPDF) {
=======
  try {
    getJsPDF();
  } catch {
>>>>>>> 81f5cb3012d451a619506ecba522b329391da7eb
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
              <strong>Report continues on next page</strong>
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

function shouldRestoreRoiState(pageshowEvent) {
  const navType = getNavigationType();
  if (navType === "reload") return false;
  // BFCache restores should keep ROI output and inputs.
  if (pageshowEvent?.persisted) return true;
  // Back/forward navigation should keep ROI output and inputs.
  if (navType === "back_forward") return true;
  return false;
}

function formatINR(value) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.round(value || 0));
}

function formatMoney(value) {
  return `INR ${formatINR(value || 0)}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function estimateKwFromBill(bill) {
  if (bill <= 3000) return 3;
  if (bill <= 4000) return 4;
  if (bill <= 5000) return 5;
  if (bill <= 6500) return 6;
  if (bill <= 8000) return 7;
  return 8;
}

function populateLocationOptions() {
  if (!locationInput) return;
  const selectedValue = locationInput.value;
  locationInput.innerHTML = [
    '<option value="">Select location</option>',
    ...INDIA_STATES.map((state) => `<option>${state}</option>`)
  ].join("");
  if (selectedValue) locationInput.value = selectedValue;
}

function buildRoiMetrics() {
  const bill = Number(monthlyBillInput.value);
  const location = locationInput.value;
  const roofType = roofTypeInput.value;
  const connectionType = connectionTypeInput.value;
  const customerName = customerNameRoi?.value || "";
  const customerPhone = customerPhoneRoi?.value || "";
  const customerAddress = customerAddressRoi?.value || "";

  if (!bill || bill < 500 || !location || !roofType || !connectionType || !customerName || !customerPhone || !customerAddress) {
    return null;
  }

  const recommendedKw = estimateKwFromBill(bill);
  const plantLabel = recommendedKw >= 8 ? "8kW+" : `${recommendedKw}kW`;
  const baseCost = recommendedKw * 58000;
  const subsidy = Math.min(78000, recommendedKw * 18000);
  const netCost = Math.max(0, baseCost - subsidy);
  const monthlySavings = Math.round(bill * 0.85);
  const annualSavings = monthlySavings * 12;
  const paybackYears = annualSavings > 0 ? Number((netCost / annualSavings).toFixed(1)) : 0;
  const generatedAt = new Date().toISOString();

  return {
    bill,
    location,
    roofType,
    connectionType,
    customerName,
    customerPhone,
    customerAddress,
    recommendedKw,
    plantLabel,
    baseCost,
    subsidy,
    netCost,
    monthlySavings,
    annualSavings,
    paybackYears,
    generatedAt,
    reportId: `ROI-${Date.now().toString().slice(-8)}`
  };
}

<<<<<<< HEAD
async function submitRoiPayload(payload) {
  if (!window.VSS_API?.submitLead) throw new Error("Submission module is not loaded.");
  return window.VSS_API.submitLead({
    type: "roi",
    sourcePage: "ROI Calculator",
    roi: payload
=======
async function sendRoiEmail(data, action = "ROI Report") {
  if (typeof sendEmail !== "function") {
    throw new Error("Email service is not available.");
  }

  return sendEmail({
    type: "roi",
    source: "roi_page",
    actionType: action,
    name: data.customerName,
    phone: data.customerPhone,
    email: "",
    location: data.location,
    address: data.customerAddress,
    message: `ROI report generated for ${data.customerName}`,
    roi: data,
    timestamp: new Date().toISOString()
>>>>>>> 81f5cb3012d451a619506ecba522b329391da7eb
  });
}

async function generateRoiPdfBlobClientSide(data) {
  const reportMetaText = roiReportMeta?.textContent || "";
  const reportHtml = roiDownloadHtml(data);
  roiDownloadContent.innerHTML = reportHtml;
  return renderSheetHtmlToPdfBlob(`
    <div class="sheet-header roi-sheet-header">
      <div class="invoice-brand">
        <img src="brand-logo.png" alt="Vaibhav Solar Solutions logo" class="invoice-logo" />
        <div>
          <h3>VAIBHAV SOLAR SOLUTIONS</h3>
          <p>ROI Savings Report</p>
          <small>${escapeHtml(reportMetaText)}</small>
        </div>
      </div>
    </div>
    <div id="roiDownloadContent">${reportHtml}</div>
  `, "ROI PDF content could not be rendered.");
}

async function generateRoiPdfBlobSimple(data) {
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
  pdf.text("Solar ROI Report", 54, 84);
  pdf.text(`Report ID: ${data.reportId || "-"}`, pageWidth - 200, 66);
  y = 132;

  addSection("Customer Details");
  addRow("Name", data.customerName);
  addRow("Phone", data.customerPhone);
  addRow("Address", data.customerAddress);
  addRow("Location", data.location);

  addSection("Project Snapshot");
  addRow("Monthly Bill", `Rs. ${formatINR(data.bill)}`);
  addRow("Roof Type", data.roofType);
  addRow("Connection Type", data.connectionType);
  addRow("Recommended Plant Size", data.plantLabel);

  addSection("ROI Summary");
  addRow("Estimated Investment", `Rs. ${formatINR(data.baseCost)}`);
  addRow("Estimated Subsidy", `Rs. ${formatINR(data.subsidy)}`);
  addRow("Estimated Monthly Savings", `Rs. ${formatINR(data.monthlySavings)}`);
  addRow("Estimated Annual Savings", `Rs. ${formatINR(data.annualSavings)}`);
  addRow("Estimated Payback", `${data.paybackYears} years`);

  y += 12;
  pdf.setFillColor("#0f5c27");
  pdf.roundedRect(margin, y, pageWidth - margin * 2, 54, 14, 14, "F");
  pdf.setTextColor("#ffffff");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.text("ESTIMATED NET INVESTMENT", margin + 18, y + 22);
  pdf.setFontSize(20);
  pdf.text(`Rs. ${formatINR(data.netCost)}`, margin + 18, y + 45);

  return pdf.output("blob");
}

async function generateRoiPdfBlob(data) {
  try {
    return await generateRoiPdfBlobClientSide(data);
<<<<<<< HEAD
  } catch {
=======
  } catch (_clientErr) {
>>>>>>> 81f5cb3012d451a619506ecba522b329391da7eb
    return generateRoiPdfBlobSimple(data);
  }
}

function downloadPdfBlob(pdfBlob, filename) {
  const pdfUrl = URL.createObjectURL(pdfBlob);
  const downloadLink = document.createElement("a");
  downloadLink.href = pdfUrl;
  downloadLink.download = filename;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  downloadLink.remove();
  window.setTimeout(() => URL.revokeObjectURL(pdfUrl), 5000);
}

<<<<<<< HEAD
async function downloadShareAndEmailRoi(data, stage, { redirectToQuote = false } = {}) {
  if (!data) return false;
  if (roiSubmissionInProgress) return false;
  roiSubmissionInProgress = true;
  document.getElementById("downloadRoiBtn")?.setAttribute("disabled", "disabled");
  document.getElementById("getQuoteBtn")?.setAttribute("disabled", "disabled");
=======
function buildRoiSheetPayload(data) {
  return {
    type: "ROI",
    reportId: data.reportId,
    timestamp: data.generatedAt,
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    customerAddress: data.customerAddress,
    location: data.location,
    roofType: data.roofType,
    connectionType: data.connectionType,
    recommendedKw: data.recommendedKw,
    plantLabel: data.plantLabel,
    baseCost: data.baseCost,
    subsidy: data.subsidy,
    netCost: data.netCost,
    monthlySavings: data.monthlySavings,
    annualSavings: data.annualSavings,
    paybackYears: data.paybackYears,
    source: "roi_page"
  };
}

async function sendRoiToSheet(data) {
  if (!data || !data.reportId) {
    throw new Error("Missing ROI report data for sheet save.");
  }

  if (SENT_ROI_REPORTS.has(data.reportId)) {
    console.info("Duplicate ROI report prevented:", data.reportId);
    return { status: "duplicate", reportId: data.reportId };
  }

  const payload = buildRoiSheetPayload(data);
  console.log("[ROI] Sending payload:", payload);

  let lastError = null;
  for (let attempt = 1; attempt <= GOOGLE_SHEETS_MAX_RETRIES; attempt += 1) {
    try {
      const response = await fetch(GOOGLE_SHEETS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const bodyText = await response.text().catch(() => "<no response body>");
        throw new Error(`HTTP ${response.status}: ${bodyText}`);
      }

      const result = await response.json().catch(() => {
        throw new Error("Invalid JSON response from server");
      });

      if (result.status === "success") {
        SENT_ROI_REPORTS.add(data.reportId);
        console.log("[ROI] ✅ Saved:", result);
        return result;
      } else {
        throw new Error(result.message || "Server returned error");
      }
    } catch (error) {
      lastError = error;
      console.warn(`[ROI] Attempt ${attempt} failed:`, error.message);
      if (attempt < GOOGLE_SHEETS_MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, GOOGLE_SHEETS_RETRY_DELAY_MS));
      }
    }
  }

  console.error("[ROI] All attempts failed. Final error:", lastError);
  SENT_ROI_REPORTS.add(data.reportId);
  return { status: "error", message: lastError?.message, reportId: data.reportId };
}

async function downloadShareAndEmailRoi(data, stage, { redirectToQuote = false } = {}) {
  if (!data) return false;
>>>>>>> 81f5cb3012d451a619506ecba522b329391da7eb
  roiReportMeta.textContent = `Report ID: ${data.reportId} | ${new Date(data.generatedAt).toLocaleString("en-IN")}`;
  roiDownloadContent.innerHTML = roiDownloadHtml(data);
  saveRoiState();

<<<<<<< HEAD
  try {
    const pdfBlob = await generateRoiPdfBlob(data);
    downloadPdfBlob(pdfBlob, `vaibhav-roi-report-${data.reportId}.pdf`);
    try {
      await submitRoiPayload(data);
      setRoiStatus("ROI report downloaded, saved to Google Sheets, and sent to our team successfully.", "success");
    } catch (submissionError) {
      setRoiStatus(`ROI report downloaded, but saving failed: ${submissionError.message}. Please contact us directly.`, "warning");
      return false;
=======
  let sheetSaved = false;
  setRoiStatus("Saving ROI details to Google Sheets...", "info");
  try {
    await sendRoiToSheet(data);
    sheetSaved = true;
  } catch (sheetError) {
    console.warn("ROI sheet save failed:", sheetError);
  }

  try {
    const pdfBlob = await generateRoiPdfBlob(data);
    downloadPdfBlob(pdfBlob, `vaibhav-roi-report-${data.reportId}.pdf`);

    if (sheetSaved) {
      setRoiStatus("ROI report downloaded and saved to Google Sheets.", "success");
    } else {
      setRoiStatus("ROI report downloaded, but saving to Google Sheets failed. Please try again.", "warning");
>>>>>>> 81f5cb3012d451a619506ecba522b329391da7eb
    }

    if (redirectToQuote) {
      window.setTimeout(() => {
        window.location.href = `quotation.html?bill=${data.bill}&state=${encodeURIComponent(data.location)}`;
      }, 900);
    }

    return true;
  } catch (err) {
    alert(`ROI PDF download failed: ${err.message}. Please try again later.`);
    setRoiStatus(`ROI PDF download failed: ${err.message}`, "error");
    return false;
<<<<<<< HEAD
  } finally {
    roiSubmissionInProgress = false;
    document.getElementById("downloadRoiBtn")?.removeAttribute("disabled");
    document.getElementById("getQuoteBtn")?.removeAttribute("disabled");
=======
>>>>>>> 81f5cb3012d451a619506ecba522b329391da7eb
  }
}

function roiSummaryTable(data) {
  return `
    <table class="quote-table">
      <tr><td>Monthly Bill</td><td>Rs. ${formatINR(data.bill)}</td></tr>
      <tr><td>Location</td><td>${escapeHtml(data.location)}</td></tr>
      <tr><td>Roof Type</td><td>${escapeHtml(data.roofType)}</td></tr>
      <tr><td>Connection Type</td><td>${escapeHtml(data.connectionType)}</td></tr>
      <tr><td>Name</td><td>${escapeHtml(data.customerName)}</td></tr>
      <tr><td>Phone</td><td>${escapeHtml(data.customerPhone)}</td></tr>
      <tr><td>Address</td><td>${escapeHtml(data.customerAddress)}</td></tr>
      <tr><td>Recommended Plant Size</td><td>${escapeHtml(data.plantLabel)}</td></tr>
      <tr><td>Estimated Investment</td><td>Rs. ${formatINR(data.baseCost)}</td></tr>
      <tr><td>Estimated Subsidy</td><td>- Rs. ${formatINR(data.subsidy)}</td></tr>
      <tr><td><strong>Net Investment</strong></td><td><strong>Rs. ${formatINR(data.netCost)}</strong></td></tr>
      <tr><td>Estimated Monthly Savings</td><td>Rs. ${formatINR(data.monthlySavings)}</td></tr>
      <tr><td>Estimated Annual Savings</td><td>Rs. ${formatINR(data.annualSavings)}</td></tr>
      <tr><td>Estimated Payback Period</td><td>${data.paybackYears} years</td></tr>
    </table>
  `;
}

function roiDownloadHtml(data) {
  return `
    <div class="invoice-shell">
      <div class="invoice-grid">
        <section class="invoice-panel">
          <h4>Customer Details</h4>
          <p><strong>Name:</strong> ${escapeHtml(data.customerName)}</p>
          <p><strong>Phone:</strong> ${escapeHtml(data.customerPhone)}</p>
          <p><strong>Address:</strong> ${escapeHtml(data.customerAddress)}</p>
          <p><strong>Location:</strong> ${escapeHtml(data.location)}</p>
        </section>
        <section class="invoice-panel">
          <h4>Project Snapshot</h4>
          <p><strong>Report ID:</strong> ${escapeHtml(data.reportId)}</p>
          <p><strong>Date & Time:</strong> ${escapeHtml(new Date(data.generatedAt).toLocaleString("en-IN"))}</p>
          <p><strong>Plant Size:</strong> ${escapeHtml(data.plantLabel)}</p>
          <p><strong>Monthly Savings:</strong> Rs. ${formatINR(data.monthlySavings)}</p>
        </section>
      </div>
      <section class="invoice-panel">
        <h4>ROI Details</h4>
        ${roiSummaryTable(data)}
      </section>
      <div class="quote-total-banner">
        <span>Estimated Net Investment</span>
        <strong>Rs. ${formatINR(data.netCost)}</strong>
      </div>
      <p class="invoice-note">This report summarizes plant size, investment, savings, and expected payback for quick decision-making.</p>
    </div>
  `;
}

function renderEmptyRoi() {
  roiOutput.innerHTML = `
    <h2>Output</h2>
    <p class="muted">Please fill all inputs to calculate ROI.</p>
  `;
}

function renderRoiResult(data) {
  if (!data) {
    renderEmptyRoi();
    return;
  }

  lastRoiData = data;
  roiReportMeta.textContent = `Report ID: ${data.reportId} | ${new Date(data.generatedAt).toLocaleString("en-IN")}`;
  roiDownloadContent.innerHTML = roiDownloadHtml(data);
  roiOutput.innerHTML = `
    <h2>Output</h2>
    ${roiSummaryTable(data)}
    <div class="cta-row">
      <button class="btn btn-secondary" id="getQuoteBtn" type="button">Get Quote</button>
      <button class="btn btn-primary" id="downloadRoiBtn" type="button">Download PDF</button>
    </div>
  `;
  document.getElementById("downloadRoiBtn")?.addEventListener("click", downloadRoiReport);
  document.getElementById("getQuoteBtn")?.addEventListener("click", async () => {
    saveQuotePrefill(data);
    saveRoiState();
<<<<<<< HEAD
    await downloadShareAndEmailRoi(data, "ROI Generated - Quote Requested", { redirectToQuote: true });
=======
    if (typeof sendEmail === "function") {
      setRoiStatus("Sending ROI details to our team before redirecting...", "info");
      try {
        await sendRoiEmail(data, "ROI Data for Quote");
        setRoiStatus("ROI details sent. Redirecting to quotation page...", "success");
      } catch {
        setRoiStatus("ROI details could not be emailed. Redirecting anyway.", "warning");
      }
    }
    window.location.href = `quotation.html?bill=${data.bill}&state=${encodeURIComponent(data.location)}`;
>>>>>>> 81f5cb3012d451a619506ecba522b329391da7eb
  });
}

async function renderRoi() {
  setRoiStatus("");
  const data = buildRoiMetrics();
  if (!data) {
    renderEmptyRoi();
    return;
  }

  renderRoiResult(data);
  saveRoiState();
<<<<<<< HEAD
  setRoiStatus("ROI calculated successfully. Use the download button below to get the report.", "success");
=======
  setRoiStatus("ROI calculated successfully.", "success");
>>>>>>> 81f5cb3012d451a619506ecba522b329391da7eb
}

async function downloadRoiReport() {
  if (!lastRoiData) return;
  await downloadShareAndEmailRoi(lastRoiData, "ROI Report Downloaded");
}

function collectRoiFormState() {
  return {
    bill: monthlyBillInput?.value || "",
    location: locationInput?.value || "",
    roofType: roofTypeInput?.value || "",
    connectionType: connectionTypeInput?.value || "",
    customerName: customerNameRoi?.value || "",
    customerPhone: customerPhoneRoi?.value || "",
    customerAddress: customerAddressRoi?.value || ""
  };
}

function saveRoiState() {
  if (!lastRoiData) return;
  const formState = collectRoiFormState();
  const state = {
    ...formState,
    result: lastRoiData,
    timestamp: Date.now()
  };
<<<<<<< HEAD
  sessionStorage.setItem(ROI_STATE_STORAGE_KEY, JSON.stringify(state));
=======
  localStorage.setItem(ROI_STATE_STORAGE_KEY, JSON.stringify(state));
>>>>>>> 81f5cb3012d451a619506ecba522b329391da7eb
}

function saveQuotePrefill(data) {
  const prefill = {
    bill: data.bill,
    stateName: data.location,
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    customerAddress: data.customerAddress,
    customerEmail: "",
    city: "",
    propertyType: ""
  };
<<<<<<< HEAD
  sessionStorage.setItem(QUOTE_PREFILL_STORAGE_KEY, JSON.stringify(prefill));
}

function loadRoiState() {
  const saved = sessionStorage.getItem(ROI_STATE_STORAGE_KEY);
=======
  localStorage.setItem(QUOTE_PREFILL_STORAGE_KEY, JSON.stringify(prefill));
}

function loadRoiState() {
  const saved = localStorage.getItem(ROI_STATE_STORAGE_KEY);
>>>>>>> 81f5cb3012d451a619506ecba522b329391da7eb
  if (!saved) return false;
  
  try {
    const state = JSON.parse(saved);
    
    if (monthlyBillInput) monthlyBillInput.value = state.bill;
    if (locationInput) locationInput.value = state.location;
    if (roofTypeInput) roofTypeInput.value = state.roofType;
    if (connectionTypeInput) connectionTypeInput.value = state.connectionType;
    if (customerNameRoi) customerNameRoi.value = state.customerName;
    if (customerPhoneRoi) customerPhoneRoi.value = state.customerPhone;
    if (customerAddressRoi) customerAddressRoi.value = state.customerAddress;

    if (state.result) {
      lastRoiData = state.result;
      renderRoiResult(state.result);
    } else {
      renderEmptyRoi();
    }

    return true;
<<<<<<< HEAD
  } catch {
=======
  } catch (e) {
    console.error("Error loading ROI state:", e);
>>>>>>> 81f5cb3012d451a619506ecba522b329391da7eb
    return false;
  }
}

function clearRoiState() {
<<<<<<< HEAD
  sessionStorage.removeItem(ROI_STATE_STORAGE_KEY);
=======
  localStorage.removeItem(ROI_STATE_STORAGE_KEY);
>>>>>>> 81f5cb3012d451a619506ecba522b329391da7eb
  lastRoiData = null;
}

function initRoiStateRestore(pageshowEvent) {
  if (shouldRestoreRoiState(pageshowEvent) && loadRoiState()) {
    return;
  }
  clearRoiState();
  renderEmptyRoi();
}

function applyQueryPrefill() {
  const params = new URLSearchParams(window.location.search);
  const bill = Number(params.get("bill") || 0);
  const state = (params.get("state") || "").trim();

  if (bill > 0 && monthlyBillInput && !monthlyBillInput.value) monthlyBillInput.value = String(bill);
  if (state && locationInput && !locationInput.value) locationInput.value = state;
}

roiForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  renderRoi();
});

populateLocationOptions();
initRoiStateRestore();
applyQueryPrefill();

if (buildRoiMetrics() && !lastRoiData) {
  // Query-prefilled visits should show output immediately when all required data exists.
  renderRoi();
} else if (!lastRoiData) {
  renderEmptyRoi();
}

window.addEventListener("pageshow", (event) => initRoiStateRestore(event));

window.addEventListener("pagehide", () => {
  saveRoiState();
});
