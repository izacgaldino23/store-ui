# Fase 03 — Pedidos (PDV)

## Objetivo

Módulo de vendas rápido (PDV). Criar pedidos com múltiplos itens e formas de pagamento, gerenciar status, salvar rascunhos, editar pedidos e cancelar pedidos.

## Recursos

- Resource `orders` registrado no `<Refine>`:
  - `list: "/orders"`
  - `create: "/orders/create"`
  - `show: "/orders/:id"`
  - `edit: "/orders/:id/edit"`

## Tasks

- [x] **3.1** Registrar resource `orders` no `<Refine>` (list/create/show/edit) + rotas em `App.tsx`.

- [x] **3.2** Criar `src/pages/orders/list.tsx`:
  - Tabela com colunas: ID, Cliente, Status, Total, Itens, Data
  - Filtro por status (select com todas as opções, incl. rascunho/cancelado)
  - Paginação
  - Tag colorida por status (rascunho → roxo, cancelado → vermelho, demais por status)
  - Botões: Criar Pedido, Visualizar, Editar (oculto para entregue/cancelado)

- [x] **3.3** Criar `src/pages/orders/create.tsx` (PDV Rápido):
  - Busca de produtos com debounce (300ms) e adição ao carrinho
  - Tabela de itens: Nome, Tipo, Qtd (+/−), Valor Unit., Total, remover
  - Cálculo automático do total
  - Seção Pagamentos: método (pix, dinheiro, credito, debito) + valor, indicador de valor restante, permite overpayment
  - Cliente (opcional) e Observações (opcional)
  - Botões: "Finalizar Pedido" (exige ≥1 item e pagamentos cobrindo o total) e "Salvar Rascunho" (`status: rascunho`, aceita pagamentos parciais/zero)
  - Após criar, redireciona para a listagem

- [x] **3.4** Criar `src/pages/orders/show.tsx`:
  - Detalhes do pedido (status, total, cliente, observações, datas, motivo/ data de cancelamento quando cancelado)
  - Tabela de itens e tabela de pagamentos
  - Botões de transição de status válidos (incl. finalização de rascunho para pendente/em_producao/pronto/entregue)
  - Botão "Editar Pedido" (apenas rascunho/pendente/em_producao/pronto)
  - Botão "Cancelar Pedido" com modal de motivo opcional (oculto se já cancelado)

- [x] **3.5** Edição de pedido (`src/pages/orders/edit.tsx`):
  - Carrega o pedido e os preços de venda atuais do catálogo por item (GET `/catalog/items/:id` em paralelo)
  - Edição de itens (qtd/remover/adicionar), pagamentos, cliente e observações
  - Bloqueia edição de pedidos entregue/cancelado com aviso (alerta + voltar)
  - Rascunhos: "Salvar Rascunho" (PUT mantém status) e "Finalizar Pedido" (PUT + transição para pendente)
  - Demais status: "Salvar Alterações" exige pagamentos cobrindo o total
  - Salva via `PUT /orders/:id`; redireciona para os detalhes

- [x] **3.6** Cancelamento de pedido:
  - Modal de confirmação com motivo opcional
  - `POST /orders/:id/cancel`; exibe motivo/data no show quando cancelado
  - Usa `<Modal>` controlado (estado React) com `confirmLoading` — garante que o endpoint é chamado (corrigido bug onde o `Modal.confirm` estático não disparava a requisição)

## Componentes compartilhados

- `src/pages/orders/constants.ts`: statusColors, statusLabels, paymentMethodLabels, validTransitions, statusFilterOptions, paymentMethodOptions, formatCurrency, formatDate
- `src/pages/orders/types.ts`: IOrder, IOrderItem, IPayment, ICatalogItem, ICartItem

## Erros mapeados

- `order_not_editable` → "Este pedido não pode ser editado. Apenas rascunhos, pendentes, em produção ou prontos podem ser alterados."
- `payment_mismatch`, `invalid_transition`, `insufficient_stock`, `order_not_found`, `order_item_not_found`, `invalid_order_status` já mapeados em `src/providers/error-mapping.ts`.

## Critérios de aceitação

- [x] Criação de pedido funcional com múltiplos itens
- [x] Múltiplos pagamentos por pedido (overpayment permitido)
- [x] Rascunhos: criação com itens e pagamentos parciais/zero, sem impacto em estoque
- [x] Edição de pedidos (rascunho/pendente/em_producao/pronto) com recálculo de preços
- [x] Cancelamento de pedido com motivo opcional e restauração de estoque quando entregue
- [x] Transição de status com validação
- [x] Busca de produtos rápida com debounce
- [x] Cálculo automático de totais
- [x] Filtro por status na listagem (incl. rascunho/cancelado)
- [x] Todas as mensagens em português
- [x] Erros (insufficient_stock, payment_mismatch, invalid_transition, order_not_editable) mapeados
