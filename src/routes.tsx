import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import DashboardPage from './pages/DashboardPage';
import WorkOrdersPage from './pages/WorkOrdersPage';
import ClientsPage from './pages/ClientsPage';
import InventoryPage from './pages/InventoryPage';
import PosPage from './pages/PosPage';
import BudgetsPage from './pages/BudgetsPage';
import PortalClientPage from './pages/PortalClientPage';
import MarketplacePage from './pages/MarketplacePage';
import SettingsPage from './pages/SettingsPage';
import AIProvidersPage from './pages/config/AIProvidersPage';
import AIPromptsPage from './pages/config/AIPromptsPage';
import AIRunsPage from './pages/config/AIRunsPage';
import AIMetricsPage from './pages/config/AIMetricsPage';
import DevHealthPage from './pages/DevHealthPage';

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<DashboardPage />} />
          <Route path="ot" element={<WorkOrdersPage />} />
          <Route path="clientes" element={<ClientsPage />} />
          <Route path="inventario" element={<InventoryPage />} />
          <Route path="pos" element={<PosPage />} />
          <Route path="presupuestos" element={<BudgetsPage />} />
          <Route path="portal" element={<PortalClientPage />} />
          <Route path="marketplace" element={<MarketplacePage />} />
          <Route path="config" element={<SettingsPage />} />
          <Route path="config/ai/providers" element={<AIProvidersPage />} />
          <Route path="config/ai/prompts" element={<AIPromptsPage />} />
          <Route path="config/ai/runs" element={<AIRunsPage />} />
          <Route path="config/ai/metrics" element={<AIMetricsPage />} />
          <Route path="dev/health" element={<DevHealthPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
