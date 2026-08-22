import { useState, useEffect, useCallback } from 'react';
import { List } from '@refinedev/antd';
import {
  Table,
  Tag,
  Button,
  Modal,
  Space,
  Typography,
  Select,
  Input,
  InputNumber,
  Radio,
  message,
} from 'antd';
import { Plus, Pencil, Trash2, Printer } from 'lucide-react';
import apiClient from '../../providers/rest-client';
import { formatCurrency } from '../orders/constants';
import type { IPrintPaper, IPrintAddon, ICatalogItem } from '../orders/types';

const { Text } = Typography;

interface PaperFormState {
  origin: 'item' | 'custom';
  itemId?: string;
  customName: string;
  pricePerSheet: number | null;
  sheetsRemaining: number | null;
}

interface AddonFormState {
  name: string;
  priceType: 'fixed' | 'percentage';
  priceValue: number | null;
}

const emptyPaperForm: PaperFormState = {
  origin: 'item',
  customName: '',
  pricePerSheet: null,
  sheetsRemaining: null,
};

const emptyAddonForm: AddonFormState = {
  name: '',
  priceType: 'fixed',
  priceValue: null,
};

export const PrintingListPage = () => {
  const [tab, setTab] = useState<'papers' | 'addons'>('papers');

  const [papers, setPapers] = useState<IPrintPaper[]>([]);
  const [addons, setAddons] = useState<IPrintAddon[]>([]);
  const [loading, setLoading] = useState(false);

  const [paperModalOpen, setPaperModalOpen] = useState(false);
  const [editingPaper, setEditingPaper] = useState<IPrintPaper | null>(null);
  const [paperForm, setPaperForm] = useState<PaperFormState>(emptyPaperForm);
  const [savingPaper, setSavingPaper] = useState(false);

  const [addonModalOpen, setAddonModalOpen] = useState(false);
  const [editingAddon, setEditingAddon] = useState<IPrintAddon | null>(null);
  const [addonForm, setAddonForm] = useState<AddonFormState>(emptyAddonForm);
  const [savingAddon, setSavingAddon] = useState(false);

  const [insumoItems, setInsumoItems] = useState<ICatalogItem[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [papersRes, addonsRes] = await Promise.all([
        apiClient.get<{ papers: IPrintPaper[] }>('/printing/papers', {
          params: { limit: 200 },
        }),
        apiClient.get<{ addons: IPrintAddon[] }>('/printing/addons', {
          params: { limit: 200 },
        }),
      ]);
      setPapers(papersRes.data?.papers || []);
      setAddons(addonsRes.data?.addons || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!paperModalOpen || editingPaper) return;
    (async () => {
      try {
        const res = await apiClient.get<{ items: ICatalogItem[] }>('/catalog/items', {
          params: { type: 'insumo', limit: 100 },
        });
        setInsumoItems(res.data?.items || []);
      } catch {
        // silent
      }
    })();
  }, [paperModalOpen, editingPaper]);

  const openCreatePaper = () => {
    setEditingPaper(null);
    setPaperForm(emptyPaperForm);
    setPaperModalOpen(true);
  };

  const openEditPaper = (paper: IPrintPaper) => {
    setEditingPaper(paper);
    setPaperForm({
      origin: paper.item_id ? 'item' : 'custom',
      itemId: paper.item_id || undefined,
      customName: paper.custom_name || '',
      pricePerSheet: paper.price_per_sheet,
      sheetsRemaining: paper.sheets_remaining ?? null,
    });
    setPaperModalOpen(true);
  };

  const handleSavePaper = async () => {
    if (paperForm.pricePerSheet == null || paperForm.pricePerSheet < 0) {
      message.warning('Informe o preço por folha.');
      return;
    }
    if (!editingPaper && paperForm.origin === 'item' && !paperForm.itemId) {
      message.warning('Selecione um item do catálogo.');
      return;
    }
    if (!editingPaper && paperForm.origin === 'custom' && !paperForm.customName.trim()) {
      message.warning('Informe o nome personalizado do papel.');
      return;
    }

    setSavingPaper(true);
    try {
      if (editingPaper) {
        await apiClient.put(`/printing/papers/${editingPaper.id}`, {
          price_per_sheet: paperForm.pricePerSheet,
          sheets_remaining: paperForm.sheetsRemaining ?? undefined,
        });
        message.success('Papel atualizado com sucesso!');
      } else {
        await apiClient.post('/printing/papers', {
          item_id: paperForm.origin === 'item' ? paperForm.itemId : undefined,
          custom_name: paperForm.origin === 'custom' ? paperForm.customName.trim() : undefined,
          price_per_sheet: paperForm.pricePerSheet,
          sheets_remaining: paperForm.sheetsRemaining ?? undefined,
        });
        message.success('Papel criado com sucesso!');
      }
      setPaperModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      message.error(axiosErr?.response?.data?.message || 'Erro ao salvar papel.');
    } finally {
      setSavingPaper(false);
    }
  };

  const handleDeletePaper = (paper: IPrintPaper) => {
    Modal.confirm({
      title: 'Excluir papel',
      content: `Deseja realmente excluir o papel "${paper.display_name}"?`,
      okText: 'Excluir',
      okButtonProps: { danger: true },
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          await apiClient.delete(`/printing/papers/${paper.id}`);
          message.success('Papel excluído com sucesso!');
          fetchData();
        } catch (err: unknown) {
          const axiosErr = err as { response?: { data?: { message?: string } } };
          message.error(axiosErr?.response?.data?.message || 'Erro ao excluir papel.');
        }
      },
    });
  };

  const openCreateAddon = () => {
    setEditingAddon(null);
    setAddonForm(emptyAddonForm);
    setAddonModalOpen(true);
  };

  const openEditAddon = (addon: IPrintAddon) => {
    setEditingAddon(addon);
    setAddonForm({
      name: addon.name,
      priceType: addon.price_type,
      priceValue: addon.price_value,
    });
    setAddonModalOpen(true);
  };

  const handleSaveAddon = async () => {
    if (!addonForm.name.trim()) {
      message.warning('Informe o nome do adicional.');
      return;
    }
    if (addonForm.priceValue == null || addonForm.priceValue < 0) {
      message.warning('Informe o valor do adicional.');
      return;
    }

    setSavingAddon(true);
    try {
      if (editingAddon) {
        await apiClient.put(`/printing/addons/${editingAddon.id}`, {
          name: addonForm.name.trim(),
          price_type: addonForm.priceType,
          price_value: addonForm.priceValue,
        });
        message.success('Adicional atualizado com sucesso!');
      } else {
        await apiClient.post('/printing/addons', {
          name: addonForm.name.trim(),
          price_type: addonForm.priceType,
          price_value: addonForm.priceValue,
        });
        message.success('Adicional criado com sucesso!');
      }
      setAddonModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      message.error(axiosErr?.response?.data?.message || 'Erro ao salvar adicional.');
    } finally {
      setSavingAddon(false);
    }
  };

  const handleDeleteAddon = (addon: IPrintAddon) => {
    Modal.confirm({
      title: 'Excluir adicional',
      content: `Deseja realmente excluir o adicional "${addon.name}"?`,
      okText: 'Excluir',
      okButtonProps: { danger: true },
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          await apiClient.delete(`/printing/addons/${addon.id}`);
          message.success('Adicional excluído com sucesso!');
          fetchData();
        } catch (err: unknown) {
          const axiosErr = err as { response?: { data?: { message?: string } } };
          message.error(axiosErr?.response?.data?.message || 'Erro ao excluir adicional.');
        }
      },
    });
  };

  const toolbar = (
    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
      <Radio.Group
        value={tab}
        onChange={(e) => setTab(e.target.value)}
        optionType="button"
        buttonStyle="solid"
        options={[
          { value: 'papers', label: 'Papéis' },
          { value: 'addons', label: 'Adicionais' },
        ]}
      />
      <Button
        type="primary"
        icon={<Plus size={14} />}
        onClick={tab === 'papers' ? openCreatePaper : openCreateAddon}
      >
        {tab === 'papers' ? 'Novo Papel' : 'Novo Adicional'}
      </Button>
    </Space>
  );

  return (
    <List title="Impressão">
      {tab === 'papers' ? (
        <Table
          dataSource={papers}
          rowKey="id"
          loading={loading}
          size="small"
          scroll={{ x: 'max-content' }}
          title={() => toolbar}
        >
          <Table.Column
            dataIndex="display_name"
            title="Papel"
            render={(val: string) => (
              <Space>
                <Printer size={14} /> {val}
              </Space>
            )}
          />
          <Table.Column
            dataIndex="price_per_sheet"
            title="Preço/Folha"
            width={130}
            align="right"
            render={(val: number) => formatCurrency(val)}
          />
          <Table.Column
            dataIndex="sheets_remaining"
            title="Folhas Restantes"
            width={140}
            align="center"
            render={(val: number | undefined) => val ?? '-'}
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
            render={(_, record: IPrintPaper) => (
              <>
                <Button type="link" size="small" icon={<Pencil size={14} />} onClick={() => openEditPaper(record)} />
                <Button danger type="link" size="small" icon={<Trash2 size={14} />} onClick={() => handleDeletePaper(record)} />
              </>
            )}
          />
        </Table>
      ) : (
        <Table
          dataSource={addons}
          rowKey="id"
          loading={loading}
          size="small"
          scroll={{ x: 'max-content' }}
          title={() => toolbar}
        >
          <Table.Column dataIndex="name" title="Adicional" />
          <Table.Column
            dataIndex="price_type"
            title="Tipo"
            width={160}
            render={(val: string) => (val === 'fixed' ? 'Valor fixo' : 'Percentual')}
          />
          <Table.Column
            dataIndex="price_value"
            title="Valor"
            width={120}
            align="right"
            render={(val: number, record: IPrintAddon) =>
              record.price_type === 'fixed' ? formatCurrency(val) : `${val}%`
            }
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
            render={(_, record: IPrintAddon) => (
              <>
                <Button type="link" size="small" icon={<Pencil size={14} />} onClick={() => openEditAddon(record)} />
                <Button danger type="link" size="small" icon={<Trash2 size={14} />} onClick={() => handleDeleteAddon(record)} />
              </>
            )}
          />
        </Table>
      )}

      <Modal
        title={editingPaper ? `Editar Papel: ${editingPaper.display_name}` : 'Novo Papel'}
        open={paperModalOpen}
        onOk={handleSavePaper}
        onCancel={() => setPaperModalOpen(false)}
        okText="Salvar"
        cancelText="Cancelar"
        confirmLoading={savingPaper}
        destroyOnClose
      >
        {!editingPaper && (
          <>
            <div style={{ marginBottom: 8 }}>
              <Text strong>Origem do nome</Text>
            </div>
            <Radio.Group
              value={paperForm.origin}
              onChange={(e) => setPaperForm({ ...paperForm, origin: e.target.value })}
              style={{ marginBottom: 16 }}
              options={[
                { value: 'item', label: 'Item do catálogo (insumo)' },
                { value: 'custom', label: 'Nome personalizado' },
              ]}
              optionType="button"
            />
            {paperForm.origin === 'item' ? (
              <Select
                placeholder="Selecione o item (insumo)"
                style={{ width: '100%', marginBottom: 16 }}
                showSearch
                optionFilterProp="label"
                value={paperForm.itemId}
                onChange={(val) => setPaperForm({ ...paperForm, itemId: val })}
                options={insumoItems.map((i) => ({ value: i.id, label: i.name }))}
              />
            ) : (
              <Input
                placeholder="Nome do papel (ex.: A4 75g Colorido)"
                style={{ marginBottom: 16 }}
                value={paperForm.customName}
                onChange={(e) => setPaperForm({ ...paperForm, customName: e.target.value })}
              />
            )}
          </>
        )}
        <div style={{ marginBottom: 8 }}>
          <Text strong>Preço por folha</Text>
        </div>
        <InputNumber
          style={{ width: '100%', marginBottom: 16 }}
          min={0}
          step={0.01}
          prefix="R$"
          value={paperForm.pricePerSheet}
          onChange={(val) => setPaperForm({ ...paperForm, pricePerSheet: val })}
        />
        <div style={{ marginBottom: 8 }}>
          <Text strong>Folhas restantes (opcional)</Text>
        </div>
        <InputNumber
          style={{ width: '100%' }}
          min={0}
          precision={0}
          placeholder="Controle informativo"
          value={paperForm.sheetsRemaining}
          onChange={(val) => setPaperForm({ ...paperForm, sheetsRemaining: val })}
        />
        {editingPaper && (
          <Text type="secondary" style={{ display: 'block', marginTop: 12, fontSize: 12 }}>
            O nome/vínculo do papel não pode ser alterado após a criação.
          </Text>
        )}
      </Modal>

      <Modal
        title={editingAddon ? `Editar Adicional: ${editingAddon.name}` : 'Novo Adicional'}
        open={addonModalOpen}
        onOk={handleSaveAddon}
        onCancel={() => setAddonModalOpen(false)}
        okText="Salvar"
        cancelText="Cancelar"
        confirmLoading={savingAddon}
        destroyOnClose
      >
        <div style={{ marginBottom: 8 }}>
          <Text strong>Nome</Text>
        </div>
        <Input
          placeholder="Nome do adicional (ex.: Corte)"
          style={{ marginBottom: 16 }}
          value={addonForm.name}
          onChange={(e) => setAddonForm({ ...addonForm, name: e.target.value })}
        />
        <div style={{ marginBottom: 8 }}>
          <Text strong>Tipo de cobrança</Text>
        </div>
        <Radio.Group
          value={addonForm.priceType}
          onChange={(e) => setAddonForm({ ...addonForm, priceType: e.target.value })}
          style={{ marginBottom: 16 }}
          options={[
            { value: 'fixed', label: 'Valor fixo por folha' },
            { value: 'percentage', label: 'Percentual sobre o papel' },
          ]}
          optionType="button"
        />
        <div style={{ marginBottom: 8 }}>
          <Text strong>Valor</Text>
        </div>
        <InputNumber
          style={{ width: '100%' }}
          min={0}
          step={addonForm.priceType === 'fixed' ? 0.01 : 1}
          prefix={addonForm.priceType === 'fixed' ? 'R$' : undefined}
          suffix={addonForm.priceType === 'percentage' ? '%' : undefined}
          value={addonForm.priceValue}
          onChange={(val) => setAddonForm({ ...addonForm, priceValue: val })}
        />
      </Modal>
    </List>
  );
};
