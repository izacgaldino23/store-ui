import { Refine, Authenticated } from '@refinedev/core';
import { ThemedLayoutV2, useNotificationProvider } from '@refinedev/antd';
import routerBindings from '@refinedev/react-router-v6';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { dataProvider } from './providers/data-provider';
import { authProvider } from './providers/auth-provider';
import { i18nProvider } from './i18n';
import { Logo } from './components/logo';
import { DashboardPage } from './pages/dashboard';
import { LoginPage } from './pages/login';
import { RegisterPage } from './pages/register';
import { ItemsListPage } from './pages/items/list';
import { ItemsCreatePage } from './pages/items/create';
import { ItemsEditPage } from './pages/items/edit';
import { ItemsShowPage } from './pages/items/show';
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
          { name: 'dashboard', list: '/' },
          {
            name: 'items',
            list: '/items',
            create: '/items/create',
            edit: '/items/:id/edit',
            show: '/items/:id',
            meta: { canDelete: true },
          },
          { name: 'orders', list: '/orders' },
          { name: 'price-table', list: '/price-table' },
          { name: 'cash-register', list: '/cash-register' },
          { name: 'expenses', list: '/expenses' },
        ]}
      >
        <Routes>
          <Route
            element={
              <Authenticated key="authenticated" redirectOnFail="/login">
                <ThemedLayoutV2 Title={Logo}>
                  <Outlet />
                </ThemedLayoutV2>
              </Authenticated>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="/items/create" element={<ItemsCreatePage />} />
            <Route path="/items/low-stock" element={<ItemsLowStockPage />} />
            <Route path="/items/:id/edit" element={<ItemsEditPage />} />
            <Route path="/items/:id" element={<ItemsShowPage />} />
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
