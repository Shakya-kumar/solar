const EMAILJS_SERVICE_ID = "YOUR_SERVICE_ID";
const EMAILJS_TEMPLATE_ID = "YOUR_TEMPLATE_ID";
const EMAILJS_PUBLIC_KEY = "YOUR_PUBLIC_KEY";
const EMAILJS_SCRIPT_URL = "https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js";

const WEB3FORMS_API_URL = "https://api.web3forms.com/submit";
const WEB3FORMS_ACCESS_KEY = "YOUR_WEB3FORMS_ACCESS_KEY";
const WEB3FORMS_TO_EMAIL = "vaibhavtraders1507@gmail.com";

const FORMSPREE_FORM_ID = "YOUR_FORM_ID";
const FORMSPREE_API_URL = FORMSPREE_FORM_ID ? `https://formspree.io/f/${FORMSPREE_FORM_ID}` : "";

let emailJsReady = false;
let emailJsLoadingPromise = null;

function isConfigured(value) {
  return typeof value === "string" && value.trim() !== "" && !value.includes("YOUR_");
}

function isEmailJsConfigured() {
  return isConfigured(EMAILJS_SERVICE_ID) && isConfigured(EMAILJS_TEMPLATE_ID) && isConfigured(EMAILJS_PUBLIC_KEY);
}

function isWeb3FormsConfigured() {
  return isConfigured(WEB3FORMS_ACCESS_KEY) && isConfigured(WEB3FORMS_TO_EMAIL);
}

function isFormspreeConfigured() {
  return isConfigured(FORMSPREE_FORM_ID);
}

async function loadEmailJs() {
  if (window.emailjs) {
    return;
  }
  if (emailJsLoadingPromise) {
    return emailJsLoadingPromise;
  }

  emailJsLoadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = EMAILJS_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Unable to load EmailJS library."));
    document.head.appendChild(script);
  });

  await emailJsLoadingPromise;
}

function initEmailJs() {
  if (!window.emailjs || emailJsReady) {
    return;
  }

  emailjs.init(EMAILJS_PUBLIC_KEY);
  emailJsReady = true;
}

async function ensureEmailServiceReady() {
  if (!window.emailjs) {
    await loadEmailJs();
  }
  initEmailJs();
}

function buildEmailSubject(payload = {}) {
  const type = String(payload.type || "contact").trim().toLowerCase();
  const prefix = type === "quote"
    ? "Quotation"
    : type === "roi"
    ? "ROI Report"
    : type === "service"
    ? "Service Request"
    : "Website Request";

  return `Vaibhav Solar Solutions - ${prefix} | ${String(payload.name || payload.customerName || "Customer").trim()}`;
}

function buildFallbackMessage(payload = {}) {
  const lines = [
    `Type: ${String(payload.type || "contact").trim()}`,
    `Source: ${String(payload.source || "website").trim()}`,
    `Action: ${String(payload.actionType || "submission").trim()}`,
    `Name: ${String(payload.name || payload.customerName || "").trim()}`,
    `Email: ${String(payload.email || payload.customerEmail || "").trim()}`,
    `Phone: ${String(payload.phone || payload.customerPhone || "").trim()}`,
    `Location: ${String(payload.location || payload.address || "").trim()}`,
    `Address: ${String(payload.address || payload.location || "").trim()}`,
    `Service Type: ${String(payload.serviceType || "").trim()}`,
    `Message: ${String(payload.message || payload.user_message || "").trim()}`,
    `Timestamp: ${String(payload.timestamp || new Date().toISOString()).trim()}`,
    "",
    payload.roi ? `ROI Details:\n${JSON.stringify(payload.roi, null, 2)}` : "",
    payload.quote ? `Quotation Details:\n${JSON.stringify(payload.quote, null, 2)}` : ""
  ];

  return lines.filter(Boolean).join("\n");
}

function buildEmailParams(payload = {}) {
  const normalized = {
    type: String(payload.type || "contact").trim(),
    source: String(payload.source || "website").trim(),
    actionType: String(payload.actionType || payload.type || "submission").trim(),
    name: String(payload.name || payload.customerName || "").trim(),
    email: String(payload.email || payload.customerEmail || "").trim(),
    phone: String(payload.phone || payload.customerPhone || "").trim(),
    location: String(payload.location || payload.address || "").trim(),
    address: String(payload.address || payload.location || "").trim(),
    message: String(payload.message || payload.user_message || "").trim(),
    serviceType: String(payload.serviceType || "").trim(),
    timestamp: String(payload.timestamp || new Date().toISOString()).trim(),
    roiDetails: payload.roi ? JSON.stringify(payload.roi, null, 2) : "",
    quoteDetails: payload.quote ? JSON.stringify(payload.quote, null, 2) : ""
  };

  return {
    action_type: normalized.actionType,
    request_type: normalized.type,
    source: normalized.source,
    customer_name: normalized.name,
    customer_email: normalized.email,
    customer_phone: normalized.phone,
    customer_location: normalized.location,
    customer_address: normalized.address,
    customer_message: normalized.message,
    service_type: normalized.serviceType,
    roi_details: normalized.roiDetails,
    quote_details: normalized.quoteDetails,
    timestamp: normalized.timestamp
  };
}

async function sendEmailViaWeb3Forms(payload = {}) {
  if (!isWeb3FormsConfigured()) {
    throw new Error("Web3Forms is not configured.");
  }

  const subject = buildEmailSubject(payload);
  const message = buildFallbackMessage(payload);
  const body = {
    access_key: WEB3FORMS_ACCESS_KEY,
    to: WEB3FORMS_TO_EMAIL,
    subject,
    sender_name: String(payload.name || payload.customerName || "Website Visitor").trim(),
    sender_email: String(payload.email || payload.customerEmail || "no-reply@vaibhavsolarsolutions.com").trim() || "no-reply@vaibhavsolarsolutions.com",
    reply_to: String(payload.email || payload.customerEmail || "no-reply@vaibhavsolarsolutions.com").trim() || "no-reply@vaibhavsolarsolutions.com",
    message,
    data: {
      type: payload.type || "contact",
      source: payload.source || "website",
      timestamp: payload.timestamp || new Date().toISOString()
    }
  };

  const response = await fetch(WEB3FORMS_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const json = await response.json().catch(() => ({}));
    const messageText = json.message || `Web3Forms responded with ${response.status}`;
    throw new Error(messageText);
  }

  const responseData = await response.json().catch(() => null);
  if (responseData && responseData.success === false) {
    const messageText = responseData.message || "Web3Forms reported a failure.";
    throw new Error(messageText);
  }

  return responseData;
}

async function sendEmailViaFormspree(payload = {}) {
  if (!isFormspreeConfigured()) {
    throw new Error("Formspree is not configured.");
  }

  const subject = buildEmailSubject(payload);
  const message = buildFallbackMessage(payload);
  const body = {
    _subject: subject,
    name: String(payload.name || payload.customerName || "Website Visitor").trim(),
    email: String(payload.email || payload.customerEmail || "no-reply@vaibhavsolarsolutions.com").trim() || "no-reply@vaibhavsolarsolutions.com",
    message,
    type: payload.type || "contact",
    source: payload.source || "website",
    timestamp: payload.timestamp || new Date().toISOString()
  };

  const response = await fetch(FORMSPREE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const json = await response.json().catch(() => ({}));
    const messageText = json.error || json.message || `Formspree responded with ${response.status}`;
    throw new Error(messageText);
  }

  return await response.json().catch(() => null);
}

async function sendEmail(data) {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid email payload.");
  }

  const errors = [];

  if (isEmailJsConfigured()) {
    try {
      await ensureEmailServiceReady();
      const templateParams = buildEmailParams(data);
      return await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);
    } catch (emailJsError) {
      errors.push(`EmailJS: ${emailJsError.message || emailJsError}`);
    }
  }

  if (isWeb3FormsConfigured()) {
    try {
      return await sendEmailViaWeb3Forms(data);
    } catch (web3FormsError) {
      errors.push(`Web3Forms: ${web3FormsError.message || web3FormsError}`);
    }
  }

  if (isFormspreeConfigured()) {
    try {
      return await sendEmailViaFormspree(data);
    } catch (formspreeError) {
      errors.push(`Formspree: ${formspreeError.message || formspreeError}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(errors.join(" | "));
  }

  throw new Error(
    "No email provider is configured. Set EmailJS, Web3Forms, or Formspree values in email.js."
  );
}

window.sendEmail = sendEmail;
window.buildEmailParams = buildEmailParams;
window.EMAILJS_CONFIG = {
  serviceId: EMAILJS_SERVICE_ID,
  templateId: EMAILJS_TEMPLATE_ID,
  publicKey: EMAILJS_PUBLIC_KEY,
  scriptUrl: EMAILJS_SCRIPT_URL,
  fallbackProvider: isWeb3FormsConfigured()
    ? "web3forms"
    : isFormspreeConfigured()
    ? "formspree"
    : "none"
};
