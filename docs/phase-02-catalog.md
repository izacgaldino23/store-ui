# Fase 02 — Catálogo de Itens

## Objetivo

CRUD completo de itens do catálogo (revenda, insumo, serviço), importação via CSV, e alerta de estoque baixo.

## Tasks

- [ ] **2.1** Registrar resource `items` no `<Refine>` com:
  - `list: "/items"`
  - `create: "/items/create"`
  - `edit: "/items/:id/edit"`
  - `show: "/items/:id"`

- [ ] **2.2** Criar `src/pages/items/list.tsx`:
  - Tabela com colunas: Código, Nome, Tipo, Preço de Venda, Estoque Atual, Estoque Mínimo, Ativo
  - Filtros: tipo (select: todos/revenda/insumo/servico), busca por nome
  - Paginação
  - Badge de cor para tipo (azul=revenda, laranja=insumo, verde=servico)
  - Botões: Criar, Editar, Visualizar, Excluir
  - Indicador visual de estoque baixo (vermelho quando `current_stock <= min_stock`)

- [ ] **2.3** Criar `src/pages/items/create.tsx`:
  - Formulário com campos:
    - Nome (obrigatório)
    - Tipo (select: revenda, insumo, servico) — obrigatório
    - Unidade (obrigatório, ex: "un", "metros", "kg")
    - Preço de venda
    - Preço de custo
    - Estoque mínimo
    - Código de barras
    - Fornecedor
    - Descrição (textarea)
  - Ao criar, redirecionar para lista

- [ ] **2.4** Criar `src/pages/items/edit.tsx`:
  - Mesmo formulário do create, pré-preenchido
  - Campo "tipo" não editável (desabilitado)

- [ ] **2.5** Criar `src/pages/items/show.tsx`:
  - Detalhes do item em formato de descrição
  - Mostrar: Código, Nome, Tipo, Unidade, Preços, Estoque, Fornecedor, Datas

- [ ] **2.6** Botão de excluir (soft-delete):
  - Confirmar antes de excluir
  - Se item tiver movimentações, mostrar erro `item_has_movements` em português

- [ ] **2.7** Importação CSV:
  - Botão "Importar CSV" na toolbar da listagem
  - Modal com upload de arquivo (multipart)
  - Preview do resultado: "X itens criados, Y ignorados"
  - Listar linhas ignoradas com motivo

- [ ] **2.8** Página de estoque baixo:
  - Card ou drawer com lista de itens `revenda` com `current_stock <= min_stock`
  - Acesso rápido pela sidebar ou dashboard

- [x] **2.9** Ajuste manual de estoque:
  - Botão "Ajustar Estoque" na coluna de ações da listagem (Todos e Estoque Baixo), oculto para itens `servico`
  - Modal com: estoque atual, campo de quantidade (delta, aceita positivo e negativo) e motivo opcional
  - Chama `POST /api/catalog/items/:id/adjust-stock` → refetch da lista
  - Erros mapeados: `invalid_stock_update` → "Atualização de estoque inválida."

- [x] **2.10** Corrigir label "Un por Embalagem" → "Qtd. por Embalagem" no formulário e no drawer de visualização

## Critérios de aceitação

- [x] CRUD completo de itens funcional contra API
- [x] Filtro por tipo e busca por nome funcionando
- [x] Paginação funcionando
- [x] Importação CSV funcional (modal + upload)
- [x] Indicador visual de estoque baixo
- [x] Soft-delete com confirmação
- [x] Ajuste de estoque manual (delta +/−) com motivo opcional
- [x] Todas as mensagens em português
- [x] Erros da API mapeados corretamente
