import { useEffect, useRef, useState } from 'react';
import {
  Button,
  Divider,
  Drawer,
  Input,
  message,
  Select,
  Space,
  Typography,
} from 'antd';
import { Plus, UserPlus } from 'lucide-react';
import apiClient from '../providers/rest-client';
import { translateError } from '../providers/error-mapping';
import {
  CLIENT_DEFAULT_CITY,
  formatPhone,
  type IClient,
} from '../pages/clients/types';

const { Text } = Typography;

export interface ClientSelectValue {
  id: string;
  name?: string;
}

interface ClientSelectProps {
  value: ClientSelectValue | null;
  onChange: (client: ClientSelectValue | null) => void;
}

interface QuickCreateForm {
  name: string;
  phone: string;
  city: string;
  street: string;
  number: string;
  neighborhood: string;
}

const emptyQuickForm: QuickCreateForm = {
  name: '',
  phone: '',
  city: CLIENT_DEFAULT_CITY,
  street: '',
  number: '',
  neighborhood: '',
};

export const ClientSelect = ({ value, onChange }: ClientSelectProps) => {
  const [options, setOptions] = useState<{ value: string; label: string; client: IClient }[]>([]);
  const [searching, setSearching] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [quickForm, setQuickForm] = useState<QuickCreateForm>(emptyQuickForm);
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleSearch = (term: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!term || term.length < 2) {
      setOptions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await apiClient.get('/clients', {
          params: { search: term, limit: 20 },
        });
        setOptions(
          (res.data?.clients || []).map((c: IClient) => ({
            value: c.id,
            label: c.phone ? `${c.name} — ${formatPhone(c.phone)}` : c.name,
            client: c,
          }))
        );
      } catch {
        // silent
      } finally {
        setSearching(false);
      }
    }, 400);
  };

  const openDrawer = () => {
    setQuickForm({ ...emptyQuickForm });
    setDrawerOpen(true);
  };

  const handleQuickCreate = async () => {
    if (!quickForm.name.trim()) {
      message.warning('Informe o nome do cliente.');
      return;
    }
    const digits = quickForm.phone.replace(/\D/g, '');
    if (digits && digits.length !== 10 && digits.length !== 11) {
      message.warning('Telefone inválido. Informe 10 ou 11 dígitos (com DDD).');
      return;
    }

    setSaving(true);
    try {
      const res = await apiClient.post<IClient>('/clients', {
        name: quickForm.name.trim(),
        phone: digits || undefined,
        city: quickForm.city.trim(),
        street: quickForm.street.trim(),
        number: quickForm.number.trim(),
        neighborhood: quickForm.neighborhood.trim(),
      });
      message.success('Cliente criado com sucesso!');
      setDrawerOpen(false);
      onChange(res.data);
    } catch (err) {
      const axiosErr = err as { response?: { data?: { code?: string } } };
      message.error(
        axiosErr?.response?.data?.code
          ? translateError(axiosErr.response.data.code)
          : 'Erro ao criar cliente.'
      );
    } finally {
      setSaving(false);
    }
  };

  const currentOption =
    value && !options.some((o) => o.value === value.id)
      ? [{ value: value.id, label: value.name || 'Cliente', client: { id: value.id, name: value.name || '' } as IClient }]
      : [];

  return (
    <>
      <Space.Compact style={{ width: '100%' }}>
        <Select
          showSearch
          allowClear
          filterOption={false}
          placeholder="Buscar cliente por nome ou telefone..."
          style={{ width: '100%' }}
          notFoundContent={
            searching ? <Text type="secondary">Buscando...</Text> : undefined
          }
          value={value?.id}
          onSearch={handleSearch}
          onChange={(id) => {
            const match = [...currentOption, ...options].find((o) => o.value === id);
            onChange(match ? { id: match.client.id, name: match.client.name } : null);
          }}
          options={[...currentOption, ...options]}
        />
        <Button
          icon={<UserPlus size={14} />}
          title="Novo cliente"
          onClick={openDrawer}
        />
      </Space.Compact>

      <Drawer
        title="Novo Cliente"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={360}
        footer={
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={() => setDrawerOpen(false)}>Cancelar</Button>
            <Button type="primary" icon={<Plus size={14} />} loading={saving} onClick={handleQuickCreate}>
              Salvar
            </Button>
          </Space>
        }
      >
        <Divider style={{ marginTop: 0 }} />
        <div style={{ marginBottom: 8 }}>
          <Text strong>Nome *</Text>
        </div>
        <Input
          placeholder="Nome do cliente"
          style={{ marginBottom: 16 }}
          value={quickForm.name}
          onChange={(e) => setQuickForm({ ...quickForm, name: e.target.value })}
        />
        <div style={{ marginBottom: 8 }}>
          <Text strong>Telefone</Text>
        </div>
        <Input
          placeholder="(88) 9 9123-4567"
          inputMode="tel"
          style={{ marginBottom: 16 }}
          value={quickForm.phone}
          onChange={(e) =>
            setQuickForm({ ...quickForm, phone: formatPhone(e.target.value) })
          }
        />
        <div style={{ marginBottom: 8 }}>
          <Text strong>Cidade</Text>
        </div>
        <Input
          placeholder={CLIENT_DEFAULT_CITY}
          style={{ marginBottom: 16 }}
          value={quickForm.city}
          onChange={(e) => setQuickForm({ ...quickForm, city: e.target.value })}
        />
        <Space size={8} style={{ width: '100%', marginBottom: 0 }}>
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: 8 }}>
              <Text strong>Rua</Text>
            </div>
            <Input
              placeholder="Rua / Avenida"
              value={quickForm.street}
              onChange={(e) => setQuickForm({ ...quickForm, street: e.target.value })}
            />
          </div>
          <div style={{ width: 90 }}>
            <div style={{ marginBottom: 8 }}>
              <Text strong>Nº</Text>
            </div>
            <Input
              value={quickForm.number}
              onChange={(e) => setQuickForm({ ...quickForm, number: e.target.value })}
            />
          </div>
        </Space>
        <div style={{ marginBottom: 8, marginTop: 16 }}>
          <Text strong>Bairro</Text>
        </div>
        <Input
          placeholder="Bairro"
          value={quickForm.neighborhood}
          onChange={(e) => setQuickForm({ ...quickForm, neighborhood: e.target.value })}
        />
      </Drawer>
    </>
  );
};
