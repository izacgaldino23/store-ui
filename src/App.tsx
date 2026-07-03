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
          { name: 'price-table', list: '/price-table', meta: { icon: <DollarSign size={20} /> } },
          { name: 'cash-register', list: '/cash-register', meta: { icon: <Banknote size={20} /> } },
          { name: 'expenses', list: '/expenses', meta: { icon: <TrendingDown size={20} /> } },
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
