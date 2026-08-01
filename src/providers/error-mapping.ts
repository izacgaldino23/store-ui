export const errorMessages: Record<string, string> = {
  invalid_body: 'Dados inválidos. Verifique os campos e tente novamente.',
  invalid_query_param: 'Parâmetro inválido na requisição.',
  validation_error: 'Um ou mais campos estão inválidos.',
  internal_server_error: 'Erro interno do servidor. Tente novamente mais tarde.',
  too_many_requests: 'Muitas requisições. Aguarde um momento.',
  invalid_credentials: 'Email/usuário ou senha inválidos.',
  invalid_email: 'Email inválido.',
  email_already_registered: 'Este email já está cadastrado.',
  invalid_token: 'Sessão inválida. Faça login novamente.',
  token_expired: 'Sessão expirada. Faça login novamente.',
  refresh_token_expired: 'Sessão expirada. Faça login novamente.',
  refresh_token_revoked: 'Sessão inválida. Faça login novamente.',
  user_not_found: 'Usuário não encontrado.',
  refresh_token_not_found: 'Sessão não encontrada. Faça login novamente.',
  item_not_found: 'Item não encontrado no catálogo.',
  item_code_conflict: 'Já existe um item com este código.',
  invalid_csv: 'Arquivo CSV inválido. Verifique o formato (separador: ponto e vírgula).',
  invalid_item_type: 'Tipo de item inválido. Use: revenda, insumo ou serviço.',
  item_has_movements: 'Item possui movimentações e não pode ser excluído.',
  invalid_stock_update: 'Atualização de estoque inválida.',
  order_not_found: 'Pedido não encontrado.',
  order_item_not_found: 'Item do pedido não encontrado no catálogo.',
  invalid_order_status: 'Status do pedido inválido.',
  invalid_transition: 'Transição de status inválida para este pedido.',
  order_not_editable: 'Este pedido não pode ser editado. Apenas rascunhos, pendentes, em produção ou prontos podem ser alterados.',
  payment_mismatch: 'Valor total dos pagamentos não corresponde ao total do pedido.',
  insufficient_stock: 'Estoque insuficiente para um ou mais itens.',
  price_table_entry_not_found: 'Entrada de preço não encontrada.',
  cash_register_not_found: 'Registro de caixa não encontrado.',
  no_open_register: 'Nenhum caixa aberto no momento.',
  register_already_open: 'Já existe um caixa aberto. Feche-o antes de abrir outro.',
  invalid_payment_method: 'Método de pagamento inválido.',
};

export function translateError(code: string): string {
  return errorMessages[code] || 'Ocorreu um erro inesperado. Tente novamente.';
}

export function getValidationErrors(err: unknown): string[] {
  if (
    err &&
    typeof err === 'object' &&
    'validation_errors' in err &&
    Array.isArray((err as Record<string, unknown>).validation_errors)
  ) {
    return (err as Record<string, unknown>).validation_errors as string[];
  }
  return [];
}
