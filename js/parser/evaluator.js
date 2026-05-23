/**
 * Avalia recursivamente a Árvore de Sintaxe Abstrata (AST) e retorna o resultado numérico em minutos.
 * 
 * @param {object} node - Nó da AST a ser avaliado.
 * @returns {number} O resultado do cálculo em minutos.
 */
export function evaluate(node) {
  if (!node) {
    throw new Error("Nó da árvore nulo ou inválido");
  }

  switch (node.type) {
    case "Literal":
      return node.value;

    case "UnaryExpression": {
      const operandVal = evaluate(node.operand);
      if (node.operator === "-") {
        return -operandVal;
      }
      return operandVal; // Se for "+", apenas retorna o valor positivo
    }

    case "BinaryExpression": {
      const leftVal = evaluate(node.left);
      const rightVal = evaluate(node.right);

      switch (node.operator) {
        case "+":
          return leftVal + rightVal;
        case "-":
          return leftVal - rightVal;
        case "*":
          return leftVal * rightVal;
        case "/":
          if (rightVal === 0) {
            throw new Error("Divisão por zero");
          }
          return leftVal / rightVal;
        default:
          throw new Error(`Operador desconhecido: "${node.operator}"`);
      }
    }

    default:
      throw new Error(`Tipo de nó da AST desconhecido: "${node.type}"`);
  }
}

/**
 * Função de conveniência para realizar todo o processo: tokenização, parsing e avaliação.
 * Retorna o resultado final em minutos.
 * 
 * @param {string} expression - A string contendo a expressão de horas.
 * @returns {number} O resultado em minutos.
 */
import { tokenize } from "./lexer.js";
import { Parser } from "./parser.js";

export function calculateExpression(expression) {
  const tokens = tokenize(expression);
  const parser = new Parser(tokens);
  const ast = parser.parse();
  const result = evaluate(ast);
  
  if (isNaN(result) || !isFinite(result)) {
    throw new Error("Resultado indeterminado ou infinito");
  }
  
  return result;
}
