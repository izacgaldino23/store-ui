import { useTable, List } from '@refinedev/antd';
import { useDelete, useInvalidate, type CrudFilter } from '@refinedev/core';
import { Table, Space, Tag, Button, Modal, Typography, Select, Input, message } from 'antd';
import apiClient from '../../providers/rest-client';
import { useState } from 'react';
import { Pencil, Eye, Trash2 } from 'lucide-react';
import { CsvImportModal } from '../../components/csv-import-modal';
import { ItemFormDrawer } from '../../components/item-form-drawer';
import { ItemShowDrawer } from '../../components/item-show-drawer';

const { Text } = Typography;

interface IItem {
  id: string;
  item_type: 'revenda' | 'insumo' | 'servico';
  code: string;
  name: string;
  display_name?: string;
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
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showId, setShowId] = useState<string | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [batchDeleteModalOpen, setBatchDeleteModalOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
  const { mutate: deleteMutate } = useDelete();
  const invalidate = useInvalidate();

  const { tableProps, setFilters, setCurrent } = useTable<IItem>({
    resource: 'items',
    pagination: { current: 1, pageSize: 10, mode: 'server' },
  });

  const applyFilters = (search?: string, type?: string) => {
    setCurrent(1);
    const f: CrudFilter[] = [];
    if (search) f.push({ field: 'search', operator: 'contains', value: search });
    if (type) f.push({ field: 'type', operator: 'eq', value: type });
    setFilters(f, 'replace');
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

  const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) return;
    setBatchDeleteModalOpen(true);
  };

  const confirmBatchDelete = async () => {
    try {
      const count = selectedRowKeys.length;
      await apiClient.delete('/catalog/items/batch', {
        data: { ids: selectedRowKeys },
      });
      setSelectedRowKeys([]);
      setBatchDeleteModalOpen(false);
      invalidate({ resource: 'items', invalidates: ['list'] });
      message.success(`${count} item(ns) excluído(s) com sucesso.`);
    } catch {
      message.error('Erro ao excluir um ou mais itens.');
      setBatchDeleteModalOpen(false);
    }
  };

  const [searchText, setSearchText] = useState('');

  return (
    <>
      <List
        headerButtons={() => (
          <>
            {selectedRowKeys.length > 0 && (
              <Button danger onClick={handleBatchDelete}>
                Excluir selecionados ({selectedRowKeys.length})
              </Button>
            )}
            <Button type="primary" onClick={() => setCreateDrawerOpen(true)}>
              Criar
            </Button>
            <Button onClick={() => setCsvModalOpen(true)}>Importar CSV</Button>
          </>
        )}
      >
        <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
          <Input.Search
            placeholder="Buscar por nome..."
            allowClear
            value={searchText}
            onChange={(e) => {
              const val = e.target.value;
              setSearchText(val);
              if (!val) applyFilters(undefined, typeFilter);
            }}
            onSearch={(value) => applyFilters(value || undefined, typeFilter)}
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
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys),
          }}
          pagination={{
            ...tableProps.pagination,
            showSizeChanger: true,
            showTotal: (total) => `Total: ${total} itens`,
          }}
        >
          <Table.Column dataIndex="code" title="Código" width={110} />
          <Table.Column
            title="Nome"
            ellipsis
            render={(_, record: IItem) => record.display_name || record.name}
          />
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
            width={140}
            render={(_, record: IItem) => (
              <Space>
                <Button
                  size="small"
                  type="link"
                  title="Editar"
                  onClick={() => setEditingId(record.id)}
                >
                  <Pencil size={16} />
                </Button>
                <Button
                  size="small"
                  type="link"
                  title="Visualizar"
                  onClick={() => setShowId(record.id)}
                >
                  <Eye size={16} />
                </Button>
                <Button
                  size="small"
                  type="link"
                  danger
                  title="Excluir"
                  onClick={() => handleDelete(record)}
                >
                  <Trash2 size={16} />
                </Button>
              </Space>
            )}
          />
        </Table>
      </List>
      <ItemFormDrawer
        mode="create"
        open={createDrawerOpen}
        onClose={() => setCreateDrawerOpen(false)}
        onSuccess={() => invalidate({ resource: 'items', invalidates: ['list'] })}
      />
      <ItemFormDrawer
        mode="edit"
        recordId={editingId}
        open={editingId !== null}
        onClose={() => setEditingId(null)}
        onSuccess={() => invalidate({ resource: 'items', invalidates: ['list'] })}
      />
      <ItemShowDrawer
        recordId={showId}
        open={showId !== null}
        onClose={() => setShowId(null)}
      />
      <CsvImportModal
        open={csvModalOpen}
        onClose={() => setCsvModalOpen(false)}
        onSuccess={() => invalidate({ resource: 'items', invalidates: ['list'] })}
      />
      <Modal
        title="Excluir itens selecionados"
        open={batchDeleteModalOpen}
        onOk={confirmBatchDelete}
        onCancel={() => setBatchDeleteModalOpen(false)}
        okText="Excluir"
        cancelText="Cancelar"
        okButtonProps={{ danger: true }}
      >
        <p>Tem certeza que deseja excluir {selectedRowKeys.length} item(ns)?</p>
      </Modal>
    </>
  );
};
