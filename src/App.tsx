import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './prototype/app-shell'
import {
  DashboardScreen,
  ItemsScreen,
  LoginScreen,
  NewOrderScreen,
  OrderDetailScreen,
  OrdersScreen,
  PlaceholderScreen,
  RegisterScreen,
} from './prototype/screens'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/register" element={<RegisterScreen />} />
        <Route element={<AppShell />}>
          <Route index element={<DashboardScreen />} />
          <Route path="orders" element={<OrdersScreen />} />
          <Route path="orders/create" element={<NewOrderScreen />} />
          <Route path="orders/:id/edit" element={<PlaceholderScreen title="Editar pedido" />} />
          <Route path="orders/:id" element={<OrderDetailScreen />} />
          <Route path="items" element={<ItemsScreen />} />
          <Route path="items/create" element={<PlaceholderScreen title="Novo item" />} />
          <Route path="items/low-stock" element={<PlaceholderScreen title="Estoque baixo" />} />
          <Route path="items/:id/edit" element={<PlaceholderScreen title="Editar item" />} />
          <Route path="items/:id" element={<PlaceholderScreen title="Detalhes do item" />} />
          <Route path="printing" element={<PlaceholderScreen title="Impressão" />} />
          <Route path="clients" element={<PlaceholderScreen title="Clientes" />} />
          <Route path="pricing/table" element={<PlaceholderScreen title="Tabela de preços" />} />
          <Route path="pricing/table/create" element={<PlaceholderScreen title="Novo preço" />} />
          <Route path="pricing/table/:id/edit" element={<PlaceholderScreen title="Editar preço" />} />
          <Route path="pricing/calculator" element={<PlaceholderScreen title="Calculadora de margem" />} />
          <Route path="cash-flow/current" element={<PlaceholderScreen title="Caixa atual" />} />
          <Route path="cash-flow/daily-report" element={<PlaceholderScreen title="Relatório diário" />} />
          <Route path="cash-flow/history" element={<PlaceholderScreen title="Histórico do caixa" />} />
          <Route path="cash-flow/expenses" element={<PlaceholderScreen title="Despesas" />} />
          <Route path="reports" element={<PlaceholderScreen title="Relatórios" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
