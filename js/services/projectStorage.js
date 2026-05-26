/**
 * Serviço de persistência local para a funcionalidade de Acompanhamento de Projetos.
 * Armazena a lista de projetos no localStorage sob a chave 'effort_track_projects'.
 */

const STORAGE_KEY = 'effort_track_projects';

/**
 * Obtém todos os projetos salvos no localStorage.
 * 
 * @returns {Array} Lista de projetos decodificada.
 */
export function getProjects() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Erro ao ler projetos do localStorage:', error);
    return [];
  }
}

/**
 * Salva a lista completa de projetos no localStorage.
 * 
 * @param {Array} projects - Lista de projetos a salvar.
 */
export function saveProjects(projects) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (error) {
    console.error('Erro ao salvar projetos no localStorage:', error);
  }
}

/**
 * Adiciona um novo projeto. Lança um erro se o título já existir.
 * 
 * @param {object} project - Objeto de projeto completo.
 */
export function addProject(project) {
  const projects = getProjects();
  
  // O título é o identificador único
  const exists = projects.some(p => p.title.toLowerCase() === project.title.toLowerCase());
  if (exists) {
    throw new Error('Já existe um projeto com este título.');
  }

  projects.push(project);
  saveProjects(projects);
}

/**
 * Atualiza um projeto existente pelo título.
 * 
 * @param {string} title - Título do projeto a ser editado.
 * @param {object} updatedFields - Campos com valores atualizados.
 */
export function updateProject(title, updatedFields) {
  const projects = getProjects();
  const index = projects.findIndex(p => p.title.toLowerCase() === title.toLowerCase());

  if (index === -1) {
    throw new Error('Projeto não encontrado para atualização.');
  }

  // Mesclar campos existentes com campos atualizados (exceto o título)
  const updatedProject = { ...projects[index], ...updatedFields, title: projects[index].title };
  projects[index] = updatedProject;
  saveProjects(projects);
}

/**
 * Exclui um projeto pelo título.
 * 
 * @param {string} title - Título do projeto a ser excluído.
 */
export function deleteProject(title) {
  let projects = getProjects();
  projects = projects.filter(p => p.title.toLowerCase() !== title.toLowerCase());
  saveProjects(projects);
}
