import { useState, useEffect } from 'react';
import { Card, Col, Row, Statistic, Typography, Skeleton } from 'antd';
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
} from 'lucide-react';
import apiClient from '../../providers/rest-client';

const { Title, Text } = Typography;

interface IStatusCount {
  status: string;
  count: number;
}

const STATUS_DISPLAY: Record<string, { label: string; icon: React.ReactNode }> = {
  rascunho: { label: 'Rascunhos', icon: <FileText size={20} /> },
  pendente: { label: 'Pendentes', icon: <Clock size={20} /> },
  em_producao: { label: 'Em Produção', icon: <Printer size={20} /> },
  pronto: { label: 'Prontos', icon: <CheckCircle2 size={20} /> },
  entregue: { label: 'Entregues', icon: <Truck size={20} /> },
};

export const DashboardPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [statusCounts, setStatusCounts] = useState<IStatusCount[]>([]);
  const [lowStockCount, setLowStockCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const results = await Promise.allSettled([
        apiClient.get('/reports/orders/status-counts'),
        apiClient.get('/catalog/items/low-stock'),
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
      setLoading(false);
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
