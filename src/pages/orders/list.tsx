import { useTable, List } from '@refinedev/antd';
import { type CrudFilter } from '@refinedev/core';
import { Table, Tag, Button, Select, DatePicker } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Plus, Pencil, Printer } from 'lucide-react';
import dayjs from 'dayjs';
import {
  statusColors,
  statusLabels,
  statusFilterOptions,
  formatCurrency,
  formatDate,
} from './constants';
import type { IOrder, IOrderItem, IOrderPrint } from './types';

export const OrdersListPage = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [hasPrintFilter, setHasPrintFilter] = useState<string | undefined>(undefined);

  const { tableProps, setFilters } = useTable<IOrder>({
    resource: 'orders',
    pagination: { current: 1, pageSize: 10, mode: 'server' },
  });

  const applyFilters = (
    status?: string,
    dates?: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null,
    hasPrint?: string
  ) => {
    const f: CrudFilter[] = [];
    if (status) f.push({ field: 'status', operator: 'eq', value: status });
    if (hasPrint) f.push({ field: 'has_print', operator: 'eq', value: hasPrint });
    if (dates?.[0]) f.push({ field: 'start_date', operator: 'eq', value: dates[0].startOf('day').toISOString() });
    if (dates?.[1]) f.push({ field: 'end_date', operator: 'eq', value: dates[1].endOf('day').toISOString() });
    setFilters(f, 'replace');
  };

  return (
    <List
      headerProps={{
        extra: (
          <Button type="primary" icon={<Plus size={16} />} onClick={() => navigate('/orders/create')}>
            Criar Pedido
          </Button>
        ),
      }}
    >
      <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        <Select
          allowClear
          placeholder="Filtrar por status"
          value={statusFilter}
          onChange={(value) => {
            setStatusFilter(value);
            applyFilters(value, dateRange, hasPrintFilter);
          }}
          style={{ width: 180 }}
          options={statusFilterOptions}
        />
        <Select
          allowClear
          placeholder="Impressão"
          value={hasPrintFilter}
          onChange={(value) => {
            setHasPrintFilter(value);
            applyFilters(statusFilter, dateRange, value);
          }}
          style={{ width: 160 }}
          options={[
            { value: 'true', label: 'Com impressão' },
            { value: 'false', label: 'Sem impressão' },
          ]}
        />
        <DatePicker.RangePicker
          value={dateRange}
          onChange={(dates) => {
            setDateRange(dates as [dayjs.Dayjs | null, dayjs.Dayjs | null] | null);
            applyFilters(
              statusFilter,
              dates as [dayjs.Dayjs | null, dayjs.Dayjs | null] | null,
              hasPrintFilter
            );
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
          dataIndex="prints"
          title={<Printer size={14} />}
          width={60}
          align="center"
          render={(prints: IOrderPrint[] | undefined) =>
            prints && prints.length > 0 ? (
              <span title={`${prints.length} impressão(ões)`}>
                <Printer size={16} />
              </span>
            ) : (
              '-'
            )
          }
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
          width={140}
          render={(_, record: IOrder) => (
            <>
              <Button
                type="link"
                title="Visualizar"
                onClick={() => navigate(`/orders/${record.id}`)}
              >
                <Eye size={16} />
              </Button>
              {!['entregue', 'cancelado'].includes(record.status) && (
                <Button
                  type="link"
                  title="Editar"
                  onClick={() => navigate(`/orders/${record.id}/edit`)}
                >
                  <Pencil size={16} />
                </Button>
              )}
            </>
          )}
        />
      </Table>
    </List>
  );
};
