import { useState } from 'react';
import { Modal, Button, Alert, List, Typography, Upload, message } from 'antd';
import { UploadOutlined, InboxOutlined } from '@ant-design/icons';
import apiClient from '../providers/rest-client';

const { Dragger } = Upload;
const { Text } = Typography;

interface SkippedRow {
  line: number;
  reason: string;
}

interface ImportResult {
  total: number;
  created: number;
  skipped?: SkippedRow[];
}

interface CsvImportModalProps {
  open: boolean;
  onClose: () => void;
}

export const CsvImportModal = ({ open, onClose }: CsvImportModalProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await apiClient.post('/catalog/import/csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(data as ImportResult);
      message.success('Importação concluída!');
    } catch {
      message.error('Erro ao importar CSV. Verifique o arquivo.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    onClose();
  };

  return (
    <Modal
      title="Importar CSV"
      open={open}
      onCancel={handleClose}
      footer={null}
      width={600}
    >
      {!result ? (
        <>
          <Dragger
            accept=".csv"
            beforeUpload={(f) => {
              setFile(f);
              return false;
            }}
            onRemove={() => setFile(null)}
            fileList={
              file
                ? [{ uid: '-1', name: file.name, status: 'done' }]
                : []
            }
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">
              Clique ou arraste o arquivo CSV aqui
            </p>
            <p className="ant-upload-hint">
              Formato: ponto e vírgula (;), codificação UTF-8
            </p>
          </Dragger>
          <Button
            type="primary"
            icon={<UploadOutlined />}
            disabled={!file}
            loading={loading}
            onClick={handleUpload}
            style={{ marginTop: 16 }}
            block
          >
            Importar
          </Button>
        </>
      ) : (
        <>
          <Alert
            type="success"
            showIcon
            message="Importação concluída"
            description={`${result.created} de ${result.total} itens importados com sucesso.`}
            style={{ marginBottom: 16 }}
          />
          {result.skipped && result.skipped.length > 0 && (
            <>
              <Text strong>
                Linhas ignoradas ({result.skipped.length}):
              </Text>
              <List
                size="small"
                dataSource={result.skipped}
                renderItem={(item: SkippedRow) => (
                  <List.Item>
                    <Text>
                      Linha {item.line}: {item.reason}
                    </Text>
                  </List.Item>
                )}
                style={{ marginTop: 8 }}
              />
            </>
          )}
          <Button
            type="primary"
            onClick={handleClose}
            block
            style={{ marginTop: 16 }}
          >
            Concluído
          </Button>
        </>
      )}
    </Modal>
  );
};
