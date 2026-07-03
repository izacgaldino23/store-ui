# Fase 03 — Pedidos (PDV)

## Objetivo

Módulo de vendas rápido (PDV). Criar pedidos com múltiplos itens e formas de pagamento, gerenciar status.

## Tasks

- [ ] **3.1** Registrar resource `orders` no `<Refine>` com:
  - `list: "/orders"`
  - `create: "/orders/create"`
  - `show: "/orders/:id"`
  - `edit: "/orders/:id/edit"` (apenas status)

- [ ] **3.2** Criar `src/pages/orders/list.tsx`:
  - Tabela com colunas: ID, Cliente, Status, Total, Itens, Data
  - Filtros: status (select), período (date range)
  - Paginação
  - Tag colorida por status:
    - pendente → laranja
    - em_producao → azul
    - pronto → verde
    - entregue → cinza
  - Botões: Criar Pedido, Visualizar, Atualizar Status

- [ ] **3.3** Criar `src/pages/orders/create.tsx` (PDV Rápido):
  - Seção "Cliente": campo de texto para nome (opcional)
  - Seção "Itens do Pedido":
    - Select com busca para adicionar item (busca por nome/código)
    - Campo de quantidade
    - Tabela de itens adicionados com: Nome, Tipo, Preço Unitário, Quantidade, Subtotal
    - Botão remover item
    - Cálculo automático do total
  - Seção "Pagamentos":
    - Botão "Adicionar Pagamento"
    - Para cada pagamento: método (select: pix, dinheiro, credito, debito) + valor
    - Indicador visual de valor restante vs total
    - Permite overpayment
  - Seção "Observações": textarea opcional
  - Botão "Finalizar Pedido"
  - Após criar, redirecionar para página de detalhes

- [ ] **3.4** Criar `src/pages/orders/show.tsx`:
  - Detalhes do pedido
  - Tabela de itens
  - Tabela de pagamentos
  - Status atual com tag colorida
  - Botões de ação para transição de status (se aplicável)

- [ ] **3.5** Componente de atualização de status:
  - Botões/passos mostrando o fluxo: Pendente → Em Produção → Pronto → Entregue
  - Apenas transições válidas habilitadas
  - Confirmar antes de mudar
  - Se todos os itens são revenda, status deve ir direto para "entregue" (regra do backend)

- [ ] **3.6** Modal de busca rápida de produtos:
  - Input com debounce (300ms)
  - Resultados exibidos com código + nome + preço + estoque
  - Ao selecionar, adiciona ao carrinho com quantidade padrão 1

## Critérios de aceitação

- [ ] Criação de pedido funcional com múltiplos itens
- [ ] Múltiplos pagamentos por pedido
- [ ] Transição de status com validação
- [ ] Busca de produtos rápida com debounce
- [ ] Cálculo automático de totais
- [ ] Filtros na listagem (status + data)
- [ ] Todas as mensagens em português
- [ ] Erros (insufficient_stock, payment_mismatch, invalid_transition) mapeados
