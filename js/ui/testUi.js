import { testSuite } from "../tests/suite.js";

/**
 * Inicializa a aba de Testes Unitários Interativos.
 */
export function initTestUi() {
  const runBtn = document.getElementById("run-tests-btn");
  const container = document.getElementById("test-results-list");
  const summaryEl = document.getElementById("test-summary");

  if (!container || !summaryEl) return;

  const runAllTests = () => {
    container.innerHTML = "";
    summaryEl.className = "test-summary-box running";
    summaryEl.textContent = "Executando testes...";

    let passedCount = 0;
    let failedCount = 0;
    const startTotal = performance.now();

    testSuite.forEach((test, index) => {
      const start = performance.now();
      const testRow = document.createElement("div");
      testRow.className = "test-row animate-fade-in";
      testRow.style.animationDelay = `${index * 30}ms`;

      try {
        test.run();
        const duration = (performance.now() - start).toFixed(2);
        passedCount++;
        testRow.classList.add("pass");
        testRow.innerHTML = `
          <div class="test-row-main">
            <span class="test-badge pass">✔ PASS</span>
            <span class="test-cat">${test.category.toUpperCase()}</span>
            <span class="test-name">${test.name}</span>
            <span class="test-time">${duration}ms</span>
          </div>
        `;
      } catch (err) {
        const duration = (performance.now() - start).toFixed(2);
        failedCount++;
        testRow.classList.add("fail");
        testRow.innerHTML = `
          <div class="test-row-main">
            <span class="test-badge fail">✘ FAIL</span>
            <span class="test-cat">${test.category.toUpperCase()}</span>
            <span class="test-name">${test.name}</span>
            <span class="test-time">${duration}ms</span>
          </div>
          <pre class="test-error-log">${err.message}</pre>
        `;
      }
      container.appendChild(testRow);
    });

    const totalDuration = (performance.now() - startTotal).toFixed(2);

    if (failedCount === 0) {
      summaryEl.className = "test-summary-box pass";
      summaryEl.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <span><strong>Sucesso!</strong> Todos os ${passedCount} testes passaram em ${totalDuration}ms.</span>
      `;
    } else {
      summaryEl.className = "test-summary-box fail";
      summaryEl.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
        <span><strong>Falha:</strong> ${passedCount} passaram, ${failedCount} falharam. Tempo: ${totalDuration}ms.</span>
      `;
    }
  };

  if (runBtn) {
    runBtn.addEventListener("click", runAllTests);
  }

  // Executar automaticamente na carga do componente
  runAllTests();
}
