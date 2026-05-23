import { testSuite } from "./js/tests/suite.js";

console.log("\x1b[36m%s\x1b[0m", "==================================================");
console.log("\x1b[36m%s\x1b[0m", "   EFFORT TRACK - EXECUÇÃO DOS TESTES UNITÁRIOS   ");
console.log("\x1b[36m%s\x1b[0m", "==================================================");

let passed = 0;
let failed = 0;
const startTotal = performance.now();

for (const test of testSuite) {
  const start = performance.now();
  try {
    test.run();
    const duration = (performance.now() - start).toFixed(2);
    console.log(
      "\x1b[32m%s\x1b[0m %s \x1b[90m%s\x1b[0m",
      "✔ PASS",
      `[${test.category.padEnd(15)}] ${test.name}`,
      `(${duration}ms)`
    );
    passed++;
  } catch (err) {
    const duration = (performance.now() - start).toFixed(2);
    console.log(
      "\x1b[31m%s\x1b[0m %s \x1b[90m%s\x1b[0m",
      "✘ FAIL",
      `[${test.category.padEnd(15)}] ${test.name}`,
      `(${duration}ms)`
    );
    console.error(`\x1b[31m       Erro: ${err.message}\x1b[0m`);
    failed++;
  }
}

const totalDuration = (performance.now() - startTotal).toFixed(2);
console.log("\x1b[36m%s\x1b[0m", "==================================================");
console.log(
  `Resultado: \x1b[32m${passed} passaram\x1b[0m, \x1b[31m${failed} falharam\x1b[0m. Tempo total: ${totalDuration}ms`
);
console.log("\x1b[36m%s\x1b[0m", "==================================================");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
