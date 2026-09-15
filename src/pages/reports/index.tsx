import { useState, useEffect } from 'react';
import { Card, Col, Row, Statistic, Typography, Skeleton, Tabs, Table, DatePicker, Segmented, message } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import {
  BarChart3,
  Crown,
  ShoppingCart,
  Ticket,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import apiClient from '../../providers/rest-client';

const { Title } = Typography;

const formatBRL = (value: number): string =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const pad = (n: number) => String(n).padStart(2, '0');

// Converte uma data local para RFC3339 com o offset local do navegador (formato aceito pelo /reports).
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

// Semana comercial brasileira começa na segunda-feira. O app não configura locale
// pt-br no dayjs (verificado em src/index.tsx), então startOf('week') usaria domingo.
// Calculamos a segunda-feira da semana corrente explicitamente.
const startOfWeek = (d: Dayjs): Dayjs => {
  const daysSinceMonday = (d.day() + 6) % 7; // day(): 0=Dom ... 6=Sáb
  return d.subtract(daysSinceMonday, 'day').startOf('day');
};

const PRESET_OPTIONS = ['Diário', 'Semanal', 'Mensal', 'Anual', 'Personalizado'];

interface IOrdersSummary {
  total_revenue: number;
  orders_count: number;
  avg_ticket: number;
  total_discount: number;
  daily: IDailyRevenue[];
  status_counts: IStatusCount[];
}

interface IDailyRevenue {
  date: string;
  revenue: number;
  orders: number;
}

interface IStatusCount {
  status: string;
  count: number;
}

interface IProductsReport {
  best_sellers: IProductRank[];
  highest_margin: IProductRank[];
  highest_discount: IProductRank[];
}

interface IProductRank {
  item_id: string;
  item_name: string;
  quantity: number;
  revenue: number;
  cost_price?: number;
  margin?: number;
  margin_percent?: number;
  total_discount?: number;
}

const STATUS_LABELS: Record<string, string> = {
  rascunho: 'Rascunho',
  pendente: 'Pendente',
  em_producao: 'Em Produção',
  pronto: 'Pronto',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
};

export const ReportsPage = () => {
  const [loading, setLoading] = useState(true);
  const [preset, setPreset] = useState('Mensal');
  const [range, setRange] = useState<[Dayjs, Dayjs]>([dayjs().startOf('month'), dayjs().endOf('day')]);
  const [summary, setSummary] = useState<IOrdersSummary | null>(null);
  const [products, setProducts] = useState<IProductsReport | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [start, end] = range;
      const params = {
        start: toRFC3339(start),
        end: toRFC3339(end, true),
      };
      try {
        const results = await Promise.allSettled([
          apiClient.get('/reports/products', { params: { ...params, limit: 10 } }),
          apiClient.get('/reports/orders/summary', { params }),
        ]);
        if (results[0].status === 'fulfilled') {
          setProducts(results[0].value.data as IProductsReport);
        }
        if (results[1].status === 'fulfilled') {
          setSummary(results[1].value.data as IOrdersSummary);
        }
      } catch {
        message.error('Não foi possível carregar os relatórios.');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [range]);

  const handlePresetChange = (value: string | number) => {
    const key = String(value);
    setPreset(key);
    if (key === 'Personalizado') return; // mantém o intervalo atual
    const today = dayjs();
    const ranges: Record<string, [Dayjs, Dayjs]> = {
      Diário: [today.startOf('day'), today.endOf('day')],
      Semanal: [startOfWeek(today), today.endOf('day')],
      Mensal: [today.startOf('month'), today.endOf('day')],
      Anual: [today.startOf('year'), today.endOf('day')],
    };
    setRange(ranges[key]);
  };

  const summaryColumns = [
    {
      title: 'Data',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: 'Faturamento',
      dataIndex: 'revenue',
      key: 'revenue',
      align: 'right' as const,
      render: (value: number) => formatBRL(value),
    },
    {
      title: 'Pedidos',
      dataIndex: 'orders',
      key: 'orders',
      align: 'right' as const,
    },
  ];

  const statusColumns = [
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => STATUS_LABELS[status] ?? status,
    },
    {
      title: 'Quantidade',
      dataIndex: 'count',
      key: 'count',
      align: 'right' as const,
    },
  ];

  const productColumns = (
    extra: Array<{ title: string; dataIndex?: string; key?: string; render?: (v: number) => string; align?: 'right' }> = []
  ) => [
    {
      title: 'Produto',
      dataIndex: 'item_name',
      key: 'item_name',
    },
    {
      title: 'Qtd',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'right' as const,
    },
    {
      title: 'Receita',
      dataIndex: 'revenue',
      key: 'revenue',
      align: 'right' as const,
      render: (value: number) => formatBRL(value),
    },
    ...extra,
  ];

  const renderProductSection = (
    title: string,
    icon: React.ReactNode,
    data: IProductRank[] | undefined,
    extraColumns: Array<{ title: string; dataIndex?: string; key?: string; render?: (v: number) => string }> = []
  ) => (
    <Card title={title} style={{ marginBottom: 16 }}>
      <Table
        rowKey={(record) => record.item_id}
        dataSource={data ?? []}
        columns={productColumns(extraColumns)}
        size="small"
        pagination={false}
      />
    </Card>
  );

  return (
    <div style={{ padding: 24 }}>
      <Title level={3}>
        <BarChart3 size={24} style={{ marginRight: 8 }} />
        Relatórios
      </Title>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 16 }}>
          <Segmented
            options={PRESET_OPTIONS}
            value={preset}
            onChange={handlePresetChange}
          />
        </div>
        <DatePicker.RangePicker
          format="DD/MM/YYYY"
          value={range}
          disabled={preset !== 'Personalizado'}
          onChange={(dates) => {
            if (dates && dates[0] && dates[1]) {
              setPreset('Personalizado');
              setRange([dates[0], dates[1]]);
            }
          }}
          style={{ width: 320 }}
        />
      </Card>

      {loading ? (
        <Skeleton active />
      ) : (
        <Tabs
          defaultActiveKey="orders"
          items={[
            {
              key: 'orders',
              label: 'Pedidos',
              children: (
                <>
                  <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} md={6}>
                      <Card>
                        <Statistic
                          title="Faturamento"
                          value={summary?.total_revenue ?? 0}
                          prefix={<Wallet size={20} />}
                          formatter={(value) => formatBRL(Number(value))}
                        />
                      </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                      <Card>
                        <Statistic
                          title="Pedidos"
                          value={summary?.orders_count ?? 0}
                          prefix={<ShoppingCart size={20} />}
                        />
                      </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                      <Card>
                        <Statistic
                          title="Ticket Médio"
                          value={summary?.avg_ticket ?? 0}
                          prefix={<TrendingUp size={20} />}
                          formatter={(value) => formatBRL(Number(value))}
                        />
                      </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                      <Card>
                        <Statistic
                          title="Descontos"
                          value={summary?.total_discount ?? 0}
                          prefix={<Ticket size={20} />}
                          formatter={(value) => formatBRL(Number(value))}
                        />
                      </Card>
                    </Col>
                  </Row>

                  <Card title="Faturamento Diário" style={{ marginTop: 16 }}>
                    <Table
                      rowKey={(record) => record.date}
                      dataSource={summary?.daily ?? []}
                      columns={summaryColumns}
                      size="small"
                      pagination={{ pageSize: 15 }}
                    />
                  </Card>

                  <Card title="Pedidos por Status" style={{ marginTop: 16 }}>
                    <Table
                      rowKey={(record) => record.status}
                      dataSource={summary?.status_counts ?? []}
                      columns={statusColumns}
                      size="small"
                      pagination={false}
                    />
                  </Card>
                </>
              ),
            },
            {
              key: 'products',
              label: 'Produtos',
              children: (
                <>
                  {renderProductSection(
                    'Mais Vendidos',
                    <Crown size={20} />,
                    products?.best_sellers,
                    [{ title: 'Unidades', dataIndex: 'quantity', key: 'quantity', render: (value) => String(value) }]
                  )}
                  {renderProductSection(
                    'Maior Margem',
                    <TrendingUp size={20} />,
                    products?.highest_margin,
                    [{ title: 'Margem', dataIndex: 'margin_percent', key: 'margin_percent', render: (value) => `${Number(value ?? 0).toFixed(1)}%` }]
                  )}
                  {renderProductSection(
                    'Maior Desconto',
                    <Ticket size={20} />,
                    products?.highest_discount,
                    [{ title: 'Desconto Total', dataIndex: 'total_discount', key: 'total_discount', render: (value) => formatBRL(Number(value ?? 0)) }]
                  )}
                </>
              ),
            },
          ]}
        />
      )}
    </div>
  );
};

export default ReportsPage;
