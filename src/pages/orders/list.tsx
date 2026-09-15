import { useTable, List } from '@refinedev/antd';
import { type CrudFilter } from '@refinedev/core';
import { Table, Tag, Button, Select, DatePicker, Input } from 'antd';
import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  const [searchParams, setSearchParams] = useSearchParams();

  const statusFilter = searchParams.get('status') ?? undefined;
  const hasPrintFilter = searchParams.get('has_print') ?? undefined;
  const clientSearch = searchParams.get('client') ?? '';
  const dateRange = useMemo(() => {
    const s = searchParams.get('start_date');
    const e = searchParams.get('end_date');
    if (s && e) {
      const sd = dayjs(s, 'YYYY-MM-DD');
      const ed = dayjs(e, 'YYYY-MM-DD');
      if (sd.isValid() && ed.isValid() && !sd.isAfter(ed)) return [sd, ed] as [dayjs.Dayjs, dayjs.Dayjs];
    }
    return null;
  }, [searchParams]);

  const { tableProps, setFilters } = useTable<IOrder>({
    resource: 'orders',
    pagination: { current: 1, pageSize: 10, mode: 'server' },
  });

  const applyFilters = (
    status?: string,
    dates?: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null,
    hasPrint?: string,
    client?: string
  ) => {
    const f: CrudFilter[] = [];
    if (status) f.push({ field: 'status', operator: 'eq', value: status });
    if (hasPrint) f.push({ field: 'has_print', operator: 'eq', value: hasPrint });
    if (client) f.push({ field: 'client_search', operator: 'eq', value: client });
    if (dates?.[0]) f.push({ field: 'start_date', operator: 'eq', value: dates[0].startOf('day').toISOString() });
    if (dates?.[1]) f.push({ field: 'end_date', operator: 'eq', value: dates[1].endOf('day').toISOString() });
    setFilters(f, 'replace');
  };

  const updateParams = (updates: Record<string, string | undefined>) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(updates).forEach(([k, v]) => {
        if (v) next.set(k, v);
        else next.delete(k);
      });
      return next;
    }, { replace: true });
  };

  // Estado local para o Input (responsividade de digitação)
  const [clientInput, setClientInput] = useState(clientSearch);

  // Sync quando a URL muda externamente (botão voltar)
  useEffect(() => {
    setClientInput(searchParams.get('client') ?? '');
  }, [searchParams]);

  // Debounce 400ms: escreve na URL após pausa na digitação
  useEffect(() => {
    const timer = setTimeout(() => {
      updateParams({ client: clientInput || undefined });
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientInput]);

  // Aplica filtros na API quando qualquer valor derivado da URL muda
  useEffect(() => {
    applyFilters(statusFilter, dateRange, hasPrintFilter, clientSearch || undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, dateRange, hasPrintFilter, clientSearch]);

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
          onChange={(value) => updateParams({ status: value })}
          style={{ width: 180 }}
          options={statusFilterOptions}
        />
        <Select
          allowClear
          placeholder="Impressão"
          value={hasPrintFilter}
          onChange={(value) => updateParams({ has_print: value })}
          style={{ width: 160 }}
          options={[
            { value: 'true', label: 'Com impressão' },
            { value: 'false', label: 'Sem impressão' },
          ]}
        />
        <DatePicker.RangePicker
          value={dateRange}
          onChange={(dates) => {
            updateParams({
              start_date: dates?.[0]?.format('YYYY-MM-DD'),
              end_date: dates?.[1]?.format('YYYY-MM-DD'),
            });
          }}
          format="DD/MM/YYYY"
          style={{ width: 260 }}
        />
        <Input.Search
          placeholder="Buscar por cliente..."
          allowClear
          style={{ width: 220 }}
          value={clientInput}
          onChange={(e) => setClientInput(e.target.value)}
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
          dataIndex="client_name"
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
