import { parseTimeToMinutes, formatMinutesToTime, calculateWorkingDays, addWorkingDays } from "../utils/timeUtils.js";
import { tokenize, TokenType } from "../parser/lexer.js";
import { Parser } from "../parser/parser.js";
import { calculateExpression } from "../parser/evaluator.js";
import { calculateEffort } from "../services/effortCalculator.js";
import { calculateProjectMetrics } from "../services/projectCalculations.js";

// Helper de asserção simples
function assertEqual(actual, expected, message = "") {
  if (actual !== expected) {
    throw new Error(`${message || "Falha na asserção"}: esperava "${expected}", mas obteve "${actual}"`);
  }
}

function assertThrows(fn, messagePart = "", message = "") {
  try {
    fn();
  } catch (err) {
    if (messagePart && !err.message.toLowerCase().includes(messagePart.toLowerCase())) {
      throw new Error(`${message || "Tipo de erro incorreto"}: esperava mensagem contendo "${messagePart}", mas obteve "${err.message}"`);
    }
    return; // Passa no teste
  }
  throw new Error(`${message || "Falha na asserção"}: esperava que a função lançasse um erro, mas ela executou com sucesso.`);
}

export const testSuite = [
  // --- CONVERSÃO DE HORAS ---
  {
    name: "Deve converter formato HH:mm para minutos corretamente",
    category: "conversao",
    run() {
      assertEqual(parseTimeToMinutes("7:45"), 465);
      assertEqual(parseTimeToMinutes("01:30"), 90);
      assertEqual(parseTimeToMinutes("00:00"), 0);
      assertEqual(parseTimeToMinutes("125:15"), 7515);
    }
  },
  {
    name: "Deve converter formato com sufixo 'h' para minutos",
    category: "conversao",
    run() {
      assertEqual(parseTimeToMinutes("30h"), 1800);
      assertEqual(parseTimeToMinutes("1.5h"), 90);
      assertEqual(parseTimeToMinutes("125h"), 7500);
      assertEqual(parseTimeToMinutes("0h"), 0);
    }
  },
  {
    name: "Deve converter formato com sufixo 'm' para minutos",
    category: "conversao",
    run() {
      assertEqual(parseTimeToMinutes("45m"), 45);
      assertEqual(parseTimeToMinutes("30m"), 30);
      assertEqual(parseTimeToMinutes("120m"), 120);
    }
  },
  {
    name: "Deve lançar erro para formatos de hora inválidos",
    category: "conversao",
    run() {
      assertThrows(() => parseTimeToMinutes("2:60"), "menores que 60");
      assertThrows(() => parseTimeToMinutes("7:65"), "menores que 60");
      assertThrows(() => parseTimeToMinutes("abc"), "inválido");
      assertThrows(() => parseTimeToMinutes("1.5.3h"), "inválido");
    }
  },
  {
    name: "Deve formatar minutos de volta para HH:mm",
    category: "conversao",
    run() {
      assertEqual(formatMinutesToTime(465), "07:45");
      assertEqual(formatMinutesToTime(1800), "30:00");
      assertEqual(formatMinutesToTime(-150), "-02:30");
      assertEqual(formatMinutesToTime(300), "05:00");
      assertEqual(formatMinutesToTime(0), "00:00");
    }
  },
  {
    name: "Deve retornar 00:00 para NaN ou Infinity em formatMinutesToTime",
    category: "conversao",
    run() {
      assertEqual(formatMinutesToTime(NaN), "00:00");
      assertEqual(formatMinutesToTime(Infinity), "00:00");
      assertEqual(formatMinutesToTime(-Infinity), "00:00");
    }
  },
  {
    name: "Deve converter horas decimais corretamente",
    category: "conversao",
    run() {
      assertEqual(parseTimeToMinutes("0.5h"), 30);
      assertEqual(parseTimeToMinutes("2.25h"), 135);
      assertEqual(parseTimeToMinutes("0.1h"), 6);
    }
  },

  // --- TOKENIZER (LEXER) ---
  {
    name: "Deve tokenizar expressões válidas corretamente",
    category: "tokenizer",
    run() {
      const tokens = tokenize("7:45 * 5");
      assertEqual(tokens.length, 4); // TIME, MUL, NUMBER, EOF
      assertEqual(tokens[0].type, TokenType.TIME);
      assertEqual(tokens[0].value, 465);
      assertEqual(tokens[1].type, TokenType.MUL);
      assertEqual(tokens[2].type, TokenType.NUMBER);
      assertEqual(tokens[2].value, 5);
      assertEqual(tokens[3].type, TokenType.EOF);
    }
  },
  {
    name: "Deve normalizar operador de multiplicação 'x' ou 'X' para '*'",
    category: "tokenizer",
    run() {
      const tokens1 = tokenize("2h x 3");
      assertEqual(tokens1[1].type, TokenType.MUL);
      assertEqual(tokens1[1].value, "*");

      const tokens2 = tokenize("2h X 3");
      assertEqual(tokens2[1].type, TokenType.MUL);
      assertEqual(tokens2[1].value, "*");
    }
  },
  {
    name: "Deve lançar erro ao tokenizar caracteres não reconhecidos",
    category: "tokenizer",
    run() {
      assertThrows(() => tokenize("7:45 @ 5"), "Caractere inesperado");
      assertThrows(() => tokenize("2h & 3m"), "Caractere inesperado");
    }
  },
  {
    name: "Deve lançar erro ao tokenizar string vazia",
    category: "tokenizer",
    run() {
      assertThrows(() => calculateExpression(""), "vazia");
      assertThrows(() => calculateExpression("   "), "vazia");
    }
  },

  // --- PARSER ---
  {
    name: "Deve falhar ao parsear expressões incompletas",
    category: "parser",
    run() {
      assertThrows(() => {
        const tokens = tokenize("7:45 +");
        new Parser(tokens).parse();
      }, "incompleta");
    }
  },
  {
    name: "Deve falhar ao parsear parênteses desbalanceados",
    category: "parser",
    run() {
      // Aberto mas nunca fechador
      assertThrows(() => {
        const tokens = tokenize("(2h + 30m");
        new Parser(tokens).parse();
      }, "RPAREN");

      // Fechador sem abrir
      assertThrows(() => {
        const tokens = tokenize("2h + 30m)");
        new Parser(tokens).parse();
      }, "parênteses desbalanceados");
    }
  },
  {
    name: "Deve falhar ao encontrar múltiplos operadores inválidos em sequência",
    category: "parser",
    run() {
      assertThrows(() => {
        const tokens = tokenize("2h + * 3");
        new Parser(tokens).parse();
      }, "inesperado");
    }
  },

  // --- CÁLCULOS MATEMÁTICOS ---
  {
    name: "Deve respeitar a precedência dos operadores (*, / antes de +, -)",
    category: "calculos",
    run() {
      // 120 + 30 * 2 = 120 + 60 = 180 (3 horas)
      assertEqual(calculateExpression("2h + 30m * 2"), 180);
      
      // (120 + 30) * 2 = 150 * 2 = 300 (5 horas)
      assertEqual(calculateExpression("(2h + 30m) * 2"), 300);
    }
  },
  {
    name: "Deve calcular operações básicas corretamente",
    category: "calculos",
    run() {
      assertEqual(calculateExpression("7:45 * 5"), 2325); // 38:45
      assertEqual(calculateExpression("8h + 2:30"), 630);  // 10:30
      assertEqual(calculateExpression("12h - 1:30"), 630); // 10:30
      assertEqual(calculateExpression("10h / 2"), 300);    // 05:00
      assertEqual(calculateExpression("7:45 X 5"), 2325); // 38:45
    }
  },
  {
    name: "Deve suportar operador unário negativo",
    category: "calculos",
    run() {
      assertEqual(calculateExpression("-2h + 3h"), 60); // -120 + 180 = 60
      assertEqual(calculateExpression("5h - -2h"), 420); // 300 - (-120) = 420
    }
  },
  {
    name: "Deve calcular expressões com resultado negativo",
    category: "calculos",
    run() {
      assertEqual(calculateExpression("2h - 5h"), -180);
    }
  },
  {
    name: "Deve calcular expressões com horas decimais",
    category: "calculos",
    run() {
      assertEqual(calculateExpression("1.5h + 0.5h"), 120);
      assertEqual(calculateExpression("1.5h * 2"), 180);
    }
  },

  // --- VALIDAÇÕES DE ERRO ---
  {
    name: "Deve falhar ao tentar dividir por zero",
    category: "validacoes_erro",
    run() {
      assertThrows(() => calculateExpression("10h / 0"), "Divisão por zero");
      assertThrows(() => calculateExpression("8h / (2 - 2)"), "Divisão por zero");
    }
  },

  // --- CÁLCULO DE ESFORÇO ---
  {
    name: "Deve calcular a viabilidade e folga do projeto corretamente",
    category: "esforco",
    run() {
      // 10 dias úteis (de segunda-feira 2026-06-01 a sexta-feira 2026-06-12)
      // DEV: 3 pessoas * 8 horas = 24 horas/dia * 10 dias = 240 horas de capacidade. Estimativa = 180h. Folga = 60h = 2d e 12h (capacidade diária da equipe = 24h).
      // QA: 1 pessoa * 6 horas = 6 horas/dia * 10 dias = 60 horas de capacidade. Estimativa = 40h. Folga = 20h = 3d e 2h (capacidade diária da equipe = 6h).
      const res = calculateEffort({
        startDate: "2026-06-01",
        endDate: "2026-06-12",
        qtyDevs: 3,
        hoursPerDev: 8,
        qtyQas: 1,
        hoursPerQa: 6,
        estimatedDevHours: 180,
        estimatedQaHours: 40
      });

      assertEqual(res.workingDays, 10);
      assertEqual(res.devCapacity, 240);
      assertEqual(res.qaCapacity, 60);
      assertEqual(res.devCanComplete, true);
      assertEqual(res.qaCanComplete, true);
      assertEqual(res.projectCanComplete, true);
      
      assertEqual(res.devSlackDelay.days, 2);
      assertEqual(res.devSlackDelay.hours, 12);

      assertEqual(res.qaSlackDelay.days, 3);
      assertEqual(res.qaSlackDelay.hours, 2);

      // completionDate: 8 dias úteis de 2026-06-01 (bottleneck DEV 7.5 → ceil 8)
      assertEqual(res.completionDate, "2026-06-11");
    }
  },
  {
    name: "Deve detectar projeto inviável quando capacidade < estimativa",
    category: "esforco",
    run() {
      const res = calculateEffort({
        startDate: "2026-06-01",
        endDate: "2026-06-05",
        qtyDevs: 1,
        hoursPerDev: 4,
        qtyQas: 1,
        hoursPerQa: 4,
        estimatedDevHours: 40,
        estimatedQaHours: 20
      });
      assertEqual(res.workingDays, 5);
      assertEqual(res.devCapacity, 20);
      assertEqual(res.qaCapacity, 20);
      assertEqual(res.devCanComplete, false);
      assertEqual(res.projectCanComplete, false);
      assertEqual(res.viability < 100, true);
    }
  },
  {
    name: "Deve identificar gargalo QA quando QA é o limitante",
    category: "esforco",
    run() {
      const res = calculateEffort({
        startDate: "2026-06-01",
        endDate: "2026-06-12",
        qtyDevs: 3,
        hoursPerDev: 8,
        qtyQas: 1,
        hoursPerQa: 4,
        estimatedDevHours: 100,
        estimatedQaHours: 60
      });
      // DEV: 3*8=24h/dia * 10 = 240h → folga de 140h
      // QA: 1*4=4h/dia * 10 = 40h → déficit de 20h
      assertEqual(res.devCanComplete, true);
      assertEqual(res.qaCanComplete, false);
      assertEqual(res.projectCanComplete, false);
    }
  },
  {
    name: "Deve lidar com equipe e esforço zerados",
    category: "esforco",
    run() {
      const res = calculateEffort({
        startDate: "2026-06-01",
        endDate: "2026-06-05",
        qtyDevs: 0,
        hoursPerDev: 0,
        qtyQas: 0,
        hoursPerQa: 0,
        estimatedDevHours: 0,
        estimatedQaHours: 0
      });
      assertEqual(res.workingDays, 5);
      assertEqual(res.viability, 0);
      assertEqual(res.projectCanComplete, true); // sem esforço, sempre viável
    }
  },

  // --- DIAS ÚTEIS ---
  {
    name: "Deve calcular dias úteis entre datas (seg-sex)",
    category: "dias_uteis",
    run() {
      assertEqual(calculateWorkingDays("2026-06-01", "2026-06-05"), 5);
    }
  },
  {
    name: "Deve incluir a data inicial e final no cálculo",
    category: "dias_uteis",
    run() {
      // Seg a Seg inclusive: Seg, Ter, Qua, Qui, Sex, Seg = 6
      assertEqual(calculateWorkingDays("2026-06-01", "2026-06-08"), 6);
    }
  },
  {
    name: "Deve retornar 1 quando data inicial igual à final em dia útil",
    category: "dias_uteis",
    run() {
      assertEqual(calculateWorkingDays("2026-06-01", "2026-06-01"), 1);
    }
  },
  {
    name: "Deve retornar 0 quando data inicial igual à final em fim de semana",
    category: "dias_uteis",
    run() {
      assertEqual(calculateWorkingDays("2026-06-06", "2026-06-06"), 0);
    }
  },
  {
    name: "Deve retornar 0 quando data inicial maior que a final",
    category: "dias_uteis",
    run() {
      assertEqual(calculateWorkingDays("2026-06-10", "2026-06-05"), 0);
    }
  },

  // --- ADD WORKING DAYS ---
  {
    name: "Deve avançar dias úteis sem pular semana",
    category: "add_working_days",
    run() {
      assertEqual(addWorkingDays("2026-06-01", 3), "2026-06-04");
    }
  },
  {
    name: "Deve pular finais de semana ao avançar",
    category: "add_working_days",
    run() {
      // Sexta + 1 dia útil = Segunda
      assertEqual(addWorkingDays("2026-06-05", 1), "2026-06-08");
    }
  },
  {
    name: "Deve avançar múltiplas semanas corretamente",
    category: "add_working_days",
    run() {
      // Segunda + 10 dias úteis = Segunda + 2 semanas = próxima Segunda + 10 dias corridos
      assertEqual(addWorkingDays("2026-06-01", 10), "2026-06-15");
    }
  },
  {
    name: "Deve retornar a mesma data quando dias for 0",
    category: "add_working_days",
    run() {
      assertEqual(addWorkingDays("2026-06-01", 0), "2026-06-01");
    }
  },
  {
    name: "Deve retornar a mesma data quando dias for negativo",
    category: "add_working_days",
    run() {
      assertEqual(addWorkingDays("2026-06-01", -5), "2026-06-01");
    }
  },
  
  // --- ACOMPANHAMENTO DE PROJETOS ---
  {
    name: "Deve calcular métricas básicas de um projeto novo sem progresso",
    category: "acompanhamento_projetos",
    run() {
      const project = {
        title: "Projeto A",
        startDate: "2026-06-01", // Segunda
        endDate: "2026-06-05",   // Sexta (5 dias úteis)
        completed: false,
        qtyDevs: 2,
        hoursPerDev: 8,
        qtyQas: 1,
        hoursPerQa: 6,
        estimatedDevHours: 80,
        estimatedQaHours: 30,
        hoursDevRealized: 0,
        hoursQaRealized: 0
      };
      
      const metrics = calculateProjectMetrics(project, "2026-06-01");
      assertEqual(metrics.totalWorkingDays, 5);
      assertEqual(metrics.elapsedWorkingDays, 1); // No primeiro dia
      assertEqual(metrics.remainingWorkingDays, 4);
      assertEqual(metrics.devDailyCapacity, 16);
      assertEqual(metrics.qaDailyCapacity, 6);
      assertEqual(metrics.overallProgressReal, 0);
      assertEqual(metrics.visualStatus, "healthy");
    }
  },
  {
    name: "Deve calcular métricas corretas para projeto concluído",
    category: "acompanhamento_projetos",
    run() {
      const project = {
        title: "Projeto B",
        startDate: "2026-06-01",
        endDate: "2026-06-05",
        completed: true,
        qtyDevs: 2,
        hoursPerDev: 8,
        qtyQas: 1,
        hoursPerQa: 6,
        estimatedDevHours: 80,
        estimatedQaHours: 30,
        hoursDevRealized: 80,
        hoursQaRealized: 30
      };
      
      const metrics = calculateProjectMetrics(project, "2026-06-05");
      assertEqual(metrics.overallProgressReal, 100);
      assertEqual(metrics.successChance, 100);
      assertEqual(metrics.visualStatus, "completed");
    }
  },
  {
    name: "Deve penalizar chance de sucesso para projeto atrasado e sem capacidade",
    category: "acompanhamento_projetos",
    run() {
      const project = {
        title: "Projeto C",
        startDate: "2026-06-01",
        endDate: "2026-06-05", // 5 dias úteis
        completed: false,
        qtyDevs: 1,
        hoursPerDev: 8, // 8h por dia total
        qtyQas: 1,
        hoursPerQa: 4, // 4h por dia total
        estimatedDevHours: 40,
        estimatedQaHours: 20,
        hoursDevRealized: 8, // Deveria ser 32 (dia 4)
        hoursQaRealized: 4  // Deveria ser 16
      };
      
      // Estamos no dia 4/5 (quinta-feira)
      const metrics = calculateProjectMetrics(project, "2026-06-04");
      // Falta 1 dia útil (sexta-feira).
      // Horas DEV restantes: 32h. QA restantes: 16h.
      // Capacidade DEV restante: 1 dia * 8h = 8h. Capacidade QA restante: 1 dia * 4h = 4h.
      // minCapRatio = min(8/32, 4/16) = 0.25.
      assertEqual(metrics.remainingWorkingDays, 1);
      assertEqual(metrics.successChance < 30, true); // Muito abaixo da capacidade física
      assertEqual(metrics.visualStatus, "danger");
    }
  },
  {
    name: "Deve retornar progresso real zero para projeto antes da data de início",
    category: "acompanhamento_projetos",
    run() {
      const project = {
        title: "Projeto D",
        startDate: "2026-06-08",
        endDate: "2026-06-12",
        completed: false,
        qtyDevs: 2,
        hoursPerDev: 8,
        qtyQas: 1,
        hoursPerQa: 6,
        estimatedDevHours: 80,
        estimatedQaHours: 30,
        hoursDevRealized: 0,
        hoursQaRealized: 0
      };
      // Hoje é anterior ao início do projeto
      const metrics = calculateProjectMetrics(project, "2026-06-01");
      assertEqual(metrics.elapsedWorkingDays, 0);
      assertEqual(metrics.overallProgressReal, 0);
      assertEqual(metrics.projectedCompletionDate, "2026-06-15");
    }
  },
  {
    name: "Deve zerar chance de sucesso quando prazo expirou sem conclusão",
    category: "acompanhamento_projetos",
    run() {
      const project = {
        title: "Projeto E",
        startDate: "2026-06-01",
        endDate: "2026-06-05",
        completed: false,
        qtyDevs: 2,
        hoursPerDev: 8,
        qtyQas: 1,
        hoursPerQa: 6,
        estimatedDevHours: 80,
        estimatedQaHours: 30,
        hoursDevRealized: 40,
        hoursQaRealized: 15
      };
      // Hoje é muito depois do prazo final e projeto não foi concluído
      const metrics = calculateProjectMetrics(project, "2026-06-20");
      assertEqual(metrics.successChance, 0);
      assertEqual(metrics.visualStatus, "danger");
    }
  },
  {
    name: "Deve retornar chance 100 quando horas realizadas superam estimadas",
    category: "acompanhamento_projetos",
    run() {
      const project = {
        title: "Projeto F",
        startDate: "2026-06-01",
        endDate: "2026-06-05",
        completed: false,
        qtyDevs: 2,
        hoursPerDev: 8,
        qtyQas: 1,
        hoursPerQa: 6,
        estimatedDevHours: 80,
        estimatedQaHours: 30,
        hoursDevRealized: 85,
        hoursQaRealized: 35
      };
      const metrics = calculateProjectMetrics(project, "2026-06-03");
      assertEqual(metrics.successChance, 100);
    }
  },
  {
    name: "Deve calcular métricas para projeto com apenas DEV (sem QA)",
    category: "acompanhamento_projetos",
    run() {
      const project = {
        title: "Projeto G",
        startDate: "2026-06-01",
        endDate: "2026-06-05",
        completed: false,
        qtyDevs: 3,
        hoursPerDev: 8,
        qtyQas: 0,
        hoursPerQa: 0,
        estimatedDevHours: 100,
        estimatedQaHours: 0,
        hoursDevRealized: 50,
        hoursQaRealized: 0
      };
      const metrics = calculateProjectMetrics(project, "2026-06-03");
      assertEqual(metrics.totalDailyCapacity, 24);
      assertEqual(metrics.qaDailyCapacity, 0);
      assertEqual(metrics.bottleneckRemainingDays, 3); // 50h restantes / 24h dia = 2.08 → ceil 3
      assertEqual(metrics.overallProgressReal, 50);
      assertEqual(metrics.visualStatus, "warning");
    }
  }
];

