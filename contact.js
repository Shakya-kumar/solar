/*
Contact form maintenance guide:
- Change `buildContactPayload()` to alter the payload shape.
- Change the submit handler to affect every form using `data-contact-form`.
*/

const GOOGLE_SHEETS_URL = "https://script.google.com/macros/s/AKfycbx6PeY1ywgHn7S81tBsOUvIqne2JIqpleEDywMrbEm55mw10MNM0poq8bxnI4c4SwCO/exec";
const GOOGLE_SHEETS_MAX_RETRIES = 2;
const GOOGLE_SHEETS_RETRY_DELAY_MS = 800;

function createStatusMessage(form, message, type = "info") {
  const existing = form.querySelector(".form-status");
  if (existing) existing.remove();

  const status = document.createElement("div");
  status.className = `form-status status-banner status-${type}`;
  status.textContent = message;
  form.prepend(status);
  return status;
}

function buildContactPayload(form) {
  const formData = new FormData(form);
  const formType = form.dataset.contactForm || "contact";
  const isService = formType === "service_page";
  
  return {
    type: isService ? "SERVICE" : "MESSAGE",
    name: String(formData.get("name") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    phone: String(formData.get("phone") || "").trim(),
    address: String(formData.get("address") || "").trim(),
    message: String(formData.get("message") || "").trim(),
    serviceType: isService ? String(formData.get("serviceType") || "").trim() : "",
    timestamp: new Date().toISOString()
  };
}

async function sendContactFormToSheet(formType, payload) {
  console.log(`[${payload.type}] Sending payload:`, payload);

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
        console.log(`[${payload.type}] ✅ Saved:`, result);
        return result;
      } else {
        throw new Error(result.message || "Server returned error");
      }
    } catch (error) {
      lastError = error;
      console.warn(`[${payload.type}] Attempt ${attempt} failed:`, error.message);
      if (attempt < GOOGLE_SHEETS_MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, GOOGLE_SHEETS_RETRY_DELAY_MS));
      }
    }
  }

  console.error(`[${payload.type}] All attempts failed. Final error:`, lastError);
  throw lastError;
}

document.querySelectorAll("[data-contact-form]").forEach((form) => {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const payload = buildContactPayload(form);
    const statusMsg = payload.type === "SERVICE" ? "Submitting service request..." : "Saving your message...";
    createStatusMessage(form, statusMsg, "info");

    let sheetSaved = false;
    try {
      await sendContactFormToSheet(form.dataset.contactForm, payload);
      sheetSaved = true;
    } catch (sheetError) {
      console.error("Contact form sheet save failed:", sheetError);
    }

    let emailSent = false;
    let emailError = null;
    if (typeof sendEmail === "function") {
      try {
        await sendEmail(payload);
        emailSent = true;
      } catch (error) {
        emailError = error;
        console.error("Contact form sendEmail failed:", error);
      }
    }

    if (sheetSaved && !emailError) {
      createStatusMessage(form, "Your message was saved successfully. Our team will contact you soon.", "success");
      form.reset();
      return;
    }

    if (sheetSaved && emailError) {
      createStatusMessage(form, "Saved to Google Sheets, but email delivery failed. We will still contact you.", "warning");
      form.reset();
      return;
    }

    if (!sheetSaved && emailSent) {
      createStatusMessage(form, "Your message was sent successfully, but Google Sheets save failed.", "warning");
      form.reset();
      return;
    }

    createStatusMessage(form, "Unable to submit your message. Please try again later or call us directly.", "error");
  });
});

