import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Table, Button, Input, Select, InputNumber, Space, Typography, message, Divider, Tag, Spin, Segmented } from 'antd';
import { Plus, Minus, Trash2, ArrowLeft } from 'lucide-react';
import apiClient from '../../providers/rest-client';
import { useUnsavedOrderGuard } from '../../components/use-unsaved-order-guard';
import { ClientSelect, type ClientSelectValue } from '../../components/client-select';
import { computeDiscountAmount, formatCurrency, paymentMethodOptions } from './constants';
import { PrintsCard } from './prints-card';
import { computePrintUnitPrice, usePrintCatalog } from './print-catalog';
import type { ICatalogItem, ICartItem, IPayment, IPrintLine } from './types';

const { Title, Text } = Typography;

export const OrdersCreatePage = () => {
  const navigate = useNavigate();

  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<ICatalogItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [cart, setCart] = useState<ICartItem[]>([]);
  const [prints, setPrints] = useState<IPrintLine[]>([]);
  const [payments, setPayments] = useState<IPayment[]>([]);
  const [client, setClient] = useState<ClientSelectValue | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [discountType, setDiscountType] = useState<'valor' | 'percentual'>('valor');
  const [discountValue, setDiscountValue] = useState<number>(0);

  const { papers: printPapers, addons: printAddons, loading: printCatalogLoading } =
    usePrintCatalog();

  const [pendingMethod, setPendingMethod] = useState<string | undefined>();
  const [pendingAmount, setPendingAmount] = useState<number>(0);

  useEffect(() => {
    if (!searchText || searchText.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await apiClient.get('/catalog/items', {
          params: { search: searchText, limit: 20 },
        });
        setSearchResults(res.data?.items || []);
      } catch {
        // silent
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  const orderTotal = cart.reduce((sum, item) => sum + item.total_price, 0);
  const printsTotal = prints.reduce((sum, line) => {
    const paper = printPapers.find((p) => p.id === line.print_paper_id);
    if (!paper) return sum;
    const selected = printAddons.filter((a) => line.addon_ids.includes(a.id));
    const unit = computePrintUnitPrice(paper, selected);
    return sum + unit * (line.quantity || 0);
  }, 0);
  const grandTotal = orderTotal + printsTotal;
  const discountAmount = computeDiscountAmount(grandTotal, discountType, discountValue);
  const totalAfterDiscount = grandTotal - discountAmount;
  const paymentTotal = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = totalAfterDiscount - paymentTotal;

  const hasValidPrints = prints.some((p) => p.print_paper_id);
  const isDirty =
    cart.length > 0 ||
    prints.some((p) => p.print_paper_id) ||
    payments.length > 0 ||
    !!client ||
    notes.trim().length > 0 ||
    discountValue > 0;
  const { confirmLeave } = useUnsavedOrderGuard(isDirty);

  const handleBack = async () => {
    if (await confirmLeave()) navigate('/orders');
  };

  const addToCart = (item: ICatalogItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.item_id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.item_id === item.id
            ? { ...i, quantity: i.quantity + 1, total_price: (i.quantity + 1) * i.unit_price }
            : i
        );
      }
      return [
        ...prev,
        {
          item_id: item.id,
          item_name: item.name,
          item_type: item.item_type,
          quantity: 1,
          unit_price: item.sale_price || 0,
          total_price: item.sale_price || 0,
        },
      ];
    });
    setSearchText('');
    setSearchResults([]);
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity < 1) return;
    setCart((prev) =>
      prev.map((i) =>
        i.item_id === itemId ? { ...i, quantity, total_price: quantity * i.unit_price } : i
      )
    );
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((i) => i.item_id !== itemId));
  };

  const addPayment = () => {
    if (!pendingMethod || pendingAmount <= 0) return;
    const amount = Math.round(pendingAmount * 100) / 100;
    setPayments((prev) => [...prev, { method: pendingMethod, amount }]);
    setPendingMethod(undefined);
    setPendingAmount(0);
  };

  const removePayment = (index: number) => {
    setPayments((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePaymentMethodChange = (method: string) => {
    setPendingMethod(method);
    setPendingAmount(Math.max(0, Math.round(remaining * 100) / 100));
  };

  const buildPrintsPayload = () =>
    prints
      .filter((p) => p.print_paper_id)
      .map((p) => ({
        print_paper_id: p.print_paper_id as string,
        description: p.description || undefined,
        quantity: p.quantity,
        addon_ids: p.addon_ids,
      }));

  const buildDiscountPayload = () => ({
    discount_type: discountType,
    discount_value: discountValue,
  });

  const handleSaveDraft = async () => {
    const printsPayload = buildPrintsPayload();
    if (cart.length === 0 && printsPayload.length === 0) {
      message.warning('Adicione pelo menos um item ou impressão ao pedido.');
      return;
    }
    if (discountAmount > grandTotal) {
      message.warning('O desconto não pode ser maior que o total do pedido.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        items: cart.map((i) => ({ item_id: i.item_id, quantity: i.quantity })),
        prints: printsPayload,
        payments: payments.map((p) => ({ method: p.method, amount: p.amount })),
        client_id: client?.id || undefined,
        notes: notes || undefined,
        status: 'rascunho',
        ...buildDiscountPayload(),
      };
      await apiClient.post('/orders', payload);
      message.success('Rascunho salvo com sucesso!');
      navigate('/orders');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      message.error(axiosErr?.response?.data?.message || 'Erro ao salvar rascunho.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    const printsPayload = buildPrintsPayload();
    if (cart.length === 0 && printsPayload.length === 0) {
      message.warning('Adicione pelo menos um item ou impressão ao pedido.');
      return;
    }
    if (payments.length === 0) {
      message.warning('Adicione pelo menos uma forma de pagamento.');
      return;
    }
    if (discountAmount > grandTotal) {
      message.warning('O desconto não pode ser maior que o total do pedido.');
      return;
    }
    if (Math.abs(remaining) > 0.01) {
      message.warning('O total dos pagamentos deve ser igual ao total do pedido.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        items: cart.map((i) => ({ item_id: i.item_id, quantity: i.quantity })),
        prints: printsPayload,
        payments: payments.map((p) => ({ method: p.method, amount: p.amount })),
        client_id: client?.id || undefined,
        notes: notes || undefined,
        ...buildDiscountPayload(),
      };
      await apiClient.post('/orders', payload);
      message.success('Pedido criado com sucesso!');
      navigate('/orders');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      message.error(axiosErr?.response?.data?.message || 'Erro ao criar pedido.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeft size={16} />} onClick={handleBack}>
          Voltar
        </Button>
      </Space>
      <Title level={4}>Novo Pedido</Title>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 400 }}>
          <Card size="small" title="Buscar Produtos" style={{ marginBottom: 16 }}>
            <Input.Search
              placeholder="Buscar por nome ou código de barras..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ marginBottom: 8 }}
            />
            {searching && <Spin size="small" />}
            {searchResults.length > 0 && (
              <Table
                dataSource={searchResults}
                rowKey="id"
                size="small"
                pagination={false}
                onRow={() => ({
                  style: { cursor: 'pointer' },
                })}
              >
                <Table.Column
                  dataIndex="name"
                  title="Nome"
                  ellipsis
                  render={(val: string, record: ICatalogItem) => (
                    <a onClick={() => addToCart(record)}>{val}</a>
                  )}
                />
                <Table.Column
                  dataIndex="sale_price"
                  title="Preço"
                  width={120}
                  align="right"
                  render={(val: number) => formatCurrency(val || 0)}
                />
                <Table.Column
                  dataIndex="current_stock"
                  title="Estoque"
                  width={80}
                  align="center"
                  render={(val: number) => val ?? '-'}
                />
              </Table>
            )}
          </Card>

          <Card
            size="small"
            title={`Carrinho (${cart.length} itens)`}
          >
            {cart.length === 0 ? (
              <Text type="secondary">Nenhum item adicionado.</Text>
            ) : (
              <Table dataSource={cart} rowKey="item_id" size="small" pagination={false}>
                <Table.Column dataIndex="item_name" title="Item" ellipsis />
                <Table.Column
                  dataIndex="item_type"
                  title="Tipo"
                  width={80}
                  render={(val: string) => (
                    <Tag>{val === 'revenda' ? 'Revenda' : val === 'servico' ? 'Serviço' : val}</Tag>
                  )}
                />
                <Table.Column
                  dataIndex="quantity"
                  title="Qtd"
                  width={120}
                  align="center"
                  render={(val: number, record: ICartItem) => (
                    <Space>
                      <Button
                        size="small"
                        icon={<Minus size={12} />}
                        onClick={() => updateQuantity(record.item_id, val - 1)}
                        disabled={val <= 1}
                      />
                      <Text>{val}</Text>
                      <Button
                        size="small"
                        icon={<Plus size={12} />}
                        onClick={() => updateQuantity(record.item_id, val + 1)}
                      />
                    </Space>
                  )}
                />
                <Table.Column
                  dataIndex="unit_price"
                  title="Valor Unit."
                  width={110}
                  align="right"
                  render={(val: number) => formatCurrency(val)}
                />
                <Table.Column
                  dataIndex="total_price"
                  title="Total"
                  width={110}
                  align="right"
                  render={(val: number) => formatCurrency(val)}
                />
                <Table.Column
                  title=""
                  width={50}
                  render={(_, record: ICartItem) => (
                    <Button
                      size="small"
                      danger
                      type="link"
                      icon={<Trash2 size={14} />}
                      onClick={() => removeFromCart(record.item_id)}
                    />
                  )}
                />
              </Table>
            )}
            <Divider />
            <div style={{ textAlign: 'right' }}>
              <Text>Itens: {formatCurrency(orderTotal)}</Text>
              {printsTotal > 0 && (
                <>
                  <br />
                  <Text>Impressões: {formatCurrency(printsTotal)}</Text>
                </>
              )}
              {discountAmount > 0 && (
                <>
                  <br />
                  <Text type="danger">Desconto: -{formatCurrency(discountAmount)}</Text>
                </>
              )}
              <br />
              <Text strong>Total: </Text>
              <Text strong style={{ fontSize: 18 }}>
                {formatCurrency(totalAfterDiscount)}
              </Text>
            </div>
          </Card>

          <PrintsCard
            value={prints}
            onChange={setPrints}
            papers={printPapers}
            addons={printAddons}
            loading={printCatalogLoading}
          />
        </div>

        <div style={{ width: 380 }}>
          <Card size="small" title="Cliente" style={{ marginBottom: 16 }}>
            <ClientSelect value={client} onChange={setClient} />
            <Input.TextArea
              placeholder="Observações (opcional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              style={{ marginTop: 8 }}
            />
          </Card>

          <Card size="small" title="Desconto" style={{ marginBottom: 16 }}>
            <Segmented
              block
              options={[
                { label: 'Valor (R$)', value: 'valor' },
                { label: 'Percentual (%)', value: 'percentual' },
              ]}
              value={discountType}
              onChange={(v) => setDiscountType(v as 'valor' | 'percentual')}
            />
            <InputNumber
              style={{ width: '100%', marginTop: 8 }}
              min={0}
              max={discountType === 'percentual' ? 100 : undefined}
              step={0.01}
              prefix={discountType === 'percentual' ? '%' : 'R$'}
              placeholder={discountType === 'percentual' ? 'Percentual (0-100)' : 'Valor em R$'}
              value={discountValue}
              onChange={(val) => setDiscountValue(val || 0)}
            />
            {discountAmount > 0 && (
              <div style={{ textAlign: 'right', marginTop: 8 }}>
                <Text type="danger">Desconto: -{formatCurrency(discountAmount)}</Text>
              </div>
            )}
          </Card>

          <Card size="small" title="Pagamentos" style={{ marginBottom: 16 }}>
            <Table
              dataSource={payments}
              rowKey={(_, index) => String(index)}
              size="small"
              pagination={false}
            >
              <Table.Column
                dataIndex="method"
                title="Método"
                render={(val: string) =>
                  paymentMethodOptions.find((o) => o.value === val)?.label || val
                }
              />
              <Table.Column
                dataIndex="amount"
                title="Valor"
                width={120}
                align="right"
                render={(val: number) => formatCurrency(val)}
              />
              <Table.Column
                title=""
                width={50}
                render={(_, record: IPayment, index: number) => (
                  <Button
                    size="small"
                    danger
                    type="link"
                    icon={<Trash2 size={14} />}
                    onClick={() => removePayment(index)}
                  />
                )}
              />
            </Table>
            {payments.length > 0 && (
              <div style={{ textAlign: 'right', marginTop: 8 }}>
                <Text>Pago: {formatCurrency(paymentTotal)}</Text>
                <br />
                <Text type={Math.abs(remaining) > 0.01 ? 'danger' : 'success'}>
                  {Math.abs(remaining) > 0.01
                    ? `Restam: ${formatCurrency(remaining)}`
                    : 'Total coberto'}
                </Text>
              </div>
            )}
            <Divider />
            <Space style={{ width: '100%' }}>
              <Select
                placeholder="Método"
                style={{ width: 140 }}
                value={pendingMethod}
                onChange={handlePaymentMethodChange}
                options={paymentMethodOptions}
              />
              <InputNumber
                placeholder="Valor"
                style={{ width: 120 }}
                min={0}
                step={0.01}
                value={pendingAmount}
                onChange={(val) => setPendingAmount(val || 0)}
                prefix="R$"
              />
              <Button
                type="primary"
                icon={<Plus size={14} />}
                onClick={addPayment}
                disabled={!pendingMethod || pendingAmount <= 0}
              >
                Add
              </Button>
            </Space>
          </Card>

          <Button
            type="primary"
            size="large"
            block
            onClick={handleSubmit}
            loading={submitting}
            disabled={
              (!hasValidPrints && cart.length === 0) ||
              payments.length === 0 ||
              Math.abs(remaining) > 0.01
            }
            style={{ marginBottom: 8 }}
          >
            Finalizar Pedido
          </Button>
          <Button
            size="large"
            block
            onClick={handleSaveDraft}
            disabled={!hasValidPrints && cart.length === 0}
          >
            Salvar Rascunho
          </Button>
        </div>
      </div>
    </div>
  );
};
