/**
 * Utilitários para manipulação de horas, minutos e datas.
 */

/**
 * Converte uma string de hora (ex: "7:45", "30h", "45m", "01:30") para minutos.
 * Lança um erro se o formato for inválido.
 * 
 * @param {string} str - A string representando a hora.
 * @returns {number} O valor correspondente em minutos.
 */
export function parseTimeToMinutes(str) {
  str = str.trim().toLowerCase();

  // Caso 1: Formato HH:mm ou HH:mmh ou HH:mmm (ex: 7:45, 01:30, 7:45h)
  const hmMatch = str.match(/^(\d+):(\d+)(h|m)?$/);
  if (hmMatch) {
    const hours = parseInt(hmMatch[1], 10);
    const minutes = parseInt(hmMatch[2], 10);

    if (minutes < 0 || minutes >= 60) {
      throw new Error("Minutos devem ser menores que 60");
    }

    return hours * 60 + minutes;
  }

  // Caso 2: Sufixo h isolado (ex: 30h, 1.5h, 125h)
  const hMatch = str.match(/^(\d+(\.\d+)?)h$/);
  if (hMatch) {
    const hours = parseFloat(hMatch[1]);
    return Math.round(hours * 60);
  }

  // Caso 3: Sufixo m isolado (ex: 30m, 15m)
  const mMatch = str.match(/^(\d+(\.\d+)?)m$/);
  if (mMatch) {
    const minutes = parseFloat(mMatch[1]);
    return Math.round(minutes);
  }

  throw new Error("Formato de hora inválido");
}

/**
 * Formata um valor em minutos de volta para o formato de string HH:mm ou -HH:mm.
 * 
 * @param {number} minutes - O total de minutos.
 * @returns {string} A representação em formato HH:mm.
 */
export function formatMinutesToTime(minutes) {
  if (isNaN(minutes) || !isFinite(minutes)) {
    return "00:00";
  }

  const isNegative = minutes < 0;
  const totalMins = Math.round(Math.abs(minutes));
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;

  const signStr = isNegative ? "-" : "";
  const hoursStr = String(hours).padStart(2, "0");
  const minsStr = String(mins).padStart(2, "0");

  return `${signStr}${hoursStr}:${minsStr}`;
}

/**
 * Calcula o número de dias úteis (segunda a sexta) entre duas datas (inclusive).
 * 
 * @param {string} startDateStr - Data de início (YYYY-MM-DD)
 * @param {string} endDateStr - Data de fim (YYYY-MM-DD)
 * @returns {number} Quantidade de dias úteis
 */
export function calculateWorkingDays(startDateStr, endDateStr) {
  if (!startDateStr || !endDateStr) return 0;

  // Criar datas com hora local para evitar problemas de fuso horário
  const start = new Date(startDateStr + "T00:00:00");
  const end = new Date(endDateStr + "T00:00:00");

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
    return 0;
  }

  let workingDays = 0;
  const current = new Date(start);

  while (current <= end) {
    const dayOfWeek = current.getDay();
    // 0 = Domingo, 6 = Sábado
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workingDays++;
    }
    current.setDate(current.getDate() + 1);
  }

  return workingDays;
}

/**
 * Aplica máscara de formatação HH:mm em um input text enquanto o usuário digita.
 * Apenas dígitos são aceitos; o ":" é inserido automaticamente após os dois primeiros dígitos.
 *
 * @param {HTMLInputElement} input - O elemento input para aplicar a máscara
 */
export function maskTimeInput(input) {
  input.addEventListener("input", () => {
    let value = input.value.replace(/\D/g, "").slice(0, 4);

    if (value.length >= 3) {
      value = value.slice(0, 2) + ":" + value.slice(2);
    }

    input.value = value;
  });

  input.addEventListener("blur", () => {
    if (!input.value) return;

    const parts = input.value.split(":");
    let hh = parts[0] ? parts[0].padStart(2, "0") : "00";
    let mm = parts[1] ? parts[1].padStart(2, "0") : "00";

    const hhNum = parseInt(hh, 10);
    const mmNum = parseInt(mm, 10);

    const hasError = hhNum > 23 || mmNum > 59;

    if (hasError) {
      input.classList.add("error-state-input");
    } else {
      input.classList.remove("error-state-input");
    }

    if (hhNum > 23) hh = "23";
    if (mmNum > 59) mm = "59";

    input.value = `${hh}:${mm}`;
  });
}

/**
 * Avança uma data somando dias úteis (ignorando sábados e domingos).
 *
 * @param {string} startDateStr - Data inicial (YYYY-MM-DD)
 * @param {number} days - Quantidade de dias úteis a avançar
 * @returns {string} Data resultante no formato YYYY-MM-DD
 */
export function addWorkingDays(startDateStr, days) {
  if (!startDateStr || days <= 0) return startDateStr;

  const date = new Date(startDateStr + "T00:00:00");
  let added = 0;

  while (added < days) {
    date.setDate(date.getDate() + 1);
    const dayOfWeek = date.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      added++;
    }
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
