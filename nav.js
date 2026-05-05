/*
Navigation maintenance guide:
- Change the active-link logic if header URLs or routing rules change.
- Change the menu-toggle block to alter mobile navigation behavior.
- Change the card animation blocks to affect hover/pop/glow behavior site-wide.
*/
const currentPage = window.location.pathname.split("/").pop() || "index.html";
const navLinks = document.querySelectorAll("header nav a");

navLinks.forEach((link) => {
  const href = link.getAttribute("href");
  if (href === currentPage) {
    link.classList.add("active-link");
  }
});

const topbar = document.querySelector(".topbar");
const navContainer = document.querySelector(".nav");
const nav = document.querySelector("header nav");

if (topbar && navContainer && nav && !document.querySelector(".menu-toggle")) {
  const toggle = document.createElement("button");
  toggle.className = "menu-toggle";
  toggle.type = "button";
  toggle.setAttribute("aria-label", "Open menu");
  toggle.setAttribute("aria-expanded", "false");
  toggle.innerHTML = "<span></span><span></span><span></span>";
  navContainer.insertBefore(toggle, nav);
  toggle.addEventListener("click", () => {
    const isOpen = topbar.classList.toggle("menu-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });
}

document.body.classList.add("site-fade");

const popTargets = document.querySelectorAll(".brand-card, .registration-card");
if (popTargets.length) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("in-view");
    });
  }, { threshold: 0.2 });
  popTargets.forEach((el) => {
    el.classList.add("animate-pop-in");
    io.observe(el);
  });
}

const counters = document.querySelectorAll("[data-counter-target]");
if (counters.length) {
  const io = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      if (el.dataset.counterStarted) return; // Prevent double animation
      el.dataset.counterStarted = "true";
      const target = Number(el.getAttribute("data-counter-target") || "0");
      let value = 0;
      const step = Math.max(4, Math.ceil(target / 40));
      const timer = window.setInterval(() => {
        value += step;
        if (value >= target) {
          value = target;
          clearInterval(timer);
        }
        el.textContent = `${value}+`;
      }, 22);
      observer.unobserve(el);
    });
  }, { threshold: 0.2 });
  counters.forEach((counter) => io.observe(counter));
}

const interactiveCards = document.querySelectorAll(".brand-card, .registration-card");
if (interactiveCards.length) {
  document.addEventListener("mousemove", (e) => {
    interactiveCards.forEach((card) => {
      const rect = card.getBoundingClientRect();
      const cardCenterX = rect.left + rect.width / 2;
      const cardCenterY = rect.top + rect.height / 2;
      const distX = e.clientX - cardCenterX;
      const distY = e.clientY - cardCenterY;
      const distance = Math.sqrt(distX * distX + distY * distY);

      if (distance < 250) {
        const intensity = 1 - distance / 250;
        const glowColor = `rgba(16, 138, 53, ${0.14 * intensity})`;
        card.style.boxShadow = `0 14px 30px rgba(16, 138, 53, ${0.24 * intensity}), 0 0 18px ${glowColor}, 0 0 36px ${glowColor}`;
        card.style.transform = `translateY(${-5 * intensity}px) scale(${1 + 0.03 * intensity})`;
      } else {
        card.style.boxShadow = "";
        card.style.transform = "";
      }
    });
  });
}

