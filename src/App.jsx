import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import UploadOrdersPage from './pages/UploadOrdersPage';
import ConfirmedOrdersPage from './pages/ConfirmedOrdersPage';
import PendingOrdersPage from './pages/PendingOrdersPage';
import PreCancelledOrdersPage from './pages/PreCancelledOrdersPage';
import CancelledOrdersPage from './pages/CancelledOrdersPage';
import HoldOrdersPage from './pages/HoldOrdersPage';
import VoidedOrdersPage from './pages/VoidedOrdersPage';
import BlacklistedCustomersPage from './pages/BlacklistedCustomersPage';
import BlacklistedOrdersPage from './pages/BlacklistedOrdersPage';
import DashboardPage from './pages/DashboardPage';
import ProcessedOrdersPage from './pages/ProcessedOrdersPage';

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/upload" replace />} />
        <Route path="/upload" element={<UploadOrdersPage />} />
        <Route path="/confirmed" element={<ConfirmedOrdersPage />} />
        <Route path="/pending" element={<PendingOrdersPage />} />
        <Route path="/pre-cancelled" element={<PreCancelledOrdersPage />} />
        <Route path="/cancelled" element={<CancelledOrdersPage />} />
        <Route path="/hold" element={<HoldOrdersPage />} />
        <Route path="/voided" element={<VoidedOrdersPage />} />
        <Route path="/blacklisted-customers" element={<BlacklistedCustomersPage />} />
        <Route path="/blacklisted-orders" element={<BlacklistedOrdersPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/processed" element={<ProcessedOrdersPage />} />
        <Route path="*" element={<Navigate to="/upload" replace />} />
      </Route>
    </Routes>
  </BrowserRouter>
);

export default App;
