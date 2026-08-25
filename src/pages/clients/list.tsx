import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { List } from '@refinedev/antd';
import {
  Button,
  Input,
  message,
  Modal,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import apiClient from '../../providers/rest-client';
import { translateError } from '../../providers/error-mapping';
import {
  CLIENT_DEFAULT_CITY,
  formatPhone,
  type IClient,
  type IClientFormState,
} from './types';

const { Text } = Typography;

const emptyForm: IClientFormState = {
  name: '',
  phone: '',
  city: CLIENT_DEFAULT_CITY,
  street: '',
  neighborhood: '',
  number: '',
  complement: '',
  notes: '',
};

function getApiErrorMessage(err: unknown, fallback: string): string {
  const axiosErr = err as { response?: { data?: { code?: string } } };
  const code = axiosErr?.response?.data?.code;
  return code ? translateError(code) : fallback;
}

export const ClientsListPage = () => {
  const [clients, setClients] = useState<IClient[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [searchInput, setSearchInput] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<IClient | null>(null);
  const [form, setForm] = useState<IClientFormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/clients', {
        params: { page, limit: pageSize, search: search || undefined },
      });
      setClients(res.data?.clients || []);
      setTotal(res.data?.total || 0);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      setSearch(value);
    }, 400);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setModalOpen(true);
  };

  const openEdit = (client: IClient) => {
    setEditing(client);
    setForm({
      name: client.name,
      phone: formatPhone(client.phone),
      city: client.city || '',
      street: client.street || '',
      neighborhood: client.neighborhood || '',
      number: client.number || '',
      complement: client.complement || '',
      notes: client.notes || '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      message.warning('Informe o nome do cliente.');
      return;
    }
    const digits = form.phone.replace(/\D/g, '');
    if (digits && digits.length !== 10 && digits.length !== 11) {
      message.warning('Telefone inválido. Informe 10 ou 11 dígitos (com DDD).');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        phone: digits || undefined,
        city: form.city.trim(),
        street: form.street.trim(),
        neighborhood: form.neighborhood.trim(),
        number: form.number.trim(),
        complement: form.complement.trim(),
        notes: form.notes,
      };
      if (editing) {
        await apiClient.put(`/clients/${editing.id}`, payload);
        message.success('Cliente atualizado com sucesso!');
      } else {
        await apiClient.post('/clients', payload);
        message.success('Cliente criado com sucesso!');
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Erro ao salvar cliente.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (client: IClient) => {
    Modal.confirm({
      title: 'Excluir cliente',
      content: `Deseja realmente excluir o cliente "${client.name}"?`,
      okText: 'Excluir',
      okButtonProps: { danger: true },
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          await apiClient.delete(`/clients/${client.id}`);
          message.success('Cliente excluído com sucesso!');
          fetchData();
        } catch (err) {
          message.error(getApiErrorMessage(err, 'Erro ao excluir cliente.'));
        }
      },
    });
  };

  const toolbar = (
    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
      <Input
        allowClear
        prefix={<Search size={14} />}
        placeholder="Buscar por nome ou telefone..."
        style={{ width: 280 }}
        value={searchInput}
        onChange={(e) => handleSearchChange(e.target.value)}
      />
      <Button type="primary" icon={<Plus size={14} />} onClick={openCreate}>
        Novo Cliente
      </Button>
    </Space>
  );

  const textField = (
    label: string,
    key: keyof IClientFormState,
    placeholder?: string,
    extra?: ReactNode
  ) => (
    <>
      <div style={{ marginBottom: 8 }}>
        <Text strong>{label}</Text>
      </div>
      {extra ?? (
        <Input
          placeholder={placeholder}
          style={{ marginBottom: 16 }}
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        />
      )}
    </>
  );

  return (
    <List title="Clientes">
      <Table
        dataSource={clients}
        rowKey="id"
        loading={loading}
        size="small"
        scroll={{ x: 'max-content' }}
        title={() => toolbar}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: false,
          onChange: (p) => setPage(p),
          showTotal: (t) => `${t} cliente(s)`,
        }}
      >
        <Table.Column dataIndex="name" title="Nome" />
        <Table.Column
          dataIndex="phone"
          title="Telefone"
          width={150}
          render={(val: string | undefined) => (val ? formatPhone(val) : '-')}
        />
        <Table.Column dataIndex="city" title="Cidade" width={150} />
        <Table.Column
          key="address"
          title="Endereço"
          render={(_, record: IClient) => {
            const parts = [
              record.street ? `${record.street}${record.number ? `, ${record.number}` : ''}` : '',
              record.neighborhood,
              record.complement,
            ].filter(Boolean);
            return parts.length > 0 ? parts.join(' - ') : '-';
          }}
        />
        <Table.Column
          dataIndex="active"
          title="Status"
          width={100}
          align="center"
          render={(val: boolean) =>
            val ? <Tag color="green">Ativo</Tag> : <Tag color="default">Inativo</Tag>
          }
        />
        <Table.Column
          title="Ações"
          key="actions"
          width={120}
          render={(_, record: IClient) => (
            <>
              <Button
                type="link"
                size="small"
                icon={<Pencil size={14} />}
                onClick={() => openEdit(record)}
              />
              <Button
                danger
                type="link"
                size="small"
                icon={<Trash2 size={14} />}
                onClick={() => handleDelete(record)}
              />
            </>
          )}
        />
      </Table>

      <Modal
        title={editing ? `Editar Cliente: ${editing.name}` : 'Novo Cliente'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        okText="Salvar"
        cancelText="Cancelar"
        confirmLoading={saving}
        destroyOnClose
      >
        {textField('Nome *', 'name', 'Nome do cliente')}
        {textField(
          'Telefone',
          'phone',
          '(88) 9 9123-4567',
          <Input
            placeholder="(88) 9 9123-4567"
            style={{ marginBottom: 16 }}
            inputMode="tel"
            value={form.phone}
            onChange={(e) =>
              setForm({ ...form, phone: formatPhone(e.target.value) })
            }
          />
        )}
        {textField('Cidade', 'city', CLIENT_DEFAULT_CITY)}
        <Space size={8} style={{ width: '100%' }}>
          <div style={{ flex: 1 }}>
            {textField('Rua', 'street', 'Rua / Avenida')}
          </div>
          <div style={{ width: 100 }}>
            {textField('Nº', 'number')}
          </div>
        </Space>
        {textField('Bairro', 'neighborhood', 'Bairro')}
        {textField('Complemento', 'complement', 'Complemento')}
        {textField(
          'Observação',
          'notes',
          'Observações sobre o cliente',
          <Input.TextArea
            rows={2}
            placeholder="Observações sobre o cliente"
            style={{ marginBottom: 16 }}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        )}
      </Modal>
    </List>
  );
};
