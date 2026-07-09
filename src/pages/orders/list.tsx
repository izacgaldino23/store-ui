import { useTable, List } from '@refinedev/antd';
import { type CrudFilter } from '@refinedev/core';
import { Table, Tag, Button, Select, DatePicker } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye } from 'lucide-react';
import dayjs from 'dayjs';

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

export const OrdersListPage = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);

  const { tableProps, setFilters } = useTable<IOrder>({
    resource: 'orders',
    pagination: { current: 1, pageSize: 10, mode: 'server' },
  });

  const applyFilters = (status?: string, dates?: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null) => {
    const f: CrudFilter[] = [];
    if (status) f.push({ field: 'status', operator: 'eq', value: status });
    if (dates?.[0]) f.push({ field: 'start_date', operator: 'eq', value: dates[0].startOf('day').toISOString() });
    if (dates?.[1]) f.push({ field: 'end_date', operator: 'eq', value: dates[1].endOf('day').toISOString() });
    setFilters(f, 'replace');
  };

  return (
    <List>
      <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        <Select
          allowClear
          placeholder="Filtrar por status"
          value={statusFilter}
          onChange={(value) => {
            setStatusFilter(value);
            applyFilters(value, dateRange);
          }}
          style={{ width: 180 }}
          options={[
            { value: 'pendente', label: 'Pendente' },
            { value: 'em_producao', label: 'Em Produção' },
            { value: 'pronto', label: 'Pronto' },
            { value: 'entregue', label: 'Entregue' },
          ]}
        />
        <DatePicker.RangePicker
          value={dateRange}
          onChange={(dates) => {
            setDateRange(dates as [dayjs.Dayjs | null, dayjs.Dayjs | null] | null);
            applyFilters(statusFilter, dates as [dayjs.Dayjs | null, dayjs.Dayjs | null] | null);
          }}
          format="DD/MM/YYYY"
          style={{ width: 260 }}
        />
      </div>
      <Table
        {...tableProps}
        rowKey="id"
        scroll={{ x: 'max-content' }}
        pagination={{
          ...tableProps.pagination,
          showSizeChanger: true,
          showTotal: (total) => `Total: ${total} pedidos`,
        }}
      >
        <Table.Column
          dataIndex="id"
          title="ID"
          width={100}
          render={(id: string) => id.slice(0, 8) + '...'}
        />
        <Table.Column
          dataIndex="customer_name"
          title="Cliente"
          render={(val: string | undefined) => val || '-'}
        />
        <Table.Column
          dataIndex="items"
          title="Itens"
          width={80}
          align="center"
          render={(items: IOrderItem[]) => items?.length || 0}
        />
        <Table.Column
          dataIndex="total_amount"
          title="Total"
          width={130}
          align="right"
          render={(val: number | undefined | null) => formatCurrency(val)}
        />
        <Table.Column
          dataIndex="status"
          title="Status"
          width={140}
          render={(status: string) => (
            <Tag color={statusColors[status] || 'default'}>
              {statusLabels[status] || status}
            </Tag>
          )}
        />
        <Table.Column
          dataIndex="created_at"
          title="Criado em"
          width={160}
          render={(val: string) => formatDate(val)}
        />
        <Table.Column
          title="Ações"
          key="actions"
          width={100}
          render={(_, record: IOrder) => (
            <Button
              type="link"
              title="Visualizar"
              onClick={() => navigate(`/orders/${record.id}`)}
            >
              <Eye size={16} />
            </Button>
          )}
        />
      </Table>
    </List>
  );
};
