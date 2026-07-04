import { useParams, useNavigate } from 'react-router-dom';
import { useOne } from '@refinedev/core';
import { Card, Descriptions, Table, Tag, Button, Space, Typography, Spin, message } from 'antd';
import { ArrowLeft } from 'lucide-react';
import apiClient from '../../providers/rest-client';

const { Title } = Typography;

const statusColors: Record<string, string> = {
  pendente: 'orange',
  em_producao: 'blue',
  pronto: 'green',
  entregue: 'default',
};

const statusLabels: Record<string, string> = {
  pendente: 'Pendente',
  em_producao: 'Em Produção',
  pronto: 'Pronto',
  entregue: 'Entregue',
};

const paymentMethodLabels: Record<string, string> = {
  pix: 'Pix',
  dinheiro: 'Dinheiro',
  credito: 'Crédito',
  debito: 'Débito',
};

const validTransitions: Record<string, string[]> = {
  pendente: ['em_producao', 'pronto'],
  em_producao: ['pronto'],
  pronto: ['entregue'],
  entregue: [],
};

function formatCurrency(value?: number | null): string {
  if (value == null) return '-';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(value?: string | null): string {
  if (!value) return '-';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

interface IOrderItem {
  id: string;
  item_id: string;
  item_type: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface IPayment {
  id: string;
  method: string;
  amount: number;
}

interface IOrder {
  id: string;
  items: IOrderItem[];
  payments: IPayment[];
  total_amount: number;
  status: string;
  notes?: string;
  customer_name?: string;
  created_at: string;
  updated_at: string;
}

export const OrdersShowPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, refetch } = useOne<IOrder>({
    resource: 'orders',
    id,
  });

  const order = data?.data;

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      await apiClient.put(`/orders/${id}/status`, { status: newStatus });
      message.success('Status atualizado com sucesso');
      refetch();
    } catch {
      message.error('Erro ao atualizar status');
    }
  };

  if (isLoading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  if (!order) return <Typography.Text>Pedido não encontrado.</Typography.Text>;

  const nextStatuses = validTransitions[order.status] || [];

  return (
    <div style={{ padding: 24 }}>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeft size={16} />} onClick={() => navigate('/orders')}>
          Voltar
        </Button>
      </Space>
      <Title level={4}>Pedido {order.id.slice(0, 8)}</Title>

      <Card style={{ marginBottom: 16 }}>
        <Descriptions column={2}>
          <Descriptions.Item label="Status">
            <Tag color={statusColors[order.status] || 'default'}>
              {statusLabels[order.status] || order.status}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Total">{formatCurrency(order.total_amount)}</Descriptions.Item>
          <Descriptions.Item label="Cliente">{order.customer_name || '-'}</Descriptions.Item>
          <Descriptions.Item label="Observações">{order.notes || '-'}</Descriptions.Item>
          <Descriptions.Item label="Criado em">{formatDate(order.created_at)}</Descriptions.Item>
          <Descriptions.Item label="Atualizado em">{formatDate(order.updated_at)}</Descriptions.Item>
        </Descriptions>
        {nextStatuses.length > 0 && (
          <Space style={{ marginTop: 16 }}>
            {nextStatuses.includes('em_producao') && (
              <Button type="primary" onClick={() => handleUpdateStatus('em_producao')}>
                Iniciar Produção
              </Button>
            )}
            {nextStatuses.includes('pronto') && (
              <Button type="primary" onClick={() => handleUpdateStatus('pronto')}>
                Marcar como Pronto
              </Button>
            )}
            {nextStatuses.includes('entregue') && (
              <Button type="primary" onClick={() => handleUpdateStatus('entregue')}>
                Confirmar Entrega
              </Button>
            )}
          </Space>
        )}
      </Card>

      <Title level={5}>Itens</Title>
      <Table dataSource={order.items} rowKey="id" pagination={false} style={{ marginBottom: 16 }}>
        <Table.Column dataIndex="item_name" title="Item" />
        <Table.Column
          dataIndex="item_type"
          title="Tipo"
          width={100}
          render={(val: string) => (
            <Tag>{val === 'revenda' ? 'Revenda' : val === 'servico' ? 'Serviço' : val}</Tag>
          )}
        />
        <Table.Column dataIndex="quantity" title="Qtd" width={80} align="center" />
        <Table.Column
          dataIndex="unit_price"
          title="Valor Unit."
          width={130}
          align="right"
          render={(val: number) => formatCurrency(val)}
        />
        <Table.Column
          dataIndex="total_price"
          title="Total"
          width={130}
          align="right"
          render={(val: number) => formatCurrency(val)}
        />
      </Table>

      <Title level={5}>Pagamentos</Title>
      <Table dataSource={order.payments} rowKey="id" pagination={false}>
        <Table.Column
          dataIndex="method"
          title="Método"
          width={120}
          render={(val: string) => paymentMethodLabels[val] || val}
        />
        <Table.Column
          dataIndex="amount"
          title="Valor"
          width={130}
          align="right"
          render={(val: number) => formatCurrency(val)}
        />
      </Table>
    </div>
  );
};
