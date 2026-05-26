import { getSettings, saveSettings } from "../services/settingsStorage.js";
import { maskTimeInput } from "../utils/timeUtils.js";

export function initSettingsUi() {
  const settingsBtn = document.getElementById("settings-btn");
  const modal = document.getElementById("settings-modal");
  const closeBtn = document.getElementById("settings-modal-close-btn");
  const cancelBtn = document.getElementById("settings-cancel-btn");
  const form = document.getElementById("settings-form");
  const hoursInput = document.getElementById("settings-hours-per-day");

  if (!settingsBtn || !modal) return;

  maskTimeInput(hoursInput);

  function openModal() {
    const settings = getSettings();
    document.getElementById("settings-default-duration").value = settings.defaultProjectDuration;
    document.getElementById("settings-qty-devs").value = settings.defaultQtyDevs;
    document.getElementById("settings-qty-qas").value = settings.defaultQtyQas;
    hoursInput.value = settings.defaultHoursPerDay;
    modal.classList.add("active");
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

    saveSettings({
      defaultProjectDuration: duration,
      defaultQtyDevs: devs,
      defaultQtyQas: qas,
      defaultHoursPerDay: hours
    });

    closeModal();

    window.dispatchEvent(new CustomEvent("settings-changed"));
  });
}
