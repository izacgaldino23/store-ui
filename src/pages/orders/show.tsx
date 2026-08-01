import { useParams, useNavigate } from 'react-router-dom';
import { useOne } from '@refinedev/core';
import { Card, Descriptions, Table, Tag, Button, Space, Typography, Spin, message, Modal, Input } from 'antd';
import { ArrowLeft, Pencil, XCircle } from 'lucide-react';
import apiClient from '../../providers/rest-client';
import {
  statusColors,
  statusLabels,
  paymentMethodLabels,
  validTransitions,
  formatCurrency,
  formatDate,
} from './constants';
import type { IOrder } from './types';

const { Title } = Typography;

const okTextMap: Record<string, string> = {
  pendente: 'Confirmar Pendente',
  em_producao: 'Iniciar Produção',
  pronto: 'Marcar como Pronto',
  entregue: 'Confirmar Entrega',
};

const editableStatuses = ['rascunho', 'pendente', 'em_producao', 'pronto'];

export const OrdersShowPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, refetch } = useOne<IOrder>({
    resource: 'orders',
    id,
  });

  const order = data?.data;

  const confirmStatusChange = (newStatus: string) => {
    Modal.confirm({
      title: 'Confirmar alteração de status',
      content: `Tem certeza que deseja alterar o status para "${statusLabels[newStatus]}"?`,
      okText: okTextMap[newStatus] || 'Confirmar',
      cancelText: 'Cancelar',
      onOk: () => handleUpdateStatus(newStatus),
    });
  };

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      await apiClient.put(`/orders/${id}/status`, { status: newStatus });
      message.success('Status atualizado com sucesso');
      refetch();
    } catch (err: unknown) {
      const axiosErr = err as { message?: string };
      message.error(axiosErr?.message || 'Erro ao atualizar status');
    }
  };

  const confirmCancel = () => {
    let reason = '';
    Modal.confirm({
      title: 'Cancelar pedido',
      content: (
        <div>
          <Typography.Paragraph type="secondary">
            Tem certeza que deseja cancelar este pedido?
          </Typography.Paragraph>
          <Input.TextArea
            placeholder="Motivo do cancelamento (opcional)"
            rows={2}
            onChange={(e) => {
              reason = e.target.value;
            }}
          />
        </div>
      ),
      okText: 'Cancelar Pedido',
      okButtonProps: { danger: true },
      cancelText: 'Voltar',
      onOk: () => handleCancelOrder(reason),
    });
  };

  const handleCancelOrder = async (reason?: string) => {
    try {
      await apiClient.post(`/orders/${id}/cancel`, { reason: reason || undefined });
      message.success('Pedido cancelado com sucesso');
      refetch();
    } catch (err: unknown) {
      const axiosErr = err as { message?: string };
      message.error(axiosErr?.message || 'Erro ao cancelar pedido');
    }
  };

  if (isLoading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  if (!order) return <Typography.Text>Pedido não encontrado.</Typography.Text>;

  const nextStatuses = validTransitions[order.status] || [];
  const canEdit = editableStatuses.includes(order.status);
  const canCancel = order.status !== 'cancelado';

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
          {order.status === 'cancelado' && (
            <>
              <Descriptions.Item label="Motivo do cancelamento">
                {order.cancel_reason || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Cancelado em">
                {formatDate(order.canceled_at || order.updated_at)}
              </Descriptions.Item>
            </>
          )}
        </Descriptions>
        <Space style={{ marginTop: 16 }}>
          {nextStatuses.includes('pendente') && (
            <Button type="primary" onClick={() => confirmStatusChange('pendente')}>
              Marcar como Pendente
            </Button>
          )}
          {nextStatuses.includes('em_producao') && (
            <Button type="primary" onClick={() => confirmStatusChange('em_producao')}>
              Iniciar Produção
            </Button>
          )}
          {nextStatuses.includes('pronto') && (
            <Button type="primary" onClick={() => confirmStatusChange('pronto')}>
              Marcar como Pronto
            </Button>
          )}
          {nextStatuses.includes('entregue') && (
            <Button type="primary" onClick={() => confirmStatusChange('entregue')}>
              Confirmar Entrega
            </Button>
          )}
          {canEdit && (
            <Button icon={<Pencil size={16} />} onClick={() => navigate(`/orders/${order.id}/edit`)}>
              Editar Pedido
            </Button>
          )}
          {canCancel && (
            <Button danger icon={<XCircle size={16} />} onClick={confirmCancel}>
              Cancelar Pedido
            </Button>
          )}
        </Space>
      </Card>

      <Title level={5}>Itens</Title>
      <Table dataSource={order.items} rowKey="id" pagination={false} scroll={{ x: 'max-content' }} style={{ marginBottom: 16 }}>
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
      <Table dataSource={order.payments} rowKey="id" pagination={false} scroll={{ x: 'max-content' }}>
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
