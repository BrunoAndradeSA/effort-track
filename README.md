# Effort Track ⏰

[![JavaScript](https://img.shields.io/badge/language-JavaScript-yellow.svg)](https://developer.mozilla.org/pt-BR/docs/Web/JavaScript) [![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE) [![GitHub Pages](https://img.shields.io/badge/deploy-GitHub%20Pages-blue.svg)](https://brunoandradesa.github.io/effort-track/)

Aplicação pequena (UI web) e utilitários CLI para calcular horas e esforço. Inclui um lexer/parser para expressões de tempo, avaliador, componentes de interface e um runner de testes simples. 🚀

---

## 📋 Funcionalidades

- ✅ **Parser/Avaliador** de expressões com suporte a horas e minutos
- 🖥️ **UI web** para inserir e visualizar horas
- 📊 **Viabilidade de Prazo** — calcula capacidade vs. esforço estimado
- 📅 **Diferença entre Datas** — dias corridos, úteis e horas úteis entre duas datas
- 📱 **PWA** — instalação na tela inicial e suporte offline
- 🧪 **Runner de testes** em Node (CLI) com 26 testes

## 🟢 Status

Projeto minimalista e autossuficiente — **sem passo de build**. Abra `index.html` no navegador para usar a interface.

## 📦 Requisitos

- Node.js (opcional, apenas para rodar os testes no CLI)

---

## ▶️ Como Rodar

### 🌐 Versão online

Acesse: [**Effort Track**](https://brunoandradesa.github.io/effort-track/)

### 📂 Abrir localmente (modo mais simples)

1. Abrir o arquivo `index.html` no navegador.

### 🖥️ Rodar um servidor estático (recomendado para módulos ESM)

Com Node.js instalado, use `npx` (sem instalar globalmente):

```bash
npx serve .
```

### 🧪 Executar testes/CLI

```bash
npm install
npm test
```

---

## ✍️ Exemplos de Uso (Expressões)

Expressões válidas que o parser aceita:

| Entrada                    | Descrição                          |
|----------------------------|------------------------------------|
| `1.5h + 30m`               | Soma horas e minutos               |
| `7:30 - 1h`                | Subtrai 1 hora de 7:30             |
| `2h * 1.5`                 | Escala (2 horas × 1.5)             |
| `(1:30 + 45m) / 2`         | Expressão com parênteses           |
| `30m + 30m`                | Resulta em `01:00` (HH:mm)         |

### ⏱️ Saída esperada

Valores de tempo são convertidos internamente para minutos e apresentados no formato `HH:mm`.  
Exemplo: `90` minutos → `01:30`.

---

## 🎛️ Layout da UI

A aplicação usa abas (tabs) com quatro seções principais:

- **📅 Horas** — calculadora de expressões com horas e minutos
- **📊 Esforço** — viabilidade de prazo (capacidade DEV/QA vs. estimativa)
- **📅 Datas** — diferença entre datas (dias corridos, úteis e horas úteis)
- **🧪 Testes** — executar e visualizar testes no navegador

### 🏗️ Estrutura visual básica

- **Header** com alternador de abas
- **Main** com seções que recebem o conteúdo via `js/ui/*.js`
- **Estilos** em `index.css`

---

## 📁 Estrutura do Projeto

```
./
├── index.html              # 🏠 Entrada da UI web
├── index.css               # 🎨 Estilos
├── manifest.json           # 📱 Manifesto PWA
├── sw.js                   # 🔄 Service Worker (cache offline)
├── package.json            # 📦 Metadados e script `test`
├── LICENSE                 # 📜 Licença MIT
├── README.md               # 📖 Documentação
├── test-cli.js             # 🧪 Runner de testes em Node (CLI)
├── assets/
│   ├── favicon.svg         # 🔖 Ícone do favicon
│   ├── icon-192.png        # 📱 Ícone PWA 192×192
│   └── icon-512.png        # 📱 Ícone PWA 512×512
├── js/
│   ├── main.js             # 🚀 Inicialização da aplicação + registro SW
│   ├── utils/
│   │   └── timeUtils.js    # ⏱️ Parse/format de tempo, dias úteis, máscara
│   ├── parser/
│   │   ├── lexer.js        # 🔤 Tokenizer
│   │   ├── parser.js       # 🌳 Construção da AST
│   │   └── evaluator.js    # 🧮 Avaliação da AST
│   ├── services/
│   │   └── effortCalculator.js  # 🧾 Lógica de cálculo de viabilidade
│   ├── tests/
│   │   └── suite.js        # 📋 Suíte de 26 testes unitários
│   └── ui/
│       ├── hoursUi.js      # 📅 UI da aba Calculadora de Horas
│       ├── effortUi.js     # 📊 UI da aba Viabilidade de Prazo
│       ├── dateDiffUi.js   # 📆 UI da aba Diferença entre Datas
│       ├── testUi.js       # 🧪 UI da aba Testes Unitários
│       └── theme.js        # 🌓 Alternador de tema (claro/escuro)
└── .vscode/
    └── launch.json         # 🔧 Configurações de debug (local)
```

---

## 💡 Dicas de Desenvolvimento

- ✏️ Para editar a UI, modifique arquivos em `js/ui/` e recarregue o navegador.
- 🔍 Para entender o parser, veja `js/parser/lexer.js`, `parser.js` e `evaluator.js`.
- 🧪 Execute `npm test` para rodar os 26 testes em `test-cli.js`.
- 📱 Teste o PWA: abra no Chrome, vá em "Adicionar à tela inicial" e teste o funcionamento offline.
- 🗂️ Ícones PWA são gerados a partir de `assets/favicon.svg` com `rsvg-convert`.

---

## 🤝 Contribuição

Pull requests são bem-vindos! ✨

## 📜 Licença

Este projeto está licenciado sob **MIT**. Veja o arquivo [LICENSE](./LICENSE) para detalhes.
