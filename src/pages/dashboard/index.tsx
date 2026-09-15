import { useState, useEffect } from 'react';
import { Card, Col, Row, Statistic, Typography, Skeleton, Table, Tag, List as AntList, message } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Clock,
  Printer,
  CheckCircle2,
  Truck,
  Package,
  PlusCircle,
  List,
  Users,
  Wallet,
  ShoppingCart,
  TrendingUp,
  Ticket,
} from 'lucide-react';
import apiClient from '../../providers/rest-client';
import { statusColors, statusLabels, formatDate } from '../orders/constants';

const { Title, Text } = Typography;

interface IStatusCount {
  status: string;
  count: number;
}

interface IOrdersSummary {
  total_revenue?: number;
  orders_count?: number;
  avg_ticket?: number;
  total_discount?: number;
}

// Campos opcionais: a API retorna code/customer_name (verificado); o tipo IOrder do UI usa client_name.
interface IOrderRow {
  id: string;
  code?: string;
  customer_name?: string;
  client_name?: string;
  total_amount?: number;
  status: string;
  created_at?: string;
}

interface IProductRank {
  item_id: string;
  item_name: string;
  quantity: number;
  revenue: number;
}

const STATUS_DISPLAY: Record<string, { label: string; icon: React.ReactNode }> = {
  rascunho: { label: 'Rascunhos', icon: <FileText size={20} /> },
  pendente: { label: 'Pendentes', icon: <Clock size={20} /> },
  em_producao: { label: 'Em Produção', icon: <Printer size={20} /> },
  pronto: { label: 'Prontos', icon: <CheckCircle2 size={20} /> },
  entregue: { label: 'Entregues', icon: <Truck size={20} /> },
};

const formatBRL = (value?: number): string =>
  (value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const pad = (n: number) => String(n).padStart(2, '0');

// Converte uma data local para RFC3339 com o offset local do navegador (formato aceito pelos /reports).
const toRFC3339 = (d: Dayjs, endOfDay = false): string => {
  const date = d.toDate();
  if (endOfDay) date.setHours(23, 59, 59, 999);
  else date.setHours(0, 0, 0, 0);
  const tzo = -date.getTimezoneOffset();
  const sign = tzo >= 0 ? '+' : '-';
  const off = `${sign}${pad(Math.floor(Math.abs(tzo) / 60))}:${pad(Math.abs(tzo) % 60)}`;
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}:${pad(date.getSeconds())}${off}`;
};

export const DashboardPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [statusCounts, setStatusCounts] = useState<IStatusCount[]>([]);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [summary, setSummary] = useState<IOrdersSummary | null>(null);
  const [recentOrders, setRecentOrders] = useState<IOrderRow[]>([]);
  const [bestSellers, setBestSellers] = useState<IProductRank[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const todayStart = toRFC3339(dayjs());
      const todayEnd = toRFC3339(dayjs(), true);
      const monthStart = toRFC3339(dayjs().startOf('month'));
      try {
        const results = await Promise.allSettled([
          apiClient.get('/reports/orders/status-counts'),
          apiClient.get('/catalog/items/low-stock'),
          apiClient.get('/reports/orders/summary', { params: { start: todayStart, end: todayEnd } }),
          apiClient.get('/orders', { params: { limit: 5 } }),
          apiClient.get('/reports/products', { params: { start: monthStart, end: todayEnd, limit: 5 } }),
        ]);

        if (results[0].status === 'fulfilled') {
          const data = results[0].value.data as { counts?: IStatusCount[] };
          setStatusCounts(data.counts ?? []);
        }
        if (results[1].status === 'fulfilled') {
          const data = results[1].value.data;
          const items = Array.isArray(data) ? data : (data as { items?: unknown[] }).items ?? [];
          setLowStockCount(items.length);
        }
        if (results[2].status === 'fulfilled') {
          setSummary(results[2].value.data as IOrdersSummary);
        }
        if (results[3].status === 'fulfilled') {
          const data = results[3].value.data as { orders?: IOrderRow[] };
          setRecentOrders(data.orders ?? []);
        }
        if (results[4].status === 'fulfilled') {
          const data = results[4].value.data as { best_sellers?: IProductRank[] };
          setBestSellers(data.best_sellers ?? []);
        }
      } catch {
        message.error('Não foi possível carregar o dashboard.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const KpiCard = ({
    title,
    value,
    prefix,
    color,
    loading: cardLoading,
    onClick,
  }: {
    title: string;
    value: string | number;
    prefix: React.ReactNode;
    color?: string;
    loading?: boolean;
    onClick?: () => void;
  }) => (
    <Col xs={24} sm={12} md={8} lg={6}>
      <Card hoverable={!!onClick} onClick={onClick} style={{ height: '100%' }}>
        {cardLoading ? (
          <Skeleton active paragraph={{ rows: 1 }} />
        ) : (
          <Statistic
            title={title}
            value={value}
            prefix={prefix}
            valueStyle={{ color, fontSize: 22 }}
          />
        )}
      </Card>
    </Col>
  );

  const visibleStatuses = statusCounts.filter((sc) => sc.status !== 'cancelado');

  return (
    <div style={{ padding: 24 }}>
      <Title level={3}>Visão Geral</Title>

      {/* Linha 1: KPIs de Hoje */}
      <Row gutter={[16, 16]}>
        <KpiCard
          title="Faturamento Hoje"
          value={formatBRL(summary?.total_revenue)}
          prefix={<Wallet size={20} />}
          color="#3f8600"
          loading={loading}
        />
        <KpiCard
          title="Pedidos Hoje"
          value={summary?.orders_count ?? 0}
          prefix={<ShoppingCart size={20} />}
          loading={loading}
        />
        <KpiCard
          title="Ticket Médio"
          value={formatBRL(summary?.avg_ticket)}
          prefix={<TrendingUp size={20} />}
          loading={loading}
        />
        <KpiCard
          title="Descontos"
          value={formatBRL(summary?.total_discount)}
          prefix={<Ticket size={20} />}
          color="#cf1322"
          loading={loading}
        />
      </Row>

      {/* Linha 2: status cards + Estoque Baixo (inalterado) */}
      <Row gutter={[16, 16]}>
        {(visibleStatuses.length > 0
          ? visibleStatuses
          : [{ status: 'pendente', count: 0 }]
        ).map((sc) => {
          const display = STATUS_DISPLAY[sc.status] ?? { label: sc.status, icon: <List size={20} /> };
          return (
            <KpiCard
              key={sc.status}
              title={display.label}
              value={sc.count}
              prefix={display.icon}
              loading={loading}
              onClick={() => navigate(`/orders?status=${sc.status}`)}
            />
          );
        })}
        <KpiCard
          title="Estoque Baixo"
          value={lowStockCount}
          prefix={<Package size={20} />}
          color={lowStockCount > 0 ? '#faad14' : '#6B8E23'}
          loading={loading}
          onClick={() => navigate('/items?tab=low-stock')}
        />
      </Row>

      {/* Linha 3: Pedidos Recentes (2/3) + Mais Vendidos do Mês (1/3) */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="Pedidos Recentes" style={{ height: '100%' }}>
            {loading ? (
              <Skeleton active paragraph={{ rows: 5 }} />
            ) : (
              <Table
                rowKey="id"
                dataSource={recentOrders}
                size="small"
                pagination={false}
                onRow={(record) => ({
                  onClick: () => navigate(`/orders/${record.id}`),
                  style: { cursor: 'pointer' },
                })}
              >
                <Table.Column
                  title="Código"
                  dataIndex="code"
                  key="code"
                  width={110}
                  render={(_, record: IOrderRow) => record.code ?? record.id.slice(0, 8)}
                />
                <Table.Column
                  title="Cliente"
                  dataIndex="customer_name"
                  key="customer_name"
                  render={(_, record: IOrderRow) => record.customer_name ?? record.client_name ?? '-'}
                />
                <Table.Column
                  title="Total"
                  dataIndex="total_amount"
                  key="total_amount"
                  align="right"
                  render={(value?: number) => (value == null ? '-' : formatBRL(value))}
                />
                <Table.Column
                  title="Status"
                  dataIndex="status"
                  key="status"
                  render={(status: string) => (
                    <Tag color={statusColors[status] || 'default'}>{statusLabels[status] || status}</Tag>
                  )}
                />
                <Table.Column
                  title="Data"
                  dataIndex="created_at"
                  key="created_at"
                  render={(value?: string) => formatDate(value)}
                />
              </Table>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Mais Vendidos do Mês" style={{ height: '100%' }}>
            {loading ? (
              <Skeleton active paragraph={{ rows: 5 }} />
            ) : (
              <AntList
                size="small"
                dataSource={bestSellers}
                locale={{ emptyText: 'Nenhum produto vendido no mês.' }}
                renderItem={(item, index) => (
                  <AntList.Item style={{ padding: '8px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: 8 }}>
                      <Text ellipsis style={{ flex: 1 }}>
                        {index + 1}. {item.item_name}
                      </Text>
                      <Text type="secondary">x{item.quantity}</Text>
                      <Text strong>{formatBRL(item.revenue)}</Text>
                    </div>
                  </AntList.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* Linha 4: Atalhos (inalterado) */}
      <Title level={4}>Atalhos</Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={6}>
          <Card
            hoverable
            onClick={() => navigate('/orders/create')}
            style={{ textAlign: 'center', height: '100%' }}
          >
            <PlusCircle size={32} style={{ color: '#6B8E23', marginBottom: 8 }} />
            <br />
            <Text strong>Novo Pedido</Text>
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card
            hoverable
            onClick={() => navigate('/orders')}
            style={{ textAlign: 'center', height: '100%' }}
          >
            <List size={32} style={{ color: '#6B8E23', marginBottom: 8 }} />
            <br />
            <Text strong>Pedidos</Text>
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card
            hoverable
            onClick={() => navigate('/items')}
            style={{ textAlign: 'center', height: '100%' }}
          >
            <Package size={32} style={{ color: '#6B8E23', marginBottom: 8 }} />
            <br />
            <Text strong>Produtos</Text>
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card
            hoverable
            onClick={() => navigate('/clients')}
            style={{ textAlign: 'center', height: '100%' }}
          >
            <Users size={32} style={{ color: '#6B8E23', marginBottom: 8 }} />
            <br />
            <Text strong>Clientes</Text>
          </Card>
        </Col>
      </Row>
    </div>
  );
};