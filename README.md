# Effort Track ⏰

[![JavaScript](https://img.shields.io/badge/language-JavaScript-yellow.svg)](https://developer.mozilla.org/pt-BR/docs/Web/JavaScript) [![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE) [![GitHub Pages](https://img.shields.io/badge/deploy-GitHub%20Pages-blue.svg)](https://brunoandradesa.github.io/effort-track/)

Aplicação PWA para calcular horas, estimar esforço de projetos e acompanhar a evolução de entregas. Inclui lexer/parser para expressões de tempo, calculadora de viabilidade de prazo e geração de relatórios. 🚀

---

## 📋 Funcionalidades

- ✅ **Parser/Avaliador** de expressões com suporte a horas e minutos (ex: `1.5h + 30m`, `(7:30 - 1h) * 2`)
- 🖥️ **Calculadora de Horas** — UI web para inserir e converter expressões de tempo
- 📊 **Viabilidade de Prazo** — calcula capacidade DEV/QA vs. esforço estimado, com indicador de gargalo (recurso limitante)
- 📅 **Diferença entre Datas** — dias corridos, úteis e horas úteis entre duas datas
- 📈 **Acompanhamento de Projetos** — CRUD completo com cards, métricas de progresso, previsão de conclusão, chance de sucesso e filtros
- 📧 **Relatório por Email** — gera relatório executivo formatado em HTML (com gráficos SVG) e copia para área de transferência; abre o cliente de email com resumo em texto
- 🖨️ **Exportar PDF** — abre o relatório completo em nova aba com `window.print()` para salvar como PDF
- ⚙️ **Configurações** — duração padrão do projeto, quantidade de DEVs/QAs, horas/dia e e-mails das partes interessadas (persistem no localStorage)
- 📱 **PWA** — instalável na tela inicial, suporte offline via Service Worker
- 🧪 **Runner de testes** em Node (CLI) com 41 testes
- 🌓 **Tema Claro/Escuro**

## 🟢 Status

Projeto autossuficiente — **sem passo de build**. Abra `index.html` no navegador para usar a interface.

## 📦 Requisitos

- Node.js (opcional, apenas para rodar os testes no CLI)

---

## ▶️ Como Rodar

### 🌐 Versão online

Acesse: [**Effort Track**](https://brunoandradesa.github.io/effort-track/)

### 📂 Abrir localmente

1. Abrir o arquivo `index.html` no navegador.

Com Node.js, use `npx` para servir com módulos ESM:

```bash
npx serve .
```

### 🧪 Executar testes

```bash
npm install
npm test
```

---

## 🎛️ Layout da UI

A aplicação usa abas (tabs) com cinco seções:

- **📊 Viabilidade de Prazo** — formulário de capacidade vs. esforço, botão "Cadastrar Projeto"
- **📈 Acompanhamento de Projetos** — cards com progresso, filtros e atualização diária
- **📅 Calculadora de Horas** — expressões com horas e minutos
- **📆 Diferença entre Datas** — cálculo entre duas datas
- **🧪 Testes Unitários** — execução e visualização no navegador

### ⚙️ Configurações

Acessível pelo ícone de engrenagem no header:
- Duração padrão do projeto (dias)
- Quantidade de DEVs e QAs
- Horas trabalhadas por dia
- E-mails das partes interessadas (formato badge/chip)

---

## 📁 Estrutura do Projeto

```
./
├── index.html              # Entrada da UI web
├── index.css               # Estilos globais
├── manifest.json           # Manifesto PWA
├── sw.js                   # Service Worker (cache offline, v2)
├── package.json            # Metadados e script `test`
├── test-cli.js             # Runner de testes em Node (CLI)
├── assets/                 # Ícones PWA e favicon
├── js/
│   ├── main.js             # Inicialização, tabs, registro SW
│   ├── utils/              # Utilitários de tempo, dias úteis, máscara
│   ├── parser/             # Lexer, parser e evaluator de expressões
│   ├── services/           # Lógica de negócio (cálculo de esforço,
│   │                       #   projetos, configurações, relatórios)
│   ├── tests/              # Suíte de 41 testes unitários
│   └── ui/                 # Módulos de interface (horas, esforço,
│                           #   projetos, testes, tema, diff de datas,
│                           #   configurações)
├── .vscode/                # Configurações de debug
└── AGENTS.md               # Histórico de alterações do agente
```

---

## 💡 Dicas de Desenvolvimento

- ✏️ Edite arquivos em `js/ui/` e recarregue o navegador.
- 🔍 Para o parser, veja `js/parser/`.
- 🧪 Execute `npm test` para rodar os 41 testes.
- 📱 Teste o PWA: "Adicionar à tela inicial" e teste offline.
- 📧 Relatório HTML é copiado para clipboard; cole no corpo do email.

---

## 📜 Licença

MIT. Veja [LICENSE](./LICENSE).
