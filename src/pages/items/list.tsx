import { useTable, List } from '@refinedev/antd';
import { useDelete, type CrudFilter } from '@refinedev/core';
import { Table, Space, Tag, Button, Modal, Typography, Select, Input } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { CsvImportModal } from '../../components/csv-import-modal';

const { Text } = Typography;

interface IItem {
  id: string;
  item_type: 'revenda' | 'insumo' | 'servico';
  code: string;
  name: string;
  sale_price?: number;
  current_stock?: number;
  min_stock: number;
  active: boolean;
}

const typeColors: Record<string, string> = {
  revenda: 'blue',
  insumo: 'orange',
  servico: 'green',
};

const typeLabels: Record<string, string> = {
  revenda: 'Revenda',
  insumo: 'Insumo',
  servico: 'Serviço',
};

function formatCurrency(value?: number | null): string {
  if (value == null) return '-';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export const ItemsListPage = () => {
  const navigate = useNavigate();
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
  const { mutate: deleteMutate } = useDelete();

  const { tableProps, setFilters } = useTable<IItem>({
    resource: 'items',
    pagination: { current: 1, pageSize: 10, mode: 'server' },
  });

  const applyFilters = (search?: string, type?: string) => {
    const f: CrudFilter[] = [];
    if (search) f.push({ field: 'search', operator: 'contains', value: search });
    if (type) f.push({ field: 'type', operator: 'eq', value: type });
    setFilters(f);
  };

  const handleDelete = (record: IItem) => {
    Modal.confirm({
      title: 'Confirmar exclusão',
      content: `Tem certeza que deseja excluir "${record.name}"?`,
      okText: 'Excluir',
      cancelText: 'Cancelar',
      okButtonProps: { danger: true },
      onOk: () => {
        deleteMutate({ resource: 'items', id: record.id });
      },
    });
  };

  const [searchText, setSearchText] = useState('');

  return (
    <>
      <List
        headerButtons={({ defaultButtons }) => (
          <>
            {defaultButtons}
            <Button onClick={() => setCsvModalOpen(true)}>Importar CSV</Button>
          </>
        )}
      >
        <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
          <Input.Search
            placeholder="Buscar por nome..."
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onSearch={(value) => applyFilters(value, typeFilter)}
            style={{ width: 250 }}
          />
          <Select
            allowClear
            placeholder="Filtrar por tipo"
            value={typeFilter}
            onChange={(value) => {
              setTypeFilter(value);
              applyFilters(searchText, value);
            }}
            style={{ width: 180 }}
            options={[
              { label: 'Revenda', value: 'revenda' },
              { label: 'Insumo', value: 'insumo' },
              { label: 'Serviço', value: 'servico' },
            ]}
          />
        </div>
        <Table
          {...tableProps}
          rowKey="id"
          pagination={{
            ...tableProps.pagination,
            showSizeChanger: true,
            showTotal: (total) => `Total: ${total} itens`,
          }}
        >
          <Table.Column dataIndex="code" title="Código" width={110} />
          <Table.Column dataIndex="name" title="Nome" ellipsis />
          <Table.Column
            dataIndex="item_type"
            title="Tipo"
            width={110}
            render={(type: string) => (
              <Tag color={typeColors[type] || 'default'}>
                {typeLabels[type] || type}
              </Tag>
            )}
          />
          <Table.Column
            dataIndex="sale_price"
            title="Preço de Venda"
            width={130}
            align="right"
            render={(value: number | null) => formatCurrency(value)}
          />
          <Table.Column
            dataIndex="current_stock"
            title="Estoque Atual"
            width={120}
            align="right"
            render={(value: number | undefined, record: IItem) => (
              <Text
                type={
                  value != null && record.min_stock != null && value <= record.min_stock
                    ? 'danger'
                    : undefined
                }
                strong={
                  value != null && record.min_stock != null && value <= record.min_stock
                }
              >
                {value ?? 0}
              </Text>
            )}
          />
          <Table.Column dataIndex="min_stock" title="Est. Mínimo" width={105} align="right" />
          <Table.Column
            dataIndex="active"
            title="Ativo"
            width={80}
            align="center"
            render={(active: boolean) =>
              active ? (
                <Tag color="green">Sim</Tag>
              ) : (
                <Tag color="red">Não</Tag>
              )
            }
          />
          <Table.Column
            title="Ações"
            key="actions"
            width={210}
            render={(_, record: IItem) => (
              <Space>
                <Button size="small" type="link" onClick={() => navigate(`/items/${record.id}/edit`)}>
                  Editar
                </Button>
                <Button size="small" type="link" onClick={() => navigate(`/items/${record.id}`)}>
                  Visualizar
                </Button>
                <Button size="small" type="link" danger onClick={() => handleDelete(record)}>
                  Excluir
                </Button>
              </Space>
            )}
          />
        </Table>
      </List>
      <CsvImportModal open={csvModalOpen} onClose={() => setCsvModalOpen(false)} />
    </>
  );
};
