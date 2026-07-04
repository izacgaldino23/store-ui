import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Table, Button, Input, Select, InputNumber, Space, Typography, message, Divider, Tag, Spin } from 'antd';
import { Plus, Minus, Trash2, ArrowLeft } from 'lucide-react';
import apiClient from '../../providers/rest-client';

const { Title, Text } = Typography;

interface ICatalogItem {
  id: string;
  name: string;
  item_type: string;
  sale_price: number;
  current_stock: number;
}

interface ICartItem {
  item_id: string;
  item_name: string;
  item_type: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface IPayment {
  method: string;
  amount: number;
}

const paymentMethodOptions = [
  { value: 'pix', label: 'Pix' },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'credito', label: 'Crédito' },
  { value: 'debito', label: 'Débito' },
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export const OrdersCreatePage = () => {
  const navigate = useNavigate();

  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<ICatalogItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [cart, setCart] = useState<ICartItem[]>([]);
  const [payments, setPayments] = useState<IPayment[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
  const paymentTotal = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = orderTotal - paymentTotal;

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

  const handleSubmit = async () => {
    if (cart.length === 0) {
      message.warning('Adicione pelo menos um item ao pedido.');
      return;
    }
    if (payments.length === 0) {
      message.warning('Adicione pelo menos uma forma de pagamento.');
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
        payments: payments.map((p) => ({ method: p.method, amount: p.amount })),
        customer_name: customerName || undefined,
        notes: notes || undefined,
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
        <Button icon={<ArrowLeft size={16} />} onClick={() => navigate('/orders')}>
          Voltar
        </Button>
      </Space>
      <Title level={4}>Novo Pedido</Title>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 400 }}>
          <Card size="small" title="Buscar Produtos" style={{ marginBottom: 16 }}>
            <Input.Search
              placeholder="Digite o nome do produto..."
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
              <Text strong>Total: </Text>
              <Text strong style={{ fontSize: 18 }}>
                {formatCurrency(orderTotal)}
              </Text>
            </div>
          </Card>
        </div>

        <div style={{ width: 380 }}>
          <Card size="small" title="Cliente" style={{ marginBottom: 16 }}>
            <Input
              placeholder="Nome do cliente (opcional)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
            <Input.TextArea
              placeholder="Observações (opcional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              style={{ marginTop: 8 }}
            />
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
            disabled={cart.length === 0 || payments.length === 0 || Math.abs(remaining) > 0.01}
          >
            Finalizar Pedido
          </Button>
        </div>
      </div>
    </div>
  );
};
