import { calculateExpression } from "../parser/evaluator.js";
import { formatMinutesToTime } from "../utils/timeUtils.js";

/**
 * Inicializa a interface da Calculadora de Horas.
 */
export function initHoursUi() {
  const inputEl = document.getElementById("calc-input");
  const clearBtn = document.getElementById("calc-clear");
  const resultEl = document.getElementById("calc-result");
  const errorEl = document.getElementById("calc-error");

  if (!inputEl || !clearBtn || !resultEl || !errorEl) return;

  const handleInput = () => {
    const val = inputEl.value.trim();

    if (val === "") {
      errorEl.textContent = "";
      errorEl.classList.remove("active");
      resultEl.textContent = "00:00";
      resultEl.classList.remove("error-state");
      return;
    }

    try {
      const minutes = calculateExpression(val);
      const formatted = formatMinutesToTime(minutes);
      
      resultEl.textContent = formatted;
      resultEl.classList.remove("error-state");
      errorEl.textContent = "";
      errorEl.classList.remove("active");
    } catch (err) {
      // De acordo com a especificação, não atualiza o resultado enquanto houver erro.
      // E exibe a mensagem de erro exata: "Expressão inválida"
      errorEl.textContent = "Expressão inválida";
      errorEl.classList.add("active");
      resultEl.classList.add("error-state");
    }
  };

  inputEl.addEventListener("input", handleInput);

  clearBtn.addEventListener("click", () => {
    inputEl.value = "";
    resultEl.textContent = "00:00";
    resultEl.classList.remove("error-state");
    errorEl.textContent = "";
    errorEl.classList.remove("active");
    inputEl.focus();
  });

  // Permitir cliques em botões de exemplo para preenchimento rápido
  document.querySelectorAll(".calc-example-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      inputEl.value = btn.getAttribute("data-expr");
      handleInput();
      inputEl.focus();
    });
  });
}
