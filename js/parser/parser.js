import { TokenType } from "./lexer.js";

/**
 * Analisador Sintático (Parser) Descendente Recursivo.
 * Constrói uma Árvore de Sintaxe Abstrata (AST) a partir de uma lista de tokens.
 */
export class Parser {
  /**
   * @param {import("./lexer.js").Token[]} tokens - Lista de tokens gerada pelo lexer.
   */
  constructor(tokens) {
    this.tokens = tokens;
    this.currentIndex = 0;
  }

  /**
   * Retorna o token atual sem avançar o cursor.
   * @returns {import("./lexer.js").Token}
   */
  peek() {
    return this.tokens[this.currentIndex];
  }

  /**
   * Consome e retorna o token atual, avançando o cursor.
   * @returns {import("./lexer.js").Token}
   */
  consume() {
    const token = this.peek();
    if (token.type !== TokenType.EOF) {
      this.currentIndex++;
    }
    return token;
  }

  /**
   * Valida se o token atual é do tipo esperado e o consome.
   * Se não for, lança um erro de sintaxe.
   * 
   * @param {string} type - Tipo do token esperado (TokenType)
   * @returns {import("./lexer.js").Token}
   */
  expect(type) {
    const token = this.peek();
    if (token.type !== type) {
      if (token.type === TokenType.EOF) {
        throw new Error(`Expressão incompleta. Esperava "${type}" no final da expressão.`);
      }
      throw new Error(`Erro de sintaxe na posição ${token.position}: Esperava "${type}", mas encontrou "${token.raw}"`);
    }
    return this.consume();
  }

  /**
   * Ponto de entrada do parser.
   * @returns {object} O nó raiz da AST.
   */
  parse() {
    if (this.tokens.length === 0 || this.tokens[0].type === TokenType.EOF) {
      throw new Error("Expressão vazia");
    }

    const ast = this.parseExpression();

    // Após processar a expressão principal, devemos estar no EOF.
    // Caso contrário, há parênteses fechando sem abrir ou tokens perdidos.
    const token = this.peek();
    if (token.type !== TokenType.EOF) {
      throw new Error(`Erro de sintaxe na posição ${token.position}: Caractere inesperado ou parênteses desbalanceados: "${token.raw}"`);
    }

    return ast;
  }

  /**
   * Expressão matemática (soma e subtração são os de menor precedência).
   */
  parseExpression() {
    return this.parseAddSub();
  }

  /**
   * Analisa operações de Soma (+) e Subtração (-).
   */
  parseAddSub() {
    let left = this.parseMulDiv();

    while (this.peek().type === TokenType.PLUS || this.peek().type === TokenType.MINUS) {
      const operatorToken = this.consume();
      const right = this.parseMulDiv();
      left = {
        type: "BinaryExpression",
        operator: operatorToken.value,
        left,
        right,
        position: operatorToken.position
      };
    }

    return left;
  }

  /**
   * Analisa operações de Multiplicação (*) e Divisão (/).
   */
  parseMulDiv() {
    let left = this.parseUnary();

    while (this.peek().type === TokenType.MUL || this.peek().type === TokenType.DIV) {
      const operatorToken = this.consume();
      const right = this.parseUnary();
      left = {
        type: "BinaryExpression",
        operator: operatorToken.value,
        left,
        right,
        position: operatorToken.position
      };
    }

    return left;
  }

  /**
   * Analisa operadores unários (+ e - na frente de números/horas).
   */
  parseUnary() {
    const token = this.peek();
    if (token.type === TokenType.PLUS || token.type === TokenType.MINUS) {
      const operatorToken = this.consume();
      const operand = this.parseUnary();
      return {
        type: "UnaryExpression",
        operator: operatorToken.value,
        operand,
        position: operatorToken.position
      };
    }

    return this.parsePrimary();
  }

  /**
   * Analisa elementos atômicos: parênteses, números literais ou valores de tempo.
   */
  parsePrimary() {
    const token = this.peek();

    if (token.type === TokenType.LPAREN) {
      this.consume(); // Consumir o '('
      const expr = this.parseExpression();
      this.expect(TokenType.RPAREN); // Deve fechar com ')'
      return expr;
    }

    if (token.type === TokenType.NUMBER || token.type === TokenType.TIME) {
      this.consume();
      return {
        type: "Literal",
        value: token.value,
        valueType: token.type,
        raw: token.raw,
        position: token.position
      };
    }

    if (token.type === TokenType.EOF) {
      throw new Error("Expressão incompleta");
    }

    throw new Error(`Token inesperado na posição ${token.position}: "${token.raw}"`);
  }
}
