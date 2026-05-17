/*
Services modal maintenance guide:
- Change `openModal()` to alter how service requests are prefilled.
- Change `closeModal()` to alter modal closing behavior.
- Change the trigger listeners to alter which cards open the modal.
*/
const serviceModal = document.getElementById("serviceModal");
const serviceProblemInput = document.getElementById("serviceProblemInput");
const serviceTriggers = document.querySelectorAll(".service-trigger");

if (serviceModal && serviceTriggers.length) {
  const openModal = (serviceType = "") => {
    serviceModal.classList.add("open");
    serviceModal.setAttribute("aria-hidden", "false");
    if (serviceProblemInput && serviceType) {
      serviceProblemInput.value = `${serviceType} support needed`;
    }
  };

  const closeModal = () => {
    serviceModal.classList.remove("open");
    serviceModal.setAttribute("aria-hidden", "true");
  };

  serviceTriggers.forEach((card) => {
    card.addEventListener("click", () => openModal(card.dataset.serviceType || ""));
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openModal(card.dataset.serviceType || "");
      }
    });
  });

  serviceModal.addEventListener("click", (event) => {
    const closeTarget = event.target.closest("[data-close-service-modal='true']");
    if (closeTarget) closeModal();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && serviceModal.classList.contains("open")) {
      closeModal();
    }
  });
}

