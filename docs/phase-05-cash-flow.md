# Fase 05 — Fluxo de Caixa

## Objetivo

Gerenciar abertura/fechamento de caixa, registrar despesas diárias, visualizar relatório diário e histórico.

## Tasks

- [ ] **5.1** Registrar resources no `<Refine>`:
  - `cash-register` (custom, sem CRUD padrão)
  - `expenses` (list + create)

- [ ] **5.2** Criar painel de caixa atual `src/pages/cash-flow/current.tsx`:
  - Exibe status do caixa: aberto/fechado
  - Se aberto: mostrar saldo inicial, saldo atual, horas de abertura
  - Botão "Fechar Caixa"
  - Se fechado: botão "Abrir Caixa"

- [ ] **5.3** Modal "Abrir Caixa":
  - Campo: saldo inicial (obrigatório)
  - Campo: observações (opcional)
  - POST `/cash-register/open`

- [ ] **5.4** Modal "Fechar Caixa":
  - Mostrar resumo: saldo inicial, total vendas, total despesas, saldo esperado
  - Campo: saldo de fechamento (obrigatório, pré-preenchido com saldo esperado)
  - Campo: observações (opcional)
  - Exibir discrepância se houver
  - POST `/cash-register/close`

- [ ] **5.5** Relatório Diário `src/pages/cash-flow/daily-report.tsx`:
  - Cards com: saldo inicial, total vendas, total despesas, saldo esperado, saldo final, discrepância
  - Gráfico simples (opcional)
  - GET `/cash-register/daily-report`

- [ ] **5.6** Histórico de Caixa `src/pages/cash-flow/history.tsx`:
  - Tabela com registros fechados
  - Colunas: Data abertura, Data fechamento, Saldo inicial, Saldo final, Status, Discrepância
  - Filtros: período (start_date, end_date)
  - Paginação

- [ ] **5.7** Despesas — seção no fluxo de caixa ou página separada:
  - Lista de despesas do caixa atual
  - Tabela com: Descrição, Valor, Categoria, Método Pagamento, Data
  - Botão "Nova Despesa"
  - Filtros: categoria, período

- [ ] **5.8** Modal "Nova Despesa":
  - Descrição (obrigatório)
  - Valor (obrigatório)
  - Método de pagamento (select: pix, dinheiro, credito, debito) — obrigatório
  - Categoria (select: suprimentos, transporte, alimentacao, outros)
  - POST `/expenses`

- [ ] **5.9** Menu lateral:
  - "Fluxo de Caixa" com sub-itens: "Caixa Atual", "Relatório Diário", "Histórico", "Despesas"

## Critérios de aceitação

- [ ] Abertura e fechamento de caixa funcionais
- [ ] Despesas podem ser registradas e listadas
- [ ] Relatório diário com todos os indicadores
- [ ] Histórico com filtro por período
- [ ] Discrepância exibida ao fechar caixa
- [ ] Validação: não permite abrir novo caixa com um já aberto
- [ ] Todas as mensagens em português
