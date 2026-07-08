import { useState, useEffect } from 'react';
import { Card, Typography, Space, Table, Tag, Button, DatePicker, Spin } from 'antd';
import { ArrowLeft, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../providers/rest-client';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface ICashRegister {
  id: string;
  opened_at: string;
  closed_at?: string;
  starting_balance: number;
  closing_balance?: number;
  status: string;
  notes?: string;
  current_balance?: number;
  discrepancy?: number;
}

interface IHistoryResponse {
  registers: ICashRegister[];
  total: number;
  page: number;
  limit: number;
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

export const CashFlowHistoryPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<IHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const fetchHistory = async (p: number, start?: string, end?: string) => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page: p, limit: 20 };
      if (start) params.start_date = start;
      if (end) params.end_date = end;
      const res = await apiClient.get('/cash-register/history', { params });
      setData(res.data as IHistoryResponse);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(page, startDate, endDate);
  }, [page]);

  const handleDateChange = (_: unknown, dateStrings: [string, string]) => {
    if (dateStrings[0] && dateStrings[1]) {
      const start = new Date(dateStrings[0]).toISOString();
      const end = new Date(dateStrings[1]).toISOString();
      setStartDate(start);
      setEndDate(end);
      setPage(1);
      fetchHistory(1, start, end);
    } else {
      setStartDate('');
      setEndDate('');
      setPage(1);
      fetchHistory(1);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeft size={16} />} onClick={() => navigate('/')}>Voltar</Button>
      </Space>
      <Title level={4}>Histórico de Caixa</Title>

      <Card style={{ marginBottom: 16 }}>
        <Space>
          <RangePicker onChange={handleDateChange} format="DD/MM/YYYY" />
        </Space>
      </Card>

      <Table
        dataSource={data?.registers || []}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          pageSize: 20,
          total: data?.total || 0,
          onChange: (p) => setPage(p),
          showTotal: (total) => `Total: ${total} registro(s)`,
        }}
      >
        <Table.Column
          dataIndex="opened_at"
          title="Abertura"
          width={160}
          render={(val: string) => formatDatetime(val)}
        />
        <Table.Column
          dataIndex="closed_at"
          title="Fechamento"
          width={160}
          render={(val?: string) => val ? formatDatetime(val) : '-'}
        />
        <Table.Column
          dataIndex="starting_balance"
          title="Saldo Inicial"
          width={130}
          align="right"
          render={(val: number) => formatCurrency(val)}
        />
        <Table.Column
          dataIndex="closing_balance"
          title="Saldo Final"
          width={130}
          align="right"
          render={(val?: number) => val != null ? formatCurrency(val) : '-'}
        />
        <Table.Column
          dataIndex="status"
          title="Status"
          width={100}
          render={(val: string) => (
            <Tag color={val === 'open' ? 'green' : 'default'}>
              {val === 'open' ? 'Aberto' : 'Fechado'}
            </Tag>
          )}
        />
        <Table.Column
          dataIndex="discrepancy"
          title="Discrepância"
          width={130}
          align="right"
          render={(val?: number) => {
            if (val == null) return '-';
            return (
              <Text type={val !== 0 ? 'danger' : undefined}>
                {formatCurrency(val)}
              </Text>
            );
          }}
        />
      </Table>
    </div>
  );
};
