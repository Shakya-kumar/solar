/*
Contact form maintenance guide:
- Change `submitToApi()` to alter the backend submission endpoint.
- Change `buildContactPayload()` to alter the payload shape.
- Change the submit handler to affect every form using `data-contact-form`.
*/
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
  const problem = String(formData.get("problem") || "").trim();
  const message = String(formData.get("message") || "").trim();
  const formType = form.dataset.contactForm || "contact";
  return {
    type: formType.includes("service") ? "service" : formType.includes("support") ? "support" : "contact",
    sourcePage: formType.includes("service") ? "Services Page" : "Contact Page",
    name: String(formData.get("name") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    phone: String(formData.get("phone") || "").trim(),
    address: String(formData.get("address") || "").trim(),
    city: String(formData.get("city") || "").trim(),
    subject: String(formData.get("subject") || "Website enquiry").trim(),
    serviceType: problem,
    issueDescription: message || problem,
    problem,
    message: problem && message ? `${problem}: ${message}` : message || problem
  };
}

async function submitToApi(payload) {
  if (!window.VSS_API?.submitLead) throw new Error("Submission module is not loaded.");
  return window.VSS_API.submitLead(payload);
}

document.querySelectorAll("[data-contact-form]").forEach((form) => {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const submitButton = form.querySelector("button[type='submit']");
    const payload = buildContactPayload(form);
    createStatusMessage(form, "Sending your message...", "info");
    if (submitButton) submitButton.disabled = true;

    try {
      const result = await submitToApi(payload);
      if (!result?.success) throw new Error(result?.error || "Submission was not saved.");
      createStatusMessage(form, "Your request was sent successfully and saved. Our team will contact you soon.", "success");
      form.reset();
    } catch (error) {
      createStatusMessage(form, `Unable to send your message: ${error.message}. Please try again later or call us directly.`, "error");
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
});
