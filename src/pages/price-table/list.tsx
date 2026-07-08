import { useTable, List } from '@refinedev/antd';
import { useDelete, useInvalidate } from '@refinedev/core';
import { Table, Space, Button, Tag, Modal, Input, Select, message } from 'antd';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface IPriceEntry {
  id: string;
  paper_type: string;
  min_quantity: number;
  max_quantity: number;
  unit_price: number;
  description?: string;
  active: boolean;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

const paperTypeLabels: Record<string, string> = {
  A4: 'A4',
  A3: 'A3',
  fotografico: 'Fotográfico',
  cartao: 'Cartão',
  adesivo: 'Adesivo',
};

const paperTypeOptions = Object.entries(paperTypeLabels).map(([value, label]) => ({
  value,
  label,
}));

export const PriceTableListPage = () => {
  const [paperTypeFilter, setPaperTypeFilter] = useState<string | undefined>();
  const { mutate: deleteMutate } = useDelete();
  const invalidate = useInvalidate();
  const navigate = useNavigate();

  const { tableProps, setFilters, setCurrent } = useTable<IPriceEntry>({
    resource: 'price-table',
    pagination: { current: 1, pageSize: 10, mode: 'server' },
  });

  const applyFilters = (paperType?: string) => {
    setCurrent(1);
    if (paperType) {
      setFilters([{ field: 'paper_type', operator: 'eq', value: paperType }], 'replace');
    } else {
      setFilters([], 'replace');
    }
  };

  const handleDelete = (record: IPriceEntry) => {
    Modal.confirm({
      title: 'Confirmar exclusão',
      content: `Tem certeza que deseja excluir a entrada para "${record.paper_type}"?`,
      okText: 'Excluir',
      cancelText: 'Cancelar',
      okButtonProps: { danger: true },
      onOk: () => {
        deleteMutate(
          { resource: 'price-table', id: record.id },
          {
            onSuccess: () => {
              invalidate({ resource: 'price-table', invalidates: ['list'] });
              message.success('Entrada excluída com sucesso.');
            },
          }
        );
      },
    });
  };

  return (
    <List
      headerButtons={() => (
        <Button type="primary" icon={<Plus size={16} />} onClick={() => navigate('/pricing/table/create')}>
          Criar
        </Button>
      )}
    >
      <div style={{ marginBottom: 16 }}>
        <Select
          allowClear
          placeholder="Filtrar por tipo de papel"
          value={paperTypeFilter}
          onChange={(value) => {
            setPaperTypeFilter(value);
            applyFilters(value);
          }}
          style={{ width: 250 }}
          options={paperTypeOptions}
        />
      </div>
      <Table
        {...tableProps}
        rowKey="id"
        pagination={{
          ...tableProps.pagination,
          showSizeChanger: true,
          showTotal: (total) => `Total: ${total} entrada(s)`,
        }}
      >
        <Table.Column dataIndex="paper_type" title="Tipo de Papel" width={150} />
        <Table.Column dataIndex="min_quantity" title="Qtd Mínima" width={110} align="right" render={(val: number) => (val === 0 ? '-' : val)} />
        <Table.Column dataIndex="max_quantity" title="Qtd Máxima" width={110} align="right" render={(val: number) => (val === 0 ? 'Ilimitado' : val)} />
        <Table.Column dataIndex="unit_price" title="Preço Unitário" width={140} align="right" render={(val: number) => formatCurrency(val)} />
        <Table.Column dataIndex="description" title="Descrição" ellipsis render={(val: string) => val || '-'} />
        <Table.Column dataIndex="active" title="Ativo" width={80} align="center" render={(active: boolean) => active ? <Tag color="green">Sim</Tag> : <Tag color="red">Não</Tag>} />
        <Table.Column
          title="Ações"
          key="actions"
          width={100}
          render={(_, record: IPriceEntry) => (
            <Space>
              <Button size="small" type="link" title="Editar" onClick={() => navigate(`/pricing/table/${record.id}/edit`)}>
                <Pencil size={16} />
              </Button>
              <Button size="small" type="link" danger title="Excluir" onClick={() => handleDelete(record)}>
                <Trash2 size={16} />
              </Button>
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
