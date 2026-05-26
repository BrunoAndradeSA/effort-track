import { getProjects, addProject, updateProject, deleteProject } from '../services/projectStorage.js';
import { calculateProjectMetrics } from '../services/projectCalculations.js';
import { maskTimeInput, parseTimeToMinutes, formatMinutesToTime } from '../utils/timeUtils.js';
import { getSettings } from '../services/settingsStorage.js';

let _renderProjects = null;

export function refreshProjectList() {
  if (_renderProjects) _renderProjects();
}

export function initProjectTrackingUi() {
  const newProjectBtn = document.getElementById('new-project-btn');
  const projectModal = document.getElementById('project-modal');
  const projectForm = document.getElementById('project-form');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalCancelBtn = document.getElementById('modal-cancel-btn');
  const projectGrid = document.getElementById('project-list-grid');
  const filterBtns = document.querySelectorAll('.filter-btn');

  // Input fields cache
  const titleInput = document.getElementById('proj-title');
  const startDateInput = document.getElementById('proj-start-date');
  const endDateInput = document.getElementById('proj-end-date');
  const completedInput = document.getElementById('proj-completed');
  const completedGroup = document.getElementById('proj-completed-group');
  const qtyDevsInput = document.getElementById('proj-qty-devs');
  const hoursPerDevInput = document.getElementById('proj-hours-per-dev');
  const estimatedDevInput = document.getElementById('proj-estimated-dev-hours');
  const qtyQasInput = document.getElementById('proj-qty-qas');
  const hoursPerQaInput = document.getElementById('proj-hours-per-qa');
  const estimatedQaInput = document.getElementById('proj-estimated-qa-hours');
  const realizedFieldsGroup = document.getElementById('proj-realized-fields-group');
  const realizedDevInput = document.getElementById('proj-realized-dev-hours');
  const realizedQaInput = document.getElementById('proj-realized-qa-hours');

  let currentFilter = 'all';
  let editingProjectTitle = null; // null para criação, string para edição

  // Aplicar máscaras de horário nos inputs de texto de horas/dia no modal
  maskTimeInput(hoursPerDevInput);
  maskTimeInput(hoursPerQaInput);

  // Renderizar projetos
  function renderProjects() {
    projectGrid.innerHTML = '';
    const projects = getProjects();

    if (projects.length === 0) {
      projectGrid.innerHTML = `
        <div class="test-summary-box" style="grid-column: 1 / -1; text-align: center; padding: 3rem; background: var(--accent-light); color: var(--accent);">
          <p style="font-weight: 700; font-size: 1.1rem;">Nenhum projeto cadastrado.</p>
        </div>
      `;
      return;
    }

    // Calcular métricas para todos os projetos
    const projectsWithMetrics = projects.map(project => ({
      project,
      metrics: calculateProjectMetrics(project)
    }));

    // Filtrar projetos
    const filteredProjects = projectsWithMetrics.filter(item => {
      if (currentFilter === 'all') return true;
      if (currentFilter === 'completed') return item.project.completed;
      if (currentFilter === 'ongoing') return !item.project.completed;
      if (currentFilter === 'at-risk') return !item.project.completed && item.metrics.visualStatus === 'danger';
      return true;
    });

    if (filteredProjects.length === 0) {
      projectGrid.innerHTML = `
        <div class="test-summary-box" style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
          Nenhum projeto corresponde ao filtro selecionado.
        </div>
      `;
      return;
    }

    // Ordenar projetos:
    // 1. Projetos não concluídos primeiro, concluídos por último.
    // 2. Projetos com maior progresso real primeiro (mais próximos da conclusão).
    // 3. Data de conclusão prevista mais recente primeiro (decrescente).
    filteredProjects.sort((a, b) => {
      if (a.project.completed !== b.project.completed) {
        return a.project.completed ? 1 : -1;
      }
      if (b.metrics.overallProgressReal !== a.metrics.overallProgressReal) {
        return b.metrics.overallProgressReal - a.metrics.overallProgressReal;
      }
      return new Date(b.metrics.projectedCompletionDate) - new Date(a.metrics.projectedCompletionDate);
    });

    // Renderizar cards
    filteredProjects.forEach(({ project, metrics }) => {
      const card = document.createElement('div');
      
      let statusClass = 'card-healthy';
      let statusText = 'Saudável';
      let statusBadgeClass = 'healthy';

      if (project.completed) {
        statusClass = 'card-completed';
        statusText = 'Concluído';
        statusBadgeClass = 'completed';
      } else if (metrics.visualStatus === 'warning') {
        statusClass = 'card-warning';
        statusText = 'Atenção';
        statusBadgeClass = 'warning';
      } else if (metrics.visualStatus === 'danger') {
        statusClass = 'card-danger';
        statusText = 'Risco';
        statusBadgeClass = 'danger';
      }

      // Formatar datas para exibição brasileira DD/MM/AAAA
      const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      };

      card.className = `project-card ${statusClass}`;
      card.innerHTML = `
        <!-- Cabeçalho do Card -->
        <div class="project-card-header">
          <div class="project-card-title-area">
            <h4 class="project-card-title">${project.title}</h4>
            <span class="project-card-dates">
              ${formatDate(project.startDate)} a ${formatDate(project.endDate)}
            </span>
          </div>
          <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.5rem;">
            <span class="status-badge ${statusBadgeClass}">${statusText}</span>
            <div class="project-card-actions">
              <button class="project-card-btn btn-edit-proj" title="Editar Projeto" aria-label="Editar projeto ${project.title}">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
              <button class="project-card-btn btn-delete-proj" title="Excluir Projeto" aria-label="Excluir projeto ${project.title}">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Barras de Progresso -->
        <div class="project-progress-section">
          <div>
            <div class="progress-row-header">
              <span class="progress-label-real">Progresso Real</span>
              <span style="font-weight: 700;">${Math.round(metrics.overallProgressReal)}%</span>
            </div>
            <div class="progress-bar-thin">
              <div class="progress-fill-thin" style="width: ${metrics.overallProgressReal}%; background-color: var(--${metrics.visualStatus === 'healthy' || metrics.visualStatus === 'completed' ? 'success' : metrics.visualStatus === 'warning' ? 'warning' : 'danger'});"></div>
            </div>
          </div>
          <div>
            <div class="progress-row-header">
              <span class="progress-label-expected">Progresso Esperado</span>
              <span>${Math.round(metrics.expectedProgress)}%</span>
            </div>
            <div class="progress-bar-thin">
              <div class="progress-fill-thin progress-fill-expected" style="width: ${metrics.expectedProgress}%;"></div>
            </div>
          </div>
        </div>

        <!-- Grid de Informações -->
        <div class="project-info-grid">
          <div class="info-item">
            <span class="info-item-label">Restantes</span>
            <span class="info-item-value">${metrics.remainingWorkingDays} d úteis</span>
          </div>
          <div class="info-item" title="Capacidade diária combinada de toda a equipe">
            <span class="info-item-label">Capac. Diária</span>
            <span class="info-item-value">${metrics.totalDailyCapacity}h/dia</span>
          </div>
          <div class="info-item" style="grid-column: span 2;">
            <span class="info-item-label">Previsão de Entrega</span>
            <span class="info-item-value" style="font-size: 0.85rem; color: var(--${metrics.visualStatus === 'healthy' || metrics.visualStatus === 'completed' ? 'success' : metrics.visualStatus === 'warning' ? 'warning' : 'danger'});">
              ${formatDate(metrics.projectedCompletionDate)}
            </span>
          </div>
          <div class="info-item" style="grid-column: span 2; border-top: 1px solid var(--border-color); padding-top: 0.4rem; display: flex; flex-direction: row; justify-content: space-between; align-items: center;">
            <span class="info-item-label" style="margin: 0;">Chance de Sucesso</span>
            <span class="info-item-value" style="font-size: 1rem; color: var(--${metrics.visualStatus === 'healthy' || metrics.visualStatus === 'completed' ? 'success' : metrics.visualStatus === 'warning' ? 'warning' : 'danger'});">
              ${metrics.successChance}%
            </span>
          </div>
        </div>

        <!-- Área de Atualização Diária Inline e Checkbox Concluído -->
        <div class="project-daily-updater">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span class="updater-title">Atualização Diária</span>
            <label style="display: flex; align-items: center; gap: 0.35rem; font-size: 0.75rem; font-weight: 700; cursor: pointer; user-select: none; color: var(--text-primary);">
              <input type="checkbox" class="card-completed-toggle" ${project.completed ? 'checked' : ''}>
              Concluído
            </label>
          </div>
          <div class="updater-inputs">
            <div class="updater-input-group">
              <label>Horas DEV Realiz.</label>
              <input type="number" class="updater-input-field dev-realized-input" min="0" value="${project.hoursDevRealized}" ${project.completed ? 'disabled' : ''}>
            </div>
            <div class="updater-input-group">
              <label>Horas QA Realiz.</label>
              <input type="number" class="updater-input-field qa-realized-input" min="0" value="${project.hoursQaRealized}" ${project.completed ? 'disabled' : ''}>
            </div>
          </div>
          <button class="btn-run-tests btn-save-update" style="margin-top: 0.75rem; width: 100%; justify-content: center;">Salvar</button>
        </div>
      `;

      // Evento de edição
      card.querySelector('.btn-edit-proj').addEventListener('click', () => {
        openModal(project);
      });

      // Evento de exclusão
      card.querySelector('.btn-delete-proj').addEventListener('click', () => {
        showConfirmDialog(
          `Tem certeza que deseja excluir o projeto "${project.title}" permanentemente?`,
          () => {
            deleteProject(project.title);
            renderProjects();
          }
        );
      });

      // Botão Salvar: persiste horas DEV, horas QA e flag concluído
      const devInput = card.querySelector('.dev-realized-input');
      const qaInput = card.querySelector('.qa-realized-input');
      const completedToggle = card.querySelector('.card-completed-toggle');
      const saveBtn = card.querySelector('.btn-save-update');

      saveBtn.addEventListener('click', () => {
        const devVal = Math.max(0, parseInt(devInput.value, 10) || 0);
        const qaVal = Math.max(0, parseInt(qaInput.value, 10) || 0);
        const isChecked = completedToggle.checked;

        updateProject(project.title, {
          hoursDevRealized: devVal,
          hoursQaRealized: qaVal,
          completed: isChecked
        });

        devInput.disabled = isChecked;
        qaInput.disabled = isChecked;

        renderProjects();
      });

      projectGrid.appendChild(card);
    });
  }

  // Atualiza dinamicamente as informações visuais de um único card ao digitar
  function updateCardUi(cardEl, title) {
    const projects = getProjects();
    const project = projects.find(p => p.title.toLowerCase() === title.toLowerCase());
    if (!project) return;

    const metrics = calculateProjectMetrics(project);

    // 1. Atualizar classe do card
    let statusClass = 'card-healthy';
    let statusBadgeClass = 'healthy';
    let statusText = 'Saudável';

    if (project.completed) {
      statusClass = 'card-completed';
      statusBadgeClass = 'completed';
      statusText = 'Concluído';
    } else if (metrics.visualStatus === 'warning') {
      statusClass = 'card-warning';
      statusBadgeClass = 'warning';
      statusText = 'Atenção';
    } else if (metrics.visualStatus === 'danger') {
      statusClass = 'card-danger';
      statusBadgeClass = 'danger';
      statusText = 'Risco';
    }

    // Atualizar classes
    cardEl.className = `project-card ${statusClass}`;
    
    // Atualizar badge de status
    const badge = cardEl.querySelector('.status-badge');
    badge.className = `status-badge ${statusBadgeClass}`;
    badge.textContent = statusText;

    // 2. Atualizar barras de progresso
    const fillReal = cardEl.querySelector('.progress-bar-thin:first-of-type .progress-fill-thin');
    fillReal.style.width = `${metrics.overallProgressReal}%`;
    fillReal.style.backgroundColor = `var(--${metrics.visualStatus === 'healthy' || metrics.visualStatus === 'completed' ? 'success' : metrics.visualStatus === 'warning' ? 'warning' : 'danger'})`;
    cardEl.querySelector('.progress-bar-thin:first-of-type').previousElementSibling.querySelector('span:last-of-type').textContent = `${Math.round(metrics.overallProgressReal)}%`;

    const fillExpected = cardEl.querySelector('.progress-fill-expected');
    fillExpected.style.width = `${metrics.expectedProgress}%`;
    cardEl.querySelector('.progress-fill-expected').parentNode.previousElementSibling.querySelector('span:last-of-type').textContent = `${Math.round(metrics.expectedProgress)}%`;

    // 3. Atualizar campos de informação
    const infoGrid = cardEl.querySelector('.project-info-grid');
    const infoValues = infoGrid.querySelectorAll('.info-item-value');
    
    // Dias restantes
    infoValues[0].textContent = `${metrics.remainingWorkingDays} d úteis`;
    
    // Data de previsão
    infoValues[2].textContent = `${metrics.projectedCompletionDate.split('-')[2]}/${metrics.projectedCompletionDate.split('-')[1]}/${metrics.projectedCompletionDate.split('-')[0]}`;
    infoValues[2].style.color = `var(--${metrics.visualStatus === 'healthy' || metrics.visualStatus === 'completed' ? 'success' : metrics.visualStatus === 'warning' ? 'warning' : 'danger'})`;

    // Chance de sucesso
    infoValues[3].textContent = `${metrics.successChance}%`;
    infoValues[3].style.color = `var(--${metrics.visualStatus === 'healthy' || metrics.visualStatus === 'completed' ? 'success' : metrics.visualStatus === 'warning' ? 'warning' : 'danger'})`;
  }

  function showConfirmDialog(message, onConfirm) {
    const overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';
    overlay.innerHTML = `
      <div class="confirm-dialog">
        <p class="confirm-message">${message}</p>
        <div class="confirm-actions">
          <button class="confirm-cancel-btn">Cancelar</button>
          <button class="confirm-ok-btn">Excluir</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector('.confirm-cancel-btn').addEventListener('click', () => {
      overlay.remove();
    });

    overlay.querySelector('.confirm-ok-btn').addEventListener('click', () => {
      overlay.remove();
      onConfirm();
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });

    requestAnimationFrame(() => overlay.classList.add('active'));
  }

  // Abrir modal (Cadastro ou Edição)
  function openModal(project = null) {
    editingProjectTitle = project ? project.title : null;
    
    // Configurar título e campos do modal
    const modalTitle = document.getElementById('modal-title');
    const saveBtn = document.getElementById('modal-save-btn');
    
    if (project) {
      // MODO EDIÇÃO
      modalTitle.textContent = 'Editar Projeto';
      saveBtn.textContent = 'Salvar Alterações';
      
      titleInput.value = project.title;
      titleInput.disabled = true; // Identificador único bloqueado

      startDateInput.value = project.startDate;
      endDateInput.value = project.endDate;
      
      qtyDevsInput.value = project.qtyDevs;
      hoursPerDevInput.value = formatMinutesToTime(project.hoursPerDev * 60);
      estimatedDevInput.value = project.estimatedDevHours;
      
      qtyQasInput.value = project.qtyQas;
      hoursPerQaInput.value = formatMinutesToTime(project.hoursPerQa * 60);
      estimatedQaInput.value = project.estimatedQaHours;
      
      // Mostrar checkbox Concluído e inputs de horas realizadas no Modal
      completedGroup.style.display = 'block';
      completedInput.checked = project.completed;

      realizedFieldsGroup.style.display = 'block';
      realizedDevInput.value = project.hoursDevRealized;
      realizedQaInput.value = project.hoursQaRealized;
    } else {
      // MODO CADASTRO
      modalTitle.textContent = 'Novo Projeto';
      saveBtn.textContent = 'Criar Projeto';
      
      titleInput.value = '';
      titleInput.disabled = false;

      const settings = getSettings();
      const today = new Date();
      const end = new Date();
      end.setDate(today.getDate() + settings.defaultProjectDuration);
      
      const fmtDate = (d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      };

      startDateInput.value = fmtDate(today);
      endDateInput.value = fmtDate(end);
      
      qtyDevsInput.value = settings.defaultQtyDevs;
      hoursPerDevInput.value = settings.defaultHoursPerDay;
      estimatedDevInput.value = 180;
      
      qtyQasInput.value = settings.defaultQtyQas;
      hoursPerQaInput.value = settings.defaultHoursPerDay;
      estimatedQaInput.value = 40;
      
      // Ocultar checkbox Concluído e inputs de horas realizadas no cadastro inicial
      completedGroup.style.display = 'none';
      completedInput.checked = false;

      realizedFieldsGroup.style.display = 'none';
      realizedDevInput.value = 0;
      realizedQaInput.value = 0;
    }

    // Resetar estilos de erro nos inputs
    const inputs = projectForm.querySelectorAll('input');
    inputs.forEach(input => input.classList.remove('error-state-input'));

    projectModal.classList.add('active');
  }

  function closeModal() {
    projectModal.classList.remove('active');
    editingProjectTitle = null;
  }

  // Submissão do Formulário
  projectForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const title = titleInput.value.trim();
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;
    const completed = completedInput.checked;
    
    const qtyDevs = parseInt(qtyDevsInput.value, 10);
    const hoursPerDevRaw = hoursPerDevInput.value.trim();
    const estimatedDevHours = parseFloat(estimatedDevInput.value);
    
    const qtyQas = parseInt(qtyQasInput.value, 10);
    const hoursPerQaRaw = hoursPerQaInput.value.trim();
    const estimatedQaHours = parseFloat(estimatedQaInput.value);

    const hoursDevRealized = realizedFieldsGroup.style.display === 'none' ? 0 : (parseInt(realizedDevInput.value, 10) || 0);
    const hoursQaRealized = realizedFieldsGroup.style.display === 'none' ? 0 : (parseInt(realizedQaInput.value, 10) || 0);

    let hasError = false;

    // 1. Validar datas
    if (endDate < startDate) {
      alert('A data de término prevista não pode ser anterior à data de início.');
      endDateInput.classList.add('error-state-input');
      hasError = true;
    } else {
      endDateInput.classList.remove('error-state-input');
    }

    // 2. Converter horas DEV diárias
    let hoursPerDev = 0;
    try {
      const mins = parseTimeToMinutes(hoursPerDevRaw);
      hoursPerDev = mins / 60;
      hoursPerDevInput.classList.remove('error-state-input');
    } catch (_) {
      hoursPerDevInput.classList.add('error-state-input');
      hasError = true;
    }

    // 3. Converter horas QA diárias
    let hoursPerQa = 0;
    try {
      const mins = parseTimeToMinutes(hoursPerQaRaw);
      hoursPerQa = mins / 60;
      hoursPerQaInput.classList.remove('error-state-input');
    } catch (_) {
      hoursPerQaInput.classList.add('error-state-input');
      hasError = true;
    }

    // 4. Validar limites numéricos estritos (> 0)
    const checkPositive = (input, val) => {
      if (isNaN(val) || val <= 0) {
        input.classList.add('error-state-input');
        return true;
      }
      input.classList.remove('error-state-input');
      return false;
    };

    if (checkPositive(qtyDevsInput, qtyDevs)) hasError = true;
    if (checkPositive(estimatedDevInput, estimatedDevHours)) hasError = true;
    if (checkPositive(qtyQasInput, qtyQas)) hasError = true;
    if (checkPositive(estimatedQaInput, estimatedQaHours)) hasError = true;
    
    if (hoursPerDev <= 0) {
      hoursPerDevInput.classList.add('error-state-input');
      hasError = true;
    }
    if (hoursPerQa <= 0) {
      hoursPerQaInput.classList.add('error-state-input');
      hasError = true;
    }

    if (hasError) {
      alert('Por favor, corrija os valores em destaque. Todos os campos de esforço e equipe devem ser maiores que zero.');
      return;
    }

    // Objeto do projeto formatado
    const projectData = {
      title,
      startDate,
      endDate,
      completed,
      qtyDevs,
      hoursPerDev,
      estimatedDevHours,
      qtyQas,
      hoursPerQa,
      estimatedQaHours,
      hoursDevRealized,
      hoursQaRealized
    };

    try {
      if (editingProjectTitle) {
        updateProject(editingProjectTitle, projectData);
      } else {
        addProject(projectData);
      }
      
      closeModal();
      renderProjects();
    } catch (error) {
      alert(error.message);
      titleInput.classList.add('error-state-input');
    }
  });

  // Eventos de botões gerais
  newProjectBtn.addEventListener('click', () => openModal());
  modalCloseBtn.addEventListener('click', closeModal);
  modalCancelBtn.addEventListener('click', closeModal);

  // Fechar modal clicando fora da caixa
  projectModal.addEventListener('click', (e) => {
    if (e.target === projectModal) {
      closeModal();
    }
  });

  // Gerenciamento de filtros
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.getAttribute('data-filter');
      renderProjects();
    });
  });

  // Render inicial
  renderProjects();
  _renderProjects = renderProjects;
}
