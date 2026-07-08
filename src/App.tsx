import { Refine, Authenticated } from '@refinedev/core';
import { ThemedLayoutV2, ThemedSiderV2, useNotificationProvider } from '@refinedev/antd';
import routerBindings from '@refinedev/react-router-v6';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  DollarSign,
  Banknote,
  TrendingDown,
} from 'lucide-react';
import { dataProvider } from './providers/data-provider';
import { authProvider } from './providers/auth-provider';
import { i18nProvider } from './i18n';
import { Logo } from './components/logo';
import { DashboardPage } from './pages/dashboard';
import { LoginPage } from './pages/login';
import { RegisterPage } from './pages/register';
import { ItemsListPage } from './pages/items/list';
import { ItemsLowStockPage } from './pages/items/low-stock';
import { OrdersListPage } from './pages/orders/list';
import { OrdersCreatePage } from './pages/orders/create';
import { OrdersShowPage } from './pages/orders/show';
import { PriceTableListPage } from './pages/price-table/list';
import { PriceTableCreatePage } from './pages/price-table/create';
import { PriceTableEditPage } from './pages/price-table/edit';
import { CalculatorPage } from './pages/pricing/calculator';
import { CashFlowCurrentPage } from './pages/cash-flow/current';
import { DailyReportPage } from './pages/cash-flow/daily-report';
import { CashFlowHistoryPage } from './pages/cash-flow/history';
import { ExpensesPage } from './pages/cash-flow/expenses';

function App() {
  return (
    <BrowserRouter>
      <Refine
        dataProvider={dataProvider}
        authProvider={authProvider}
        routerProvider={routerBindings}
        notificationProvider={useNotificationProvider}
        i18nProvider={i18nProvider}
        resources={[
          { name: 'dashboard', list: '/', meta: { icon: <LayoutDashboard size={20} /> } },
          {
            name: 'items',
            list: '/items',
            meta: { icon: <Package size={20} />, canDelete: true },
          },
          { name: 'orders', list: '/orders', meta: { icon: <ShoppingCart size={20} /> } },
          {
            name: 'pricing',
            meta: { icon: <DollarSign size={20} />, label: 'Precificação' },
          },
          {
            name: 'price-table',
            list: '/pricing/table',
            create: '/pricing/table/create',
            edit: '/pricing/table/:id/edit',
            meta: { parentName: 'pricing', label: 'Tabela de Preços' },
          },
          {
            name: 'calculator',
            list: '/pricing/calculator',
            meta: { parentName: 'pricing', label: 'Calculadora de Margem' },
          },
          {
            name: 'cash-flow',
            meta: { icon: <Banknote size={20} />, label: 'Fluxo de Caixa' },
          },
          {
            name: 'cash-register',
            list: '/cash-flow/current',
            meta: { parentName: 'cash-flow', label: 'Caixa Atual' },
          },
          {
            name: 'daily-report',
            list: '/cash-flow/daily-report',
            meta: { parentName: 'cash-flow', label: 'Relatório Diário' },
          },
          {
            name: 'cash-flow-history',
            list: '/cash-flow/history',
            meta: { parentName: 'cash-flow', label: 'Histórico' },
          },
          {
            name: 'expenses',
            list: '/cash-flow/expenses',
            meta: { parentName: 'cash-flow', label: 'Despesas' },
          },
        ]}
      >
        <Routes>
          <Route
            element={
              <Authenticated key="authenticated" redirectOnFail="/login">
                <ThemedLayoutV2 Title={Logo} Sider={(props) => <ThemedSiderV2 {...props} fixed />}>
                  <Outlet />
                </ThemedLayoutV2>
              </Authenticated>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="/items/low-stock" element={<ItemsLowStockPage />} />
            <Route path="/items" element={<ItemsListPage />} />
            <Route path="/orders" element={<OrdersListPage />} />
            <Route path="/orders/create" element={<OrdersCreatePage />} />
            <Route path="/orders/:id" element={<OrdersShowPage />} />
            <Route path="/pricing/table" element={<PriceTableListPage />} />
            <Route path="/pricing/table/create" element={<PriceTableCreatePage />} />
            <Route path="/pricing/table/:id/edit" element={<PriceTableEditPage />} />
            <Route path="/pricing/calculator" element={<CalculatorPage />} />
            <Route path="/cash-flow/current" element={<CashFlowCurrentPage />} />
            <Route path="/cash-flow/daily-report" element={<DailyReportPage />} />
            <Route path="/cash-flow/history" element={<CashFlowHistoryPage />} />
            <Route path="/cash-flow/expenses" element={<ExpensesPage />} />
            <Route path="*" element={<DashboardPage />} />
          </Route>
          <Route
            path="/login"
            element={
              <Authenticated key="auth" fallback={<LoginPage />}>
                <Navigate to="/" />
              </Authenticated>
            }
          />
          <Route
            path="/register"
            element={
              <Authenticated key="register" fallback={<RegisterPage />}>
                <Navigate to="/" />
              </Authenticated>
            }
          />
        </Routes>
      </Refine>
    </BrowserRouter>
  );
}

export default App;
