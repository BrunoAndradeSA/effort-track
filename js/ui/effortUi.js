import { calculateEffort } from "../services/effortCalculator.js";
import { parseTimeToMinutes } from "../utils/timeUtils.js";

/**
 * Inicializa a interface da Calculadora de Esforço.
 */
export function initEffortUi() {
  const form = document.getElementById("effort-form");
  if (!form) return;

  const resultsContainer = document.getElementById("effort-results-container");
  const statusCard = document.getElementById("effort-status-card");
  const statusTitle = document.getElementById("effort-status-title");
  const statusDesc = document.getElementById("effort-status-desc");
  const completionDateEl = document.getElementById("effort-completion-date");
  const viabilityPercent = document.getElementById("effort-viability-percent");
  const viabilityBar = document.getElementById("effort-viability-bar");
  const workingDaysEl = document.getElementById("effort-working-days");
  
  const devCapacityEl = document.getElementById("dev-capacity");
  const devSlackDelayEl = document.getElementById("dev-slack-delay");
  const devSlackDelayLabel = document.getElementById("dev-slack-delay-label");
  const devStatusIcon = document.getElementById("dev-status-icon");
  const devStatusCard = document.getElementById("dev-status-card");

  const qaCapacityEl = document.getElementById("qa-capacity");
  const qaSlackDelayEl = document.getElementById("qa-slack-delay");
  const qaSlackDelayLabel = document.getElementById("qa-slack-delay-label");
  const qaStatusIcon = document.getElementById("qa-status-icon");
  const qaStatusCard = document.getElementById("qa-status-card");

  const formatDaysAndHours = (res) => {
    return `${res.days}d e ${res.hours}h`;
  };

  const updateCalculation = () => {
    const startDate = document.getElementById("start-date").value;
    const endDate = document.getElementById("end-date").value;
    const qtyDevs = parseInt(document.getElementById("qty-devs").value, 10) || 0;
    const hoursPerDevRaw = document.getElementById("hours-per-dev").value;
    const qtyQas = parseInt(document.getElementById("qty-qas").value, 10) || 0;
    const hoursPerQaRaw = document.getElementById("hours-per-qa").value;
    const estimatedDevHours = parseFloat(document.getElementById("estimated-dev-hours").value) || 0;
    const estimatedQaHours = parseFloat(document.getElementById("estimated-qa-hours").value) || 0;

    const devInputEl = document.getElementById("hours-per-dev");
    const qaInputEl = document.getElementById("hours-per-qa");

    let hoursPerDev = 0;
    let hoursPerQa = 0;
    let hasError = false;

    // Validar e fazer parse das horas DEV
    try {
      if (hoursPerDevRaw.trim() === "") {
        hoursPerDev = 0;
      } else {
        const mins = parseTimeToMinutes(hoursPerDevRaw);
        hoursPerDev = mins / 60;
      }
      devInputEl.classList.remove("error-state-input");
    } catch (err) {
      hasError = true;
      devInputEl.classList.add("error-state-input");
    }

    // Validar e fazer parse das horas QA
    try {
      if (hoursPerQaRaw.trim() === "") {
        hoursPerQa = 0;
      } else {
        const mins = parseTimeToMinutes(hoursPerQaRaw);
        hoursPerQa = mins / 60;
      }
      qaInputEl.classList.remove("error-state-input");
    } catch (err) {
      hasError = true;
      qaInputEl.classList.add("error-state-input");
    }

    if (hasError || !startDate || !endDate) {
      resultsContainer.classList.remove("active");
      return;
    }

    const res = calculateEffort({
      startDate,
      endDate,
      qtyDevs,
      hoursPerDev,
      qtyQas,
      hoursPerQa,
      estimatedDevHours,
      estimatedQaHours
    });

    // Exibir painel de resultados
    resultsContainer.classList.add("active");

    // Atualizar dias úteis
    workingDaysEl.textContent = `${res.workingDays} dia${res.workingDays !== 1 ? "s" : ""} útil/úteis`;

    // Atualizar status global
    statusTitle.textContent = res.global.resultText;
    statusDesc.textContent = `${res.global.canComplete ? "Folga" : "Atraso"} estimada: ${res.global.days}d e ${res.global.hours}h.`;
    const parts = res.completionDate.split("-");
    completionDateEl.textContent = `Data prevista de conclusão: ${parts[2]}/${parts[1]}/${parts[0]}`;
    
    if (res.global.canComplete) {
      statusCard.className = "status-card status-success";
    } else {
      statusCard.className = "status-card status-danger";
    }

    // Atualizar barra de viabilidade
    const viabilityVal = Math.round(res.viability);
    viabilityPercent.textContent = `${viabilityVal}%`;
    viabilityBar.style.width = `${viabilityVal}%`;
    
    // Mudar cor do progresso conforme viabilidade
    if (viabilityVal >= 100) {
      viabilityBar.className = "progress-fill bg-success";
    } else if (viabilityVal >= 70) {
      viabilityBar.className = "progress-fill bg-warning";
    } else {
      viabilityBar.className = "progress-fill bg-danger";
    }

    // Detalhes DEV
    devCapacityEl.textContent = `${res.devCapacity}h`;
    devSlackDelayEl.textContent = formatDaysAndHours(res.devSlackDelay);
    devSlackDelayLabel.textContent = res.devCanComplete ? "Folga Estimada:" : "Atraso Estimado:";
    if (res.devCanComplete) {
      devStatusCard.className = "role-status-card status-success";
      devSlackDelayEl.className = "stat-value text-success";
      devStatusIcon.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      `;
    } else {
      devStatusCard.className = "role-status-card status-danger";
      devSlackDelayEl.className = "stat-value text-danger";
      devStatusIcon.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `;
    }

    // Detalhes QA
    qaCapacityEl.textContent = `${res.qaCapacity}h`;
    qaSlackDelayEl.textContent = formatDaysAndHours(res.qaSlackDelay);
    qaSlackDelayLabel.textContent = res.qaCanComplete ? "Folga Estimada:" : "Atraso Estimado:";
    if (res.qaCanComplete) {
      qaStatusCard.className = "role-status-card status-success";
      qaSlackDelayEl.className = "stat-value text-success";
      qaStatusIcon.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      `;
    } else {
      qaStatusCard.className = "role-status-card status-danger";
      qaSlackDelayEl.className = "stat-value text-danger";
      qaStatusIcon.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `;
    }
  };

  // Escutar eventos de entrada no formulário
  form.addEventListener("input", updateCalculation);
  form.addEventListener("change", updateCalculation);

  // Definir datas iniciais padrão para demonstração
  const today = new Date();
  const end = new Date();
  end.setDate(today.getDate() + 14); // Duas semanas depois

  const formatDateString = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  document.getElementById("start-date").value = formatDateString(today);
  document.getElementById("end-date").value = formatDateString(end);

  // Executar primeiro cálculo inicial
  updateCalculation();
}
