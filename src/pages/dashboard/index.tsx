import { useState, useEffect } from 'react';
import { Card, Col, Row, Statistic, Typography, Skeleton } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  Wallet,
  ShoppingCart,
  Package,
  TrendingUp,
  TrendingDown,
  PlusCircle,
  List,
  BookOpen,
} from 'lucide-react';
import apiClient from '../../providers/rest-client';

const { Title, Text } = Typography;

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '-';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

interface ICashRegister {
  status: string;
  current_balance?: number;
  starting_balance: number;
}

interface IDailyReport {
  total_sales: number;
  total_expenses: number;
}

export const DashboardPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const [cashRegister, setCashRegister] = useState<ICashRegister | null>(null);
  const [dailyReport, setDailyReport] = useState<IDailyReport | null>(null);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const results = await Promise.allSettled([
        apiClient.get('/cash-register/current'),
        apiClient.get('/cash-register/daily-report'),
        apiClient.get('/orders', { params: { status: 'pendente', limit: 1 } }),
        apiClient.get('/catalog/items/low-stock'),
      ]);

      if (results[0].status === 'fulfilled') {
        setCashRegister(results[0].value.data as ICashRegister);
      }
      if (results[1].status === 'fulfilled') {
        setDailyReport(results[1].value.data as IDailyReport);
      }
      if (results[2].status === 'fulfilled') {
        const data = results[2].value.data as { total?: number };
        setPendingOrdersCount(data.total ?? 0);
      }
      if (results[3].status === 'fulfilled') {
        const data = results[3].value.data;
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

  return (
    <div style={{ padding: 24 }}>
      <Title level={3}>Visão Geral</Title>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <KpiCard
          title="Caixa Atual"
          value={
            cashRegister
              ? `${formatCurrency(cashRegister.current_balance ?? cashRegister.starting_balance)}`
              : 'Caixa fechado'
          }
          prefix={<Wallet size={20} />}
          color={cashRegister?.status === 'open' ? '#6B8E23' : undefined}
          loading={loading}
          onClick={() => navigate('/cash-flow/current')}
        />
        <KpiCard
          title="Pedidos Pendentes"
          value={pendingOrdersCount}
          prefix={<ShoppingCart size={20} />}
          color={pendingOrdersCount > 0 ? '#E879A8' : undefined}
          loading={loading}
          onClick={() => navigate('/orders')}
        />
        <KpiCard
          title="Estoque Baixo"
          value={lowStockCount}
          prefix={<Package size={20} />}
          color={lowStockCount > 0 ? '#faad14' : '#6B8E23'}
          loading={loading}
          onClick={() => navigate('/items')}
        />
        <KpiCard
          title="Vendas Hoje"
          value={dailyReport ? formatCurrency(dailyReport.total_sales) : '-'}
          prefix={<TrendingUp size={20} />}
          color="#6B8E23"
          loading={loading}
        />
        <KpiCard
          title="Despesas Hoje"
          value={dailyReport ? formatCurrency(dailyReport.total_expenses) : '-'}
          prefix={<TrendingDown size={20} />}
          color="#ff4d4f"
          loading={loading}
        />
      </Row>

      <Title level={4}>Atalhos</Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card
            hoverable
            onClick={() => navigate('/orders/create')}
            style={{ textAlign: 'center', height: '100%' }}
          >
            <PlusCircle size={32} style={{ color: '#E879A8', marginBottom: 8 }} />
            <br />
            <Text strong>Novo Pedido</Text>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card
            hoverable
            onClick={() => navigate('/items')}
            style={{ textAlign: 'center', height: '100%' }}
          >
            <List size={32} style={{ color: '#E879A8', marginBottom: 8 }} />
            <br />
            <Text strong>Catálogo</Text>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card
            hoverable
            onClick={() => navigate('/cash-flow/current')}
            style={{ textAlign: 'center', height: '100%' }}
          >
            <BookOpen size={32} style={{ color: '#E879A8', marginBottom: 8 }} />
            <br />
            <Text strong>Abrir Caixa</Text>
          </Card>
        </Col>
      </Row>
    </div>
  );
};
