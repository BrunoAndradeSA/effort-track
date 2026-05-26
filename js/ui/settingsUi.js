import { getSettings, saveSettings } from "../services/settingsStorage.js";
import { maskTimeInput } from "../utils/timeUtils.js";

function createBadgeChip(email, container, input) {
  const chip = document.createElement("span");
  chip.className = "badge-chip";
  chip.textContent = email;
  const remove = document.createElement("button");
  remove.className = "badge-chip-remove";
  remove.type = "button";
  remove.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
  remove.addEventListener("click", (e) => {
    e.stopPropagation();
    chip.remove();
  });
  chip.appendChild(remove);
  container.insertBefore(chip, input);
}

function commitPending(badgeContainer) {
  const input = badgeContainer.querySelector(".badge-text-input");
  const raw = input.value.trim();
  if (!raw) return;
  createBadgeChip(raw, badgeContainer, input);
  input.value = "";
}

export function initSettingsUi() {
  const settingsBtn = document.getElementById("settings-btn");
  const modal = document.getElementById("settings-modal");
  const closeBtn = document.getElementById("settings-modal-close-btn");
  const cancelBtn = document.getElementById("settings-cancel-btn");
  const form = document.getElementById("settings-form");
  const hoursInput = document.getElementById("settings-hours-per-day");
  const badgeContainer = document.getElementById("settings-stakeholder-emails");

  if (!settingsBtn || !modal) return;

  maskTimeInput(hoursInput);

  const badgeInput = badgeContainer.querySelector(".badge-text-input");

  badgeInput.addEventListener("input", () => {
    const semiIdx = badgeInput.value.indexOf(";");
    if (semiIdx === -1) return;
    const parts = badgeInput.value.split(";");
    const last = parts.pop();
    parts.forEach(p => {
      const trimmed = p.trim();
      if (trimmed) createBadgeChip(trimmed, badgeContainer, badgeInput);
    });
    badgeInput.value = last;
  });

  badgeInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commitPending(badgeContainer);
    }
    if (e.key === "Backspace" && badgeInput.value === "") {
      const chips = badgeContainer.querySelectorAll(".badge-chip");
      const last = chips[chips.length - 1];
      if (last) last.remove();
    }
  });

  badgeContainer.addEventListener("click", () => badgeInput.focus());

  function renderEmails(emails) {
    badgeContainer.querySelectorAll(".badge-chip").forEach(el => el.remove());
    emails.forEach(email => createBadgeChip(email, badgeContainer, badgeInput));
  }

  function collectEmails() {
    const chips = badgeContainer.querySelectorAll(".badge-chip");
    return Array.from(chips).map(c => c.firstChild.textContent.trim());
  }

  function openModal() {
    const settings = getSettings();
    document.getElementById("settings-default-duration").value = settings.defaultProjectDuration;
    document.getElementById("settings-qty-devs").value = settings.defaultQtyDevs;
    document.getElementById("settings-qty-qas").value = settings.defaultQtyQas;
    hoursInput.value = settings.defaultHoursPerDay;
    renderEmails(settings.stakeholderEmails || []);
    modal.classList.add("active");
    setTimeout(() => badgeInput.focus(), 100);
  }

  function closeModal() {
    modal.classList.remove("active");
  }

  settingsBtn.addEventListener("click", openModal);
  closeBtn.addEventListener("click", closeModal);
  cancelBtn.addEventListener("click", closeModal);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const duration = parseInt(document.getElementById("settings-default-duration").value, 10) || 30;
    const devs = parseInt(document.getElementById("settings-qty-devs").value, 10) || 7;
    const qas = parseInt(document.getElementById("settings-qty-qas").value, 10) || 2;
    const hours = hoursInput.value.trim() || "07:45";
    const emails = collectEmails();

    saveSettings({
      defaultProjectDuration: duration,
      defaultQtyDevs: devs,
      defaultQtyQas: qas,
      defaultHoursPerDay: hours,
      stakeholderEmails: emails
    });

    closeModal();
    window.dispatchEvent(new CustomEvent("settings-changed"));
  });
}
