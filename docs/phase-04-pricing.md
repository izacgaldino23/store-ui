# Fase 04 — Precificação

## Objetivo

Gerenciar tabela de preços para serviços gráficos e calculadora de margem para artesanato.

## Tasks

- [ ] **4.1** Registrar resource `price-table` no `<Refine>` com:
  - `list: "/pricing/table"`
  - `create: "/pricing/table/create"`
  - `edit: "/pricing/table/:id/edit"`

- [ ] **4.2** Criar `src/pages/price-table/list.tsx`:
  - Tabela com colunas: Tipo de Papel, Qtd Mínima, Qtd Máxima, Preço Unitário, Descrição, Ativo
  - Filtro por tipo de papel
  - Botões: Criar, Editar, Excluir

- [ ] **4.3** Criar `src/pages/price-table/create.tsx`:
  - Formulário: tipo de papel (obrigatório), preço unitário (obrigatório), qtd mínima, qtd máxima, descrição

- [ ] **4.4** Criar `src/pages/price-table/edit.tsx`:
  - Mesmo formulário do create, pré-preenchido

- [ ] **4.5** Criar página "Calculadora" `src/pages/pricing/calculator.tsx`:
  - Aba separada ou sub-rota de pricing
  - Formulário:
    - Custo do material (obrigatório)
    - Margem de lucro % (obrigatório)
    - Tipo de papel (opcional, para sugestão)
    - Quantidade (opcional)
  - Botão "Calcular"
  - Resultado exibe: preço sugerido, preço unitário
  - Usa endpoint POST `/pricing/calculate`

- [ ] **4.6** Menu lateral: "Precificação" com sub-itens:
  - "Tabela de Preços"
  - "Calculadora de Margem"

## Critérios de aceitação

- [ ] CRUD da tabela de preços funcional
- [ ] Calculadora de margem funcional
- [ ] Navegação entre tabela e calculadora
- [ ] Todas as mensagens em português
