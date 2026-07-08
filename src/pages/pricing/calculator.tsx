import { useState, useEffect } from 'react';
import { Card, Form, InputNumber, Select, Button, Typography, Space, Divider, message, Spin, Tag, Tooltip } from 'antd';
import { Calculator, ArrowLeft, Copy, Table, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../providers/rest-client';

const { Title, Text } = Typography;

interface IPriceEntry {
  id: string;
  paper_type: string;
  min_quantity: number;
  max_quantity: number;
  unit_price: number;
  description?: string;
  active?: boolean;
}

interface ICalculateResult {
  suggested_price: number;
  unit_price?: number;
  paper_type?: string;
  quantity?: number;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export const CalculatorPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ICalculateResult | null>(null);

  const [materialCost, setMaterialCost] = useState<number>(0);
  const [marginPercent, setMarginPercent] = useState<number>(0);
  const [paperType, setPaperType] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(0);

  const [tableEntries, setTableEntries] = useState<IPriceEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(true);

  useEffect(() => {
    apiClient.get('/pricing/table')
      .then((res) => {
        setTableEntries(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        setTableEntries([]);
      })
      .finally(() => setLoadingEntries(false));
  }, []);

  const paperTypeOptions = tableEntries
    .filter((e) => e.active !== false)
    .reduce<string[]>((acc, e) => {
      if (!acc.includes(e.paper_type)) acc.push(e.paper_type);
      return acc;
    }, [])
    .sort()
    .map((type) => ({ value: type, label: type }));

  const matchedEntry = (() => {
    if (!paperType || quantity <= 0) return null;
    const candidates = tableEntries.filter((e) => e.paper_type === paperType && e.active !== false);
    for (const entry of candidates) {
      const minOk = entry.min_quantity <= quantity || entry.min_quantity === 0;
      const maxOk = entry.max_quantity >= quantity || entry.max_quantity === 0;
      if (minOk && maxOk) return entry;
    }
    return null;
  })();

  const handleCalculate = async () => {
    if (materialCost <= 0) {
      message.warning('Informe o custo do material.');
      return;
    }
    if (marginPercent <= 0) {
      message.warning('Informe a margem de lucro.');
      return;
    }

    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        material_cost: materialCost,
        margin_percent: marginPercent,
      };
      if (paperType) payload.paper_type = paperType;
      if (quantity > 0) payload.quantity = quantity;

      const res = await apiClient.post('/pricing/calculate', payload);
      setResult(res.data as ICalculateResult);
    } catch {
      message.error('Erro ao calcular preço.');
    } finally {
      setLoading(false);
    }
  };

  const copyPrice = (value: number) => {
    navigator.clipboard.writeText(value.toFixed(2)).then(() => {
      message.success('Preço copiado: R$ ' + value.toFixed(2));
    });
  };

  return (
    <div style={{ padding: 24 }}>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeft size={16} />} onClick={() => navigate('/pricing/table')}>
          Voltar
        </Button>
      </Space>
      <Title level={4}>Calculadora de Margem</Title>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <Card style={{ width: 420 }} title="Dados de Entrada">
          <Form layout="vertical">
            <Form.Item label="Custo do Material (R$)" required>
              <InputNumber
                min={0}
                step={0.01}
                prefix="R$"
                style={{ width: '100%' }}
                value={materialCost}
                onChange={(val) => setMaterialCost(val || 0)}
              />
            </Form.Item>
            <Form.Item label="Margem de Lucro (%)" required>
              <InputNumber
                min={0}
                max={1000}
                step={1}
                suffix="%"
                style={{ width: '100%' }}
                value={marginPercent}
                onChange={(val) => setMarginPercent(val || 0)}
              />
            </Form.Item>
            <Form.Item label="Tipo de Papel (opcional — carregado da tabela)">
              <Select
                allowClear
                placeholder={loadingEntries ? 'Carregando...' : 'Selecione um tipo'}
                value={paperType}
                onChange={(val) => setPaperType(val || '')}
                options={paperTypeOptions}
                notFoundContent={loadingEntries ? <Spin size="small" /> : 'Nenhum tipo cadastrado'}
                style={{ width: '100%' }}
              />
            </Form.Item>
            {paperType && tableEntries.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Tipos disponíveis na tabela: {paperTypeOptions.length}
                </Text>
              </div>
            )}
            <Form.Item label="Quantidade (opcional)">
              <InputNumber
                min={0}
                style={{ width: '100%' }}
                value={quantity}
                onChange={(val) => setQuantity(val || 0)}
              />
            </Form.Item>
            <Button
              type="primary"
              icon={<Calculator size={16} />}
              onClick={handleCalculate}
              loading={loading}
              block
              size="large"
            >
              Calcular
            </Button>
          </Form>
        </Card>

        <div style={{ flex: 1, minWidth: 380 }}>
          {matchedEntry && (
            <Card
              style={{ marginBottom: 16 }}
              title={
                <Space>
                  <Table size={16} />
                  Correspondência na Tabela
                </Space>
              }
              size="small"
            >
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                <div>
                  <Text type="secondary">Tipo</Text>
                  <div><Tag color="blue">{matchedEntry.paper_type}</Tag></div>
                </div>
                <div>
                  <Text type="secondary">Faixa</Text>
                  <div>
                    {matchedEntry.min_quantity || 0} — {matchedEntry.max_quantity || '∞'} unidades
                  </div>
                </div>
                <div>
                  <Text type="secondary">Preço Unitário</Text>
                  <div style={{ fontSize: 18, fontWeight: 'bold', color: '#1677ff' }}>
                    {formatCurrency(matchedEntry.unit_price)}
                  </div>
                </div>
                {matchedEntry.description && (
                  <div>
                    <Text type="secondary">Descrição</Text>
                    <div>{matchedEntry.description}</div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {!paperType && (
            <Card style={{ marginBottom: 16 }} size="small">
              <Text type="secondary">
                Selecione um tipo de papel e quantidade para ver o preço correspondente na tabela.
              </Text>
            </Card>
          )}

          {result && (
            <Card title="Resultado" style={{ marginBottom: 16 }}>
              {loading ? (
                <Spin />
              ) : (
                <>
                  <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 180 }}>
                      <Text type="secondary">Preço Sugerido (calculado)</Text>
                      <div style={{ fontSize: 28, fontWeight: 'bold', color: '#52c41a' }}>
                        {formatCurrency(result.suggested_price)}
                      </div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        custo × (1 + margem/100)
                      </Text>
                    </div>

                    {result.unit_price != null && (
                      <div style={{ flex: 1, minWidth: 180 }}>
                        <Text type="secondary">Preço da Tabela</Text>
                        <div style={{ fontSize: 28, fontWeight: 'bold', color: '#1677ff' }}>
                          {formatCurrency(result.unit_price)}
                        </div>
                        {result.paper_type && (
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {result.paper_type} {result.quantity ? `(${result.quantity} und)` : ''}
                          </Text>
                        )}
                      </div>
                    )}
                  </div>

                  <Divider />

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Tooltip title="Copia o valor para a área de transferência">
                      <Button icon={<Copy size={14} />} onClick={() => copyPrice(result.suggested_price)}>
                        Copiar Preço
                      </Button>
                    </Tooltip>
                    {result.unit_price != null && (
                      <Button
                        icon={<Copy size={14} />}
                        onClick={() => {
                          if (result.unit_price != null) copyPrice(result.unit_price);
                        }}
                      >
                        Copiar Preço da Tabela
                      </Button>
                    )}
                    <Button
                      icon={<Plus size={14} />}
                      onClick={() => navigate('/pricing/table/create')}
                    >
                      Nova Entrada na Tabela
                    </Button>
                  </div>
                </>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
