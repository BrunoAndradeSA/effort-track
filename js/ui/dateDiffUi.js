import { calculateWorkingDays, parseTimeToMinutes, maskTimeInput } from "../utils/timeUtils.js";
import { getSettings } from "../services/settingsStorage.js";

export function initDateDiffUi() {
  const startInput = document.getElementById("diff-start-date");
  const endInput = document.getElementById("diff-end-date");
  const hoursInput = document.getElementById("diff-hours-per-day");
  const totalDaysEl = document.getElementById("diff-total-days");
  const workingDaysEl = document.getElementById("diff-working-days");
  const totalHoursEl = document.getElementById("diff-total-hours");
  const resultContainer = document.getElementById("diff-result-container");
  const errorEl = document.getElementById("diff-error");

  const update = () => {
    const start = startInput.value;
    const end = endInput.value;
    const hoursRaw = hoursInput.value.trim();

    errorEl.classList.remove("active");
    resultContainer.classList.remove("active");

    if (!start || !end || !hoursRaw) return;

    // Validar data final > data inicial
    if (end <= start) {
      errorEl.textContent = "A data final deve ser maior que a data inicial.";
      errorEl.classList.add("active");
      return;
    }

    // Validar e converter horas por dia
    let hoursPerDay = 0;
    try {
      const mins = parseTimeToMinutes(hoursRaw);
      hoursPerDay = mins / 60;
      hoursInput.classList.remove("error-state-input");
    } catch (_) {
      errorEl.textContent = "Horas úteis/dia inválido. Use formatos como 08:00, 8h ou 480m.";
      errorEl.classList.add("active");
      hoursInput.classList.add("error-state-input");
      return;
    }

    if (hoursPerDay <= 0) {
      errorEl.textContent = "As horas úteis/dia devem ser maiores que zero.";
      errorEl.classList.add("active");
      hoursInput.classList.add("error-state-input");
      return;
    }

    // Calcular dias totais (incluindo finais de semana)
    const startDate = new Date(start + "T00:00:00");
    const endDate = new Date(end + "T00:00:00");
    const diffTime = endDate.getTime() - startDate.getTime();
    const totalDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    // Calcular dias úteis
    const workingDays = calculateWorkingDays(start, end);

    // Calcular horas úteis totais
    const totalHours = workingDays * hoursPerDay;

    totalDaysEl.textContent = `${totalDays} dia${totalDays !== 1 ? "s" : ""}`;
    workingDaysEl.textContent = `${workingDays} dia${workingDays !== 1 ? "s" : ""}`;

    const hh = Math.floor(totalHours);
    const mm = Math.round((totalHours - hh) * 60);
    totalHoursEl.textContent = `${hh}h${mm > 0 ? ` e ${mm}m` : ""}`;

    resultContainer.classList.add("active");
  };

  // Aplicar máscara de horário
  maskTimeInput(hoursInput);

  startInput.addEventListener("input", update);
  endInput.addEventListener("input", update);
  hoursInput.addEventListener("input", update);
  hoursInput.addEventListener("change", update);

  // Valores padrão
  const today = new Date();
  const end = new Date();
  end.setDate(today.getDate() + 14);
  const fmt = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };
  startInput.value = fmt(today);
  endInput.value = fmt(end);
  hoursInput.value = getSettings().defaultHoursPerDay;

  update();
}
