// src/App.tsx - Onoot Admin v1.0.2 (Build Sync 2026-10-01)
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Categories from './pages/Categories';
import Reviews from './pages/Reviews';
import Notifications from './pages/Notifications';
import VerifyDelivery from './pages/VerifyDelivery';
import Settings from './pages/Settings';
import DeliveryDrivers from './pages/DeliveryDrivers';
import AdsVideos from './pages/AdsVideos';
import AdminLayout from './components/AdminLayout';
import RequireAuth from './components/RequireAuth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import React, { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class AdminErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ADMIN ERROR BOUNDARY]", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', padding: '20px', textAlign: 'center', background: '#f8fafc', color: '#0f172a' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '12px' }}>Onoot Administration</h2>
          <p style={{ color: '#64748b', maxWidth: '420px', marginBottom: '24px' }}>
            Une erreur est survenue lors de l'affichage. Veuillez recharger la page ou vous reconnecter.
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => window.location.reload()}
              style={{ padding: '10px 20px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
            >
              Recharger
            </button>
            <button
              onClick={() => { localStorage.removeItem('adminToken'); window.location.href = '/login'; }}
              style={{ padding: '10px 20px', background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
            >
              Page de Connexion
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const queryClient = new QueryClient();
function App() {
  return (
    <AdminErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<RequireAuth><AdminLayout /></RequireAuth>}>
              <Route path="/admin/dashboard" element={<Dashboard />} />
              <Route path="/admin/users" element={<Users />} />
              <Route path="/admin/delivery-drivers" element={<DeliveryDrivers />} />
              <Route path="/admin/ads-videos" element={<AdsVideos />} />
              <Route path="/admin/products" element={<Products />} />
              <Route path="/admin/orders" element={<Orders />} />
              <Route path="/admin/orders/verify/:id" element={<VerifyDelivery />} />
              <Route path="/admin/categories" element={<Categories />} />
              <Route path="/admin/reviews" element={<Reviews />} />
              <Route path="/admin/payments" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/admin/notifications" element={<Notifications />} />
              <Route path="/admin/settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </AdminErrorBoundary>
  );
}

export default App;
