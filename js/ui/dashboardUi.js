import { getProjects } from '../services/projectStorage.js';
import { calculateProjectMetrics } from '../services/projectCalculations.js';
import { formatMinutesToTime } from '../utils/timeUtils.js';
import { openProjectForEditing } from './projectTrackingUi.js';

export function initDashboardUi() {
  renderDashboard();

  window.addEventListener('projects-changed', renderDashboard);
}

function getTodayStr() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function daysBetween(date1Str, date2Str) {
  const d1 = new Date(date1Str + 'T00:00:00');
  const d2 = new Date(date2Str + 'T00:00:00');
  return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
}

function renderDashboard() {
  const projects = getProjects();
  const todayStr = getTodayStr();

  updateSummaryCards(projects, todayStr);
  renderUpcomingProjects(projects, todayStr);
}

function updateSummaryCards(projects, todayStr) {
  const totalProjects = projects.length;

  let totalEstimatedHours = 0;
  let totalRealizedHours = 0;

  for (const p of projects) {
    totalEstimatedHours += (p.estimatedDevHours || 0) + (p.estimatedQaHours || 0);
    totalRealizedHours += (p.hoursDevRealized || 0) + (p.hoursQaRealized || 0);
  }

  const parallelProjects = countParallelProjects(projects);

  const { completedOnTime, overdueCount } = countCompletedAndOverdue(projects, todayStr);

  const pctCompleted = totalProjects > 0 ? Math.round((completedOnTime / totalProjects) * 100) : 0;
  const pctOverdue = totalProjects > 0 ? Math.round((overdueCount / totalProjects) * 100) : 0;
  const avgDelayDays = calculateAverageDelay(projects, todayStr);

  setCardValue('dash-total-projects', totalProjects);
  setCardValue('dash-total-estimated', formatMinutesToTime(totalEstimatedHours * 60));
  setCardValue('dash-total-realized', formatMinutesToTime(totalRealizedHours * 60));
  setCardValue('dash-parallel-projects', parallelProjects);
  setCardValue('dash-completed-pct', pctCompleted + '%');
  setCardValue('dash-overdue-pct', pctOverdue + '%');
  setCardValue('dash-avg-delay', avgDelayDays > 0 ? avgDelayDays + ' dias' : '0 dias');
}

function countParallelProjects(projects) {
  if (projects.length < 2) return 0;

  let parallelCount = 0;
  for (let i = 0; i < projects.length; i++) {
    const a = projects[i];
    if (!a.startDate || !a.endDate) continue;
    let hasOverlap = false;
    for (let j = 0; j < projects.length; j++) {
      if (i === j) continue;
      const b = projects[j];
      if (!b.startDate || !b.endDate) continue;
      if (a.startDate <= b.endDate && b.startDate <= a.endDate) {
        hasOverlap = true;
        break;
      }
    }
    if (hasOverlap) parallelCount++;
  }
  return parallelCount;
}

function countCompletedAndOverdue(projects, todayStr) {
  let completedOnTime = 0;
  let overdueCount = 0;

  for (const p of projects) {
    if (p.completed) {
      completedOnTime++;
    } else if (p.endDate && p.endDate < todayStr) {
      overdueCount++;
    }
  }

  return { completedOnTime, overdueCount };
}

function calculateAverageDelay(projects, todayStr) {
  let totalDelayDays = 0;
  let overdueCount = 0;

  for (const p of projects) {
    if (!p.completed && p.endDate && p.endDate < todayStr) {
      const delay = daysBetween(p.endDate, todayStr);
      totalDelayDays += delay;
      overdueCount++;
    }
  }

  return overdueCount > 0 ? Math.round(totalDelayDays / overdueCount) : 0;
}

function renderUpcomingProjects(projects, todayStr) {
  const container = document.getElementById('dash-upcoming-list');
  if (!container) return;

  const incomplete = projects
    .filter(p => !p.completed && p.endDate)
    .sort((a, b) => a.endDate.localeCompare(b.endDate));

  if (incomplete.length === 0) {
    container.innerHTML = '<div class="dash-empty-state">Nenhum projeto em andamento.</div>';
    return;
  }

  const rows = incomplete.map(p => {
    const metrics = calculateProjectMetrics(p);
    const remainingDays = daysBetween(todayStr, p.endDate);
    const daysLabel = remainingDays >= 0
      ? `${remainingDays} dia${remainingDays !== 1 ? 's' : ''}`
      : `${Math.abs(remainingDays)} dia${Math.abs(remainingDays) !== 1 ? 's' : ''} atrasado`;

    const chanceClass = metrics.successChance >= 70 ? 'chance-healthy'
      : metrics.successChance >= 50 ? 'chance-warning'
      : 'chance-danger';

    return `
      <div class="dash-upcoming-row" data-title="${escapeHtml(p.title)}">
        <span class="dash-upcoming-title">${escapeHtml(p.title)}</span>
        <span class="dash-upcoming-days ${remainingDays < 0 ? 'text-danger' : ''}">${daysLabel}</span>
        <span class="dash-upcoming-chance ${chanceClass}">${metrics.successChance}%</span>
      </div>
    `;
  }).join('');

  container.innerHTML = rows;

  // Delegation: abrir modal de edição ao clicar na linha
  container.querySelectorAll('.dash-upcoming-row').forEach(row => {
    row.addEventListener('click', () => {
      const title = row.getAttribute('data-title');
      if (title) openProjectForEditing(title);
    });
  });
}

function setCardValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
