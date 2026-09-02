import { Card, Table, Button, Select, InputNumber, Space, Typography } from 'antd';
import { Plus, Trash2, Printer } from 'lucide-react';
import { formatCurrency } from './constants';
import { computePrintUnitPrice } from './print-catalog';
import type { IPrintPaper, IPrintAddon, IPrintLine } from './types';

const { Text } = Typography;

interface PrintsCardProps {
  value: IPrintLine[];
  onChange: (lines: IPrintLine[]) => void;
  papers: IPrintPaper[];
  addons: IPrintAddon[];
  loading?: boolean;
}

export const PrintsCard = ({ value, onChange, papers, addons, loading }: PrintsCardProps) => {
  const addLine = () => {
    onChange([...value, { quantity: 1, addon_ids: [] }]);
  };

  const removeLine = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const updateLine = (index: number, patch: Partial<IPrintLine>) => {
    onChange(value.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  };

  const lineUnitPrice = (line: IPrintLine): number => {
    const paper = papers.find((p) => p.id === line.print_paper_id);
    const selectedAddons = addons.filter((a) => line.addon_ids.includes(a.id));
    return computePrintUnitPrice(paper, selectedAddons);
  };

  const printsTotal = value.reduce(
    (sum, line) => sum + lineUnitPrice(line) * (line.quantity || 0),
    0
  );

  return (
    <Card
      size="small"
      title={
        <Space>
          <Printer size={16} />
          Impressões ({value.length})
        </Space>
      }
      style={{ marginBottom: 16 }}
    >
      {value.length === 0 ? (
        <Text type="secondary">Nenhuma impressão adicionada.</Text>
      ) : (
        <Table
          dataSource={value}
          rowKey={(_, index) => String(index)}
          size="small"
          pagination={false}
          loading={loading}
        >
          <Table.Column
            title="Papel"
            width={180}
            render={(_, record: IPrintLine, index: number) => (
              <Select
                placeholder="Selecione o papel"
                style={{ width: '100%' }}
                showSearch
                optionFilterProp="label"
                value={record.print_paper_id}
                onChange={(val) => updateLine(index, { print_paper_id: val })}
                options={papers.map((p) => ({ value: p.id, label: p.display_name }))}
              />
            )}
          />
          <Table.Column
            dataIndex="quantity"
            title="Qtd"
            width={90}
            align="center"
            render={(val: number, record: IPrintLine, index: number) => (
              <InputNumber
                min={1}
                precision={0}
                value={val}
                onChange={(v) => updateLine(index, { quantity: v || 1 })}
              />
            )}
          />
          <Table.Column
            title="Adicionais"
            render={(_, record: IPrintLine, index: number) => (
              <Select
                mode="multiple"
                allowClear
                placeholder="Opcional"
                style={{ width: '100%' }}
                value={record.addon_ids}
                onChange={(vals) => updateLine(index, { addon_ids: vals })}
                options={addons.map((a) => ({
                  value: a.id,
                  label: `${a.name} (${
                    a.price_type === 'fixed'
                      ? `+${formatCurrency(a.price_value)}`
                      : `+${a.price_value}%`
                  })`,
                }))}
              />
            )}
          />
          <Table.Column
            title="Valor Unit."
            width={100}
            align="right"
            render={(_, record: IPrintLine) => formatCurrency(lineUnitPrice(record))}
          />
          <Table.Column
            title="Total"
            width={110}
            align="right"
            render={(_, record: IPrintLine) =>
              formatCurrency(lineUnitPrice(record) * (record.quantity || 0))
            }
          />
          <Table.Column
            title=""
            width={50}
            render={(__, _: IPrintLine, index: number) => (
              <Button
                size="small"
                danger
                type="link"
                icon={<Trash2 size={14} />}
                onClick={() => removeLine(index)}
              />
            )}
          />
        </Table>
      )}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 12,
        }}
      >
        <Button icon={<Plus size={14} />} onClick={addLine}>
          Adicionar Impressão
        </Button>
        {value.length > 0 && (
          <Text strong>Total impressões: {formatCurrency(printsTotal)}</Text>
        )}
      </div>
    </Card>
  );
};
