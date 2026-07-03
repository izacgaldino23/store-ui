# Fase 06 — Dashboard e Refinamentos

## Objetivo

Criar dashboard com KPIs relevantes, polir experiência do usuário, tratar edge cases.

## Tasks

- [ ] **6.1** Dashboard `src/pages/dashboard/index.tsx` com cards:
  - **Caixa Atual**: saldo atual + status (aberto/fechado)
  - **Pedidos Pendentes**: quantidade + link para listagem
  - **Estoque Baixo**: contagem de itens + link
  - **Vendas Hoje**: total vendido no dia
  - **Despesas Hoje**: total de despesas

- [ ] **6.2** Customizações visuais:
  - Cores da marca Miau (roxo como cor primária)
  - Nome "Miau Store" no header
  - Favicon personalizado

- [ ] **6.3** Tratamento de erros global:
  - Notificações de erro usando `useNotification` do Refine
  - Mensagens sempre em português via `translateError`
  - Tratar erro de rede (servidor offline)

- [ ] **6.4** Loading states:
  - Skeleton enquanto carrega
  - Spinner em botões de submit

- [ ] **6.5** Empty states:
  - Mensagem "Nenhum registro encontrado" em tabelas vazias
  - Ilustrações simples ou ícones

- [ ] **6.6** Responsividade básica:
  - Sidebar recolhível em mobile
  - Tabelas com scroll horizontal em telas pequenas

- [ ] **6.7** Confirmações:
  - Modal de confirmação antes de excluir
  - Modal de confirmação antes de mudar status de pedido
  - Modal de confirmação antes de fechar caixa

- [ ] **6.8** Verificação final:
  - Rodar `bun run build` sem erros
  - Navegar por todas as telas
  - Testar fluxos principais: login → criar item → criar pedido → abrir caixa → fechar caixa
  - Verificar que todas as mensagens estão em português

## Critérios de aceitação

- [ ] Dashboard funcional com dados reais da API
- [ ] Navegação completa entre todos os módulos
- [ ] Tratamento de erros global (rede, 500, etc.)
- [ ] Loading e empty states em todas as listas
- [ ] Confirmações em ações destrutivas
- [ ] Build sem erros
