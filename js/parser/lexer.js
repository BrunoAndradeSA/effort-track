import { parseTimeToMinutes } from "../utils/timeUtils.js";

export const TokenType = {
  NUMBER: "NUMBER",
  TIME: "TIME",
  PLUS: "PLUS",
  MINUS: "MINUS",
  MUL: "MUL",
  DIV: "DIV",
  LPAREN: "LPAREN",
  RPAREN: "RPAREN",
  EOF: "EOF"
};

export class Token {
  constructor(type, value, raw, position) {
    this.type = type;
    this.value = value;
    this.raw = raw;
    this.position = position;
  }
}

/**
 * Converte a expressão de entrada em uma lista de tokens.
 * Lança um erro detalhado caso encontre caracteres inesperados ou formatos inválidos.
 * 
 * @param {string} input - Expressão matemática
 * @returns {Token[]} Lista de tokens terminando com EOF
 */
export function tokenize(input) {
  const tokens = [];
  let i = 0;

  while (i < input.length) {
    const char = input[i];
    const startPos = i;

    // Pular espaços em branco
    if (/\s/.test(char)) {
      i++;
      continue;
    }

    // Operadores aritméticos e parênteses
    if (char === "+") {
      tokens.push(new Token(TokenType.PLUS, "+", "+", startPos));
      i++;
      continue;
    }
    if (char === "-") {
      tokens.push(new Token(TokenType.MINUS, "-", "-", startPos));
      i++;
      continue;
    }
    if (char === "*" || char === "x" || char === "X") {
      tokens.push(new Token(TokenType.MUL, "*", char, startPos));
      i++;
      continue;
    }
    if (char === "/") {
      tokens.push(new Token(TokenType.DIV, "/", "/", startPos));
      i++;
      continue;
    }
    if (char === "(") {
      tokens.push(new Token(TokenType.LPAREN, "(", "(", startPos));
      i++;
      continue;
    }
    if (char === ")") {
      tokens.push(new Token(TokenType.RPAREN, ")", ")", startPos));
      i++;
      continue;
    }

    // Processar números e horas
    if (/[0-9.]/.test(char)) {
      let raw = "";
      // Consumir caracteres válidos para números, horas e sufixos
      while (i < input.length && /[0-9a-zA-Z.:]/.test(input[i])) {
        raw += input[i];
        i++;
      }

      try {
        const hasColon = raw.includes(":");
        const hasH = /[hH]/.test(raw);
        const hasM = /[mM]/.test(raw);

        if (hasColon || hasH || hasM) {
          // Tratar como tempo (horas/minutos)
          const mins = parseTimeToMinutes(raw);
          tokens.push(new Token(TokenType.TIME, mins, raw, startPos));
        } else {
          // Tratar como número puro (escalar)
          if (!/^\d+(\.\d+)?$/.test(raw)) {
            throw new Error(`Número mal formatado: "${raw}"`);
          }
          const num = parseFloat(raw);
          tokens.push(new Token(TokenType.NUMBER, num, raw, startPos));
        }
      } catch (err) {
        throw new Error(`Caractere ou valor inválido na posição ${startPos}: ${err.message}`);
      }
      continue;
    }

    // Se chegou aqui, encontrou um caractere inválido
    throw new Error(`Caractere inesperado na posição ${startPos}: "${char}"`);
  }

  tokens.push(new Token(TokenType.EOF, null, "", i));
  return tokens;
}
