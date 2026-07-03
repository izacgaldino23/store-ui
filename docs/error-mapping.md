# Mapeamento de Erros da API

Todos os erros retornados pela API seguem o formato:

```json
{
  "code": "error_code",
  "message": "mensagem original (inglês)",
  "validation_errors": [...]
}
```

Cada `code` é mapeado para uma mensagem amigável em português no frontend.

## Mapeamento completo

| Código | Mensagem em Português |
|--------|----------------------|
| `invalid_body` | Dados inválidos. Verifique os campos e tente novamente. |
| `invalid_query_param` | Parâmetro inválido na requisição. |
| `validation_error` | Um ou mais campos estão inválidos. |
| `internal_server_error` | Erro interno do servidor. Tente novamente mais tarde. |
| `too_many_requests` | Muitas requisições. Aguarde um momento. |
| `invalid_credentials` | Email/usuário ou senha inválidos. |
| `invalid_email` | Email inválido. |
| `email_already_registered` | Este email já está cadastrado. |
| `invalid_token` | Sessão inválida. Faça login novamente. |
| `token_expired` | Sessão expirada. Faça login novamente. |
| `refresh_token_expired` | Sessão expirada. Faça login novamente. |
| `refresh_token_revoked` | Sessão inválida. Faça login novamente. |
| `user_not_found` | Usuário não encontrado. |
| `refresh_token_not_found` | Sessão não encontrada. Faça login novamente. |
| `item_not_found` | Item não encontrado no catálogo. |
| `item_code_conflict` | Já existe um item com este código. |
| `invalid_csv` | Arquivo CSV inválido. Verifique o formato (separador: ponto e vírgula). |
| `invalid_item_type` | Tipo de item inválido. Use: revenda, insumo ou serviço. |
| `item_has_movements` | Item possui movimentações e não pode ser excluído. |
| `invalid_stock_update` | Atualização de estoque inválida. |
| `order_not_found` | Pedido não encontrado. |
| `order_item_not_found` | Item do pedido não encontrado no catálogo. |
| `invalid_order_status` | Status do pedido inválido. |
| `invalid_transition` | Transição de status inválida para este pedido. |
| `payment_mismatch` | Valor total dos pagamentos não corresponde ao total do pedido. |
| `insufficient_stock` | Estoque insuficiente para um ou mais itens. |
| `price_table_entry_not_found` | Entrada de preço não encontrada. |
| `cash_register_not_found` | Registro de caixa não encontrado. |
| `no_open_register` | Nenhum caixa aberto no momento. |
| `register_already_open` | Já existe um caixa aberto. Feche-o antes de abrir outro. |
| `invalid_payment_method` | Método de pagamento inválido. |

## Implementação

O mapeamento será implementado como um objeto constante em `src/providers/error-mapping.ts`:

```typescript
export const errorMessages: Record<string, string> = {
  invalid_body: 'Dados inválidos. Verifique os campos e tente novamente.',
  invalid_credentials: 'Email/usuário ou senha inválidos.',
  // ... todos os demais
};

export function translateError(code: string): string {
  return errorMessages[code] || 'Ocorreu um erro inesperado. Tente novamente.';
}
```

Usado no `auth provider` (`onError`) e no `data provider` (interceptor de response) para garantir que toda mensagem de erro exibida ao usuário esteja em português.
