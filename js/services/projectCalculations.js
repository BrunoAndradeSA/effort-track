import { calculateWorkingDays, addWorkingDays } from '../utils/timeUtils.js';

/**
 * Calcula todas as métricas automáticas de um projeto.
 * 
 * @param {object} project - Objeto contendo os dados do projeto.
 * @param {string} [todayDateStr] - Data de referência (hoje) no formato YYYY-MM-DD. Se omitida, usa a data atual local.
 * @returns {object} Métricas calculadas para o projeto.
 */
export function calculateProjectMetrics(project, todayDateStr) {
  if (!todayDateStr) {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    todayDateStr = `${year}-${month}-${day}`;
  }

  const {
    startDate,
    endDate,
    completed = false,
    qtyDevs = 0,
    hoursPerDev = 0,
    qtyQas = 0,
    hoursPerQa = 0,
    estimatedDevHours = 0,
    estimatedQaHours = 0,
    hoursDevRealized = 0,
    hoursQaRealized = 0
  } = project;

  // 1. Capacidade Diária
  const devDailyCapacity = qtyDevs * hoursPerDev;
  const qaDailyCapacity = qtyQas * hoursPerQa;
  const totalDailyCapacity = devDailyCapacity + qaDailyCapacity;

  // 2. Dias Úteis do Projeto
  const totalWorkingDays = calculateWorkingDays(startDate, endDate);

  // Dias úteis decorridos até hoje
  let elapsedWorkingDays = 0;
  if (todayDateStr >= startDate) {
    if (todayDateStr > endDate) {
      elapsedWorkingDays = totalWorkingDays;
    } else {
      elapsedWorkingDays = calculateWorkingDays(startDate, todayDateStr);
    }
  }

  // Dias úteis restantes
  const remainingWorkingDays = Math.max(0, totalWorkingDays - elapsedWorkingDays);

  // 3. Progresso Esperado (%)
  // Base do cálculo considerando capacidade e esforço planejado até a data atual
  const totalEstimates = estimatedDevHours + estimatedQaHours;
  let expectedProgress = 0;

  if (totalEstimates > 0 && totalWorkingDays > 0) {
    const expectedDevHoursToday = Math.min(estimatedDevHours, elapsedWorkingDays * devDailyCapacity);
    const expectedQaHoursToday = Math.min(estimatedQaHours, elapsedWorkingDays * qaDailyCapacity);
    expectedProgress = ((expectedDevHoursToday + expectedQaHoursToday) / totalEstimates) * 100;
  }
  expectedProgress = Math.min(100, Math.max(0, expectedProgress));

  // 4. Progresso Real (%)
  const devProgressReal = estimatedDevHours > 0 ? (hoursDevRealized / estimatedDevHours) * 100 : 0;
  const qaProgressReal = estimatedQaHours > 0 ? (hoursQaRealized / estimatedQaHours) * 100 : 0;
  
  let overallProgressReal = 0;
  if (totalEstimates > 0) {
    // Progresso consolidado baseado na soma das horas realizadas em relação às estimadas
    // Capped a 100% para a barra de progresso visual de conclusão, mas mantemos o valor real para exibição se necessário
    const cappedDevReal = Math.min(hoursDevRealized, estimatedDevHours);
    const cappedQaReal = Math.min(hoursQaRealized, estimatedQaHours);
    overallProgressReal = ((cappedDevReal + cappedQaReal) / totalEstimates) * 100;
  }
  overallProgressReal = Math.min(100, Math.max(0, overallProgressReal));

  // 5. Horas e Dias Restantes e Data Prevista de Conclusão (Gargalo)
  const devRemainingNeeded = Math.max(0, estimatedDevHours - hoursDevRealized);
  const qaRemainingNeeded = Math.max(0, estimatedQaHours - hoursQaRealized);
  const totalRemainingNeeded = devRemainingNeeded + qaRemainingNeeded;

  const devDaysNeeded = devDailyCapacity > 0 ? devRemainingNeeded / devDailyCapacity : 0;
  const qaDaysNeeded = qaDailyCapacity > 0 ? qaRemainingNeeded / qaDailyCapacity : 0;
  const bottleneckRemainingDays = Math.ceil(Math.max(devDaysNeeded, qaDaysNeeded));

  // A projeção de conclusão é feita a partir de hoje (ou a partir da data de início caso o projeto não tenha começado)
  const baseProjectDate = todayDateStr < startDate ? startDate : todayDateStr;
  const projectedCompletionDate = completed 
    ? endDate 
    : (bottleneckRemainingDays > 0 ? addWorkingDays(baseProjectDate, bottleneckRemainingDays) : baseProjectDate);

  // 6. Chance de Conclusão no Prazo (%)
  let successChance = 0;

  if (completed) {
    successChance = 100;
  } else if (totalEstimates === 0) {
    successChance = 100;
  } else if (hoursDevRealized >= estimatedDevHours && hoursQaRealized >= estimatedQaHours) {
    successChance = 100;
  } else if (todayDateStr > endDate && !completed) {
    // Prazo expirou e o projeto não foi finalizado
    successChance = 0;
  } else if (hoursDevRealized === 0 && hoursQaRealized === 0 && elapsedWorkingDays <= 1) {
    // Novo projeto, no início do prazo e sem horas registradas ainda
    successChance = 70;
  } else {
    // Heurística de desvio e ritmo
    const expectedHoursToday = (elapsedWorkingDays / Math.max(1, totalWorkingDays)) * totalEstimates;
    const currentTotalRealized = hoursDevRealized + hoursQaRealized;
    const deviation = currentTotalRealized - expectedHoursToday;
    const percentDeviation = deviation / totalEstimates; // Desvio relativo

    // Calcular base da chance baseada no desvio de ritmo
    let baseChance = 70; // 70% é a base para o projeto que está "no prazo"
    if (percentDeviation >= 0) {
      // Adiantado
      baseChance = 70 + (percentDeviation * 30); // escala até 100%
    } else {
      // Atrasado
      baseChance = 70 + (percentDeviation * 80); // penalização mais agressiva
    }
    baseChance = Math.min(99, Math.max(5, baseChance));

    // Fator 2: Limitação física de capacidade restante
    // Verificamos se a equipe tem horas de capacidade suficientes nos dias que faltam para entregar o esforço restante
    const devCapRemaining = remainingWorkingDays * devDailyCapacity;
    const qaCapRemaining = remainingWorkingDays * qaDailyCapacity;

    const devCapRatio = devRemainingNeeded > 0 ? (devCapRemaining / devRemainingNeeded) : 1;
    const qaCapRatio = qaRemainingNeeded > 0 ? (qaCapRemaining / qaRemainingNeeded) : 1;
    const minCapRatio = Math.min(devCapRatio, qaCapRatio);

    if (minCapRatio < 1) {
      // Se não há capacidade operacional restante suficiente, a chance é proporcional ao que falta
      successChance = baseChance * minCapRatio;
    } else {
      successChance = baseChance;
    }
  }

  successChance = Math.round(Math.min(100, Math.max(0, successChance)));

  // 7. Status Visual do Card
  let visualStatus = 'healthy'; // healthy, warning, danger, completed
  if (completed) {
    visualStatus = 'completed';
  } else {
    if (successChance >= 70) {
      visualStatus = 'healthy';
    } else if (successChance >= 50) {
      visualStatus = 'warning';
    } else {
      visualStatus = 'danger';
    }
  }

  return {
    devDailyCapacity,
    qaDailyCapacity,
    totalDailyCapacity,
    totalWorkingDays,
    elapsedWorkingDays,
    remainingWorkingDays,
    expectedProgress,
    devProgressReal,
    qaProgressReal,
    overallProgressReal,
    devRemainingNeeded,
    qaRemainingNeeded,
    totalRemainingNeeded,
    bottleneckRemainingDays,
    projectedCompletionDate,
    successChance,
    visualStatus
  };
}
