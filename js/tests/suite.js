import { parseTimeToMinutes, formatMinutesToTime } from "../utils/timeUtils.js";
import { tokenize, TokenType } from "../parser/lexer.js";
import { Parser } from "../parser/parser.js";
import { calculateExpression } from "../parser/evaluator.js";
import { calculateEffort } from "../services/effortCalculator.js";

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
    }
  }
];
