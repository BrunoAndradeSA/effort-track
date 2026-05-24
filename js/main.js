import { initTheme } from "./ui/theme.js";
import { initHoursUi } from "./ui/hoursUi.js";
import { initEffortUi } from "./ui/effortUi.js";
import { initDateDiffUi } from "./ui/dateDiffUi.js";
import { initTestUi } from "./ui/testUi.js";

document.addEventListener("DOMContentLoaded", () => {
  // 1. Inicializar Tema (Claro/Escuro)
  initTheme();

  // 2. Inicializar alternador de abas (Tabs)
  const tabButtons = document.querySelectorAll(".tab-btn");
  const appSections = document.querySelectorAll(".app-section");

  tabButtons.forEach(button => {
    button.addEventListener("click", () => {
      const targetId = button.getAttribute("data-target");

      // Remover classe active de todos os botões e abas
      tabButtons.forEach(btn => {
        btn.classList.remove("active");
        btn.setAttribute("aria-selected", "false");
      });
      appSections.forEach(sec => sec.classList.remove("active"));

      // Ativar a aba clicada e a respectiva seção
      button.classList.add("active");
      button.setAttribute("aria-selected", "true");
      
      const targetSec = document.getElementById(targetId);
      if (targetSec) {
        targetSec.classList.add("active");
      }
    });
  });

  // 3. Inicializar as UIs correspondentes
  initHoursUi();
  initEffortUi();
  initDateDiffUi();
  initTestUi();
});
