import type { ThemeConfig } from 'antd';
import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

export const themeConfig: ThemeConfig = {
  token: {
    colorPrimary: '#E879A8',
    colorSuccess: '#6B8E23',
    borderRadius: 6,
  },
  components: {
    Menu: {
      darkItemBg: '#2D1B2E',
      darkItemColor: '#F5E6F0',
      darkItemSelectedBg: '#E879A833',
      darkItemSelectedColor: '#E879A8',
    },
  },
};

export const renderEmpty = (): ReactNode => (
  <div style={{ textAlign: 'center', padding: '32px 0' }}>
    <Inbox size={48} style={{ color: '#d9d9d9', marginBottom: 8 }} />
    <p style={{ color: '#999', margin: 0 }}>Nenhum registro encontrado</p>
  </div>
);
