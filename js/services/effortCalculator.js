import { calculateWorkingDays, addWorkingDays } from "../utils/timeUtils.js";

/**
 * Calcula a viabilidade do projeto, capacidade das equipes e folga/atraso.
 * 
 * @param {object} params - Parâmetros fornecidos no formulário.
 * @param {string} params.startDate - Data de início (YYYY-MM-DD).
 * @param {string} params.endDate - Data de fim (YYYY-MM-DD).
 * @param {number} params.qtyDevs - Quantidade de DEVs.
 * @param {number} params.hoursPerDev - Horas diárias por DEV.
 * @param {number} params.qtyQas - Quantidade de QAs.
 * @param {number} params.hoursPerQa - Horas diárias por QA.
 * @param {number} params.estimatedDevHours - Esforço estimado de DEV (em horas).
 * @param {number} params.estimatedQaHours - Esforço estimado de QA (em horas).
 * 
 * @returns {object} Resultados detalhados do cálculo.
 */
export function calculateEffort(params) {
  const {
    startDate,
    endDate,
    qtyDevs = 0,
    hoursPerDev = 0,
    qtyQas = 0,
    hoursPerQa = 0,
    estimatedDevHours = 0,
    estimatedQaHours = 0
  } = params;

  // 1. Calcular dias úteis
  const workingDays = calculateWorkingDays(startDate, endDate);

  // 2. Calcular capacidades individuais e diárias das equipes
  const devDailyCapacity = qtyDevs * hoursPerDev;
  const qaDailyCapacity = qtyQas * hoursPerQa;

  const devCapacity = workingDays * devDailyCapacity;
  const qaCapacity = workingDays * qaDailyCapacity;

  // 3. Verificar folgas ou atrasos (em horas)
  const devDiff = devCapacity - estimatedDevHours;
  const qaDiff = qaCapacity - estimatedQaHours;

  const devCanComplete = devDiff >= 0;
  const qaCanComplete = qaDiff >= 0;
  const projectCanComplete = devCanComplete && qaCanComplete;

  // Auxiliar para converter horas em dias e horas úteis da equipe
  const convertHours = (hours, qty, hoursPerDay) => {
    const absHours = Math.abs(hours);
    const dailyCap = qty * hoursPerDay;
    if (dailyCap <= 0) {
      return { days: 0, hours: Math.round(absHours) };
    }
    const days = Math.floor(absHours / dailyCap);
    const remainingHours = Math.round(absHours % dailyCap);
    return { days, hours: remainingHours };
  };

  const devSlackDelay = convertHours(devDiff, qtyDevs, hoursPerDev);
  const qaSlackDelay = convertHours(qaDiff, qtyQas, hoursPerQa);

  // 4. Calcular percentual de viabilidade
  // Usa o gargalo (papel limitante) como base: dias necessários vs dias disponíveis
  const devWorkDaysNeeded = devDailyCapacity > 0 ? estimatedDevHours / devDailyCapacity : 0;
  const qaWorkDaysNeeded = qaDailyCapacity > 0 ? estimatedQaHours / qaDailyCapacity : 0;
  const bottleneckDays = Math.max(devWorkDaysNeeded, qaWorkDaysNeeded);

  let viability = 100;
  if (bottleneckDays > 0 && workingDays > 0) {
    viability = (workingDays / bottleneckDays) * 100;
  } else if (bottleneckDays === 0 && estimatedDevHours === 0 && estimatedQaHours === 0) {
    viability = 0;
  }

  viability = Math.min(100, Math.max(0, viability));

  // Para folga/atraso global, usamos o papel limitante (o pior cenário)
  // Se o projeto pode ser concluído, a folga geral é limitada pelo que tem menos folga relativa
  // Se não pode, o atraso geral é determinado pelo maior atraso
  let globalResultText = "";
  let globalDays = 0;
  let globalHours = 0;

  if (projectCanComplete) {
    globalResultText = "Projeto pode ser concluído.";
    // Determinar a folga geral. Se ambas estão OK, a folga calendarizada real do projeto é o mínimo das folgas (em dias úteis)
    // Para simplificar, calculamos a folga de DEV e de QA e usamos a que for menor em dias úteis equivalentes
    const devSlackDaysEquivalent = devDailyCapacity > 0 ? devDiff / devDailyCapacity : 0;
    const qaSlackDaysEquivalent = qaDailyCapacity > 0 ? qaDiff / qaDailyCapacity : 0;

    if (devSlackDaysEquivalent <= qaSlackDaysEquivalent) {
      globalDays = devSlackDelay.days;
      globalHours = devSlackDelay.hours;
    } else {
      globalDays = qaSlackDelay.days;
      globalHours = qaSlackDelay.hours;
    }
  } else {
    globalResultText = "Projeto NÃO pode ser concluído.";
    // O atraso é a soma ou o gargalo? O atraso é determinado pelo papel que está atrasado.
    // Se ambos estão atrasados, o gargalo de tempo real é o maior atraso em termos de dias equivalentes.
    const devDelayDaysEquivalent = devDailyCapacity > 0 && devDiff < 0 ? Math.abs(devDiff) / devDailyCapacity : 0;
    const qaDelayDaysEquivalent = qaDailyCapacity > 0 && qaDiff < 0 ? Math.abs(qaDiff) / qaDailyCapacity : 0;

    if (devDelayDaysEquivalent >= qaDelayDaysEquivalent) {
      globalDays = devSlackDelay.days;
      globalHours = devSlackDelay.hours;
    } else {
      globalDays = qaSlackDelay.days;
      globalHours = qaSlackDelay.hours;
    }
  }

  // 5. Calcular data prevista de conclusão (considerando o gargalo)
  const completionDate = bottleneckDays > 0 ? addWorkingDays(startDate, Math.ceil(bottleneckDays)) : startDate;

  return {
    workingDays,
    devCapacity,
    qaCapacity,
    devDiff,
    qaDiff,
    devCanComplete,
    qaCanComplete,
    projectCanComplete,
    devSlackDelay,
    qaSlackDelay,
    viability,
    completionDate,
    global: {
      canComplete: projectCanComplete,
      resultText: globalResultText,
      days: globalDays,
      hours: globalHours
    }
  };
}
