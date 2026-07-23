# 🖥️ Inventário Digital Escolar para Equipamentos de TI

Sistema web gratuito para cadastro, consulta e controle de equipamentos de TI (notebooks, computadores, projetores, impressoras, etc.) de uma escola, construído com **Google Apps Script + Google Sheets**.

Desenvolvido para a **Atividade Extensionista II - Tecnologia Aplicada à Inclusão Digital** do curso de **Análise e Desenvolvimento de Sistemas (UNINTER)**, aplicado na **Escola Estadual Professor João Martins de Almeida**, em Pindamonhangaba/SP.

> 📌 Este repositório contém apenas o **código-fonte** do sistema (`Code.gs` + `Index.html`). Os dados ficam armazenados em uma Planilha Google própria de cada instalação - nenhum dado da escola é versionado aqui, pois já estão utilizando.

---

## ✨ Funcionalidades

- **Cadastro de equipamentos** com tipo, marca/modelo, etiqueta patrimonial, número de série, local/sala e status.
- **Lista fixa de marca/modelo para notebooks** (Multilaser, Positivo, Samsung Chromebook 2023/2025) — demais tipos aceitam texto livre.
- **Cadastro em lote**: registra vários equipamentos de uma vez informando um intervalo de etiquetas (ex: de 1 até 35).
- **Checagem de duplicidade de etiqueta escopada por marca + tipo** (ex: "Positivo nº 5" e "Multilaser nº 5" podem coexistir).
- **Consulta e filtros** por tipo, status e busca livre (etiqueta, marca, local, número de série).
- **Atualização de status** e remoção de itens direto na listagem.
- **Painel de totais**: quantidade geral, por tipo de equipamento, por status (funcionando / em manutenção / aguardando peça-garantia / para descarte) e por marca dentro de cada tipo.

---

## 🛠️ Tecnologias

- [Google Apps Script](https://developers.google.com/apps-script) (backend serverless, gratuito)
- Google Sheets (banco de dados)
- HTML, CSS e JavaScript puro (frontend, servido via `HtmlService`)

Não depende de nenhum serviço pago, servidor externo ou banco de dados separado - tudo roda dentro da conta Google do usuário.

---

## 📁 Estrutura do repositório

```
├── Code.gs           # Backend: lógica de cadastro, consulta, totais e configuração inicial
├── Index.html        # Frontend: interface do usuário (HTML + CSS + JS)
└── README.md
```

---

## 📊 Estrutura de dados (planilha)

O script cria e gerencia automaticamente duas abas na Planilha Google:

**Config**
| Coluna A: Tipos de Equipamento | Coluna C: Status |
|---|---|
| Lista editável de tipos (Computador, Notebook, Projetor, TV, Tablet, Impressora, etc.) | Lista editável de status (Funcionando, Em manutenção, Aguardando peça/garantia, Para descarte) |

**Inventario**
| ID | Equipamento | Marca/Modelo | Etiqueta da Escola | Número de Série | Local/Sala | Status | Data de Cadastro | Última Atualização |
|---|---|---|---|---|---|---|---|---|

---

## 🚀 Como instalar

1. Crie uma **Planilha Google** nova.
2. Nela, vá em **Extensões → Apps Script**.
3. Copie o conteúdo de `Code.gs` deste repositório para o arquivo `Code.gs` do projeto.
4. Crie um arquivo HTML chamado exatamente `Index` e cole o conteúdo de `Index.html`.
5. No editor, selecione a função `configurarPlanilhaInicial` no menu suspenso e clique em **Executar** (▶). Autorize o acesso quando solicitado.
6. Isso cria as abas `Config` e `Inventario` na planilha, com os tipos e status já pré-cadastrados.
7. Vá em **Implantar → Nova implantação → App da Web**:
   - Executar como: **Eu (sua conta)**
   - Quem pode acessar: **Qualquer pessoa**
8. Copie o link gerado - é o endereço do sistema, pronto para uso.

> ⚠️ Toda vez que o código (`Code.gs` ou `Index.html`) for atualizado, é necessário criar uma **nova versão** da implantação (Implantar → Gerenciar implantações → editar → Nova versão) para que o link publicado reflita as mudanças.

---

## 🎓 Contexto acadêmico

| | |
|---|---|
| **Curso** | CST em Análise e Desenvolvimento de Sistemas - UNINTER |
| **Disciplina** | Atividade Extensionista II - Tecnologia Aplicada à Inclusão Digital (Projeto) |
| **ODS relacionados** | 04 - Educação de Qualidade · 09 - Indústria, Inovação e Infraestrutura |
| **Setor de aplicação** | Escola Estadual Professor João Martins de Almeida - Pindamonhangaba/SP |
| **Autora** | Zara de Albuquerque Silva |

---

## 📄 Licença

Projeto acadêmico de uso livre para fins educacionais. Sinta-se à vontade para adaptar para a realidade de outras escolas.
