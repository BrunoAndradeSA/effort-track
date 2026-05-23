/**
 * Inicialização e gerenciamento do tema (Claro/Escuro).
 */
export function initTheme() {
  const toggleBtn = document.getElementById("theme-toggle");
  if (!toggleBtn) return;

  const metaColorScheme = document.querySelector('meta[name="color-scheme"]');

  const getPreferredTheme = () => {
    const saved = localStorage.getItem("color-scheme");
    if (saved) return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  };

  const applyTheme = (theme) => {
    document.documentElement.setAttribute("data-theme", theme);
    if (metaColorScheme) {
      metaColorScheme.content = theme === "dark" ? "dark" : "light";
    }
    localStorage.setItem("color-scheme", theme);
    updateToggleIcon(theme);
  };

  const updateToggleIcon = (theme) => {
    if (theme === "dark") {
      // Ícone do Sol para mudar para Claro
      toggleBtn.innerHTML = `
        <svg class="theme-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="4"></circle>
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path>
        </svg>
        <span>Modo Claro</span>
      `;
      toggleBtn.setAttribute("aria-label", "Mudar para modo claro");
    } else {
      // Ícone da Lua para mudar para Escuro
      toggleBtn.innerHTML = `
        <svg class="theme-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
        </svg>
        <span>Modo Escuro</span>
      `;
      toggleBtn.setAttribute("aria-label", "Mudar para modo escuro");
    }
  };

  // Escutar eventos de clique
  toggleBtn.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") || getPreferredTheme();
    const nextTheme = current === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
  });

  // Escutar mudanças no sistema operacional
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
    if (!localStorage.getItem("color-scheme")) {
      applyTheme(e.matches ? "dark" : "light");
    }
  });

  // Aplicar tema inicial
  applyTheme(getPreferredTheme());
}
