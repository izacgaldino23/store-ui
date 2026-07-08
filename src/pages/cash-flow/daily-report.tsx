import { useState, useEffect } from 'react';
import { Card, Typography, Space, Descriptions, Tag, Spin, Button, Row, Col, Statistic } from 'antd';
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../providers/rest-client';

const { Title, Text } = Typography;

interface IDailyReport {
  register_id: string;
  opened_at: string;
  closed_at?: string;
  starting_balance: number;
  closing_balance?: number;
  total_sales: number;
  total_expenses: number;
  expected_balance: number;
  discrepancy?: number;
  status: string;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDatetime(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

export const DailyReportPage = () => {
  const navigate = useNavigate();
  const [report, setReport] = useState<IDailyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient.get('/cash-register/daily-report')
      .then((res) => {
        setReport(res.data as IDailyReport);
        setError('');
      })
      .catch((err: unknown) => {
        const axiosErr = err as { response?: { status?: number; data?: { message?: string } } };
        setError(axiosErr?.response?.data?.message || 'Nenhum caixa aberto.');
        setReport(null);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 24, textAlign: 'center' }}><Spin size="large" /></div>;

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <Space style={{ marginBottom: 16 }}>
          <Button icon={<ArrowLeft size={16} />} onClick={() => navigate('/')}>Voltar</Button>
        </Space>
        <Title level={4}>Relatório Diário</Title>
        <Card><Text type="secondary">{error}</Text></Card>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeft size={16} />} onClick={() => navigate('/')}>Voltar</Button>
      </Space>
      <Title level={4}>Relatório Diário</Title>

      {report && (
        <>
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Saldo Inicial"
                  value={report.starting_balance}
                  precision={2}
                  prefix={<DollarSign size={18} />}
                  valueStyle={{ fontSize: 20 }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Total de Vendas"
                  value={report.total_sales}
                  precision={2}
                  prefix={<TrendingUp size={18} />}
                  valueStyle={{ color: '#52c41a', fontSize: 20 }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Total de Despesas"
                  value={report.total_expenses}
                  precision={2}
                  prefix={<TrendingDown size={18} />}
                  valueStyle={{ color: '#ff4d4f', fontSize: 20 }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Saldo Esperado"
                  value={report.expected_balance}
                  precision={2}
                  prefix={<DollarSign size={18} />}
                  valueStyle={{ fontSize: 20 }}
                />
              </Card>
            </Col>
          </Row>

          <Card style={{ maxWidth: 600 }}>
            <Descriptions column={2} size="small">
              <Descriptions.Item label="Aberto em">{formatDatetime(report.opened_at)}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={report.status === 'open' ? 'green' : 'default'}>
                  {report.status === 'open' ? 'Aberto' : 'Fechado'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Saldo Inicial">{formatCurrency(report.starting_balance)}</Descriptions.Item>
              <Descriptions.Item label="Total de Vendas">{formatCurrency(report.total_sales)}</Descriptions.Item>
              <Descriptions.Item label="Total de Despesas">{formatCurrency(report.total_expenses)}</Descriptions.Item>
              <Descriptions.Item label="Saldo Esperado">{formatCurrency(report.expected_balance)}</Descriptions.Item>
              {report.closed_at && (
                <Descriptions.Item label="Fechado em">{formatDatetime(report.closed_at)}</Descriptions.Item>
              )}
              {report.closing_balance != null && (
                <Descriptions.Item label="Saldo Final">{formatCurrency(report.closing_balance)}</Descriptions.Item>
              )}
              {report.discrepancy != null && report.discrepancy !== 0 && (
                <Descriptions.Item label="Discrepância" span={2}>
                  <Text type="danger">
                    <AlertTriangle size={14} style={{ marginRight: 4 }} />
                    {formatCurrency(report.discrepancy)}
                  </Text>
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        </>
      )}
    </div>
  );
};
