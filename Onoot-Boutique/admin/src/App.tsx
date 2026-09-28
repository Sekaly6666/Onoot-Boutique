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

// Patch for React 18+ to prevent crashes when browser extensions (like Google Translate or Password Managers) mutate the DOM
if (typeof Node === 'function' && Node.prototype) {
  const originalRemoveChild = Node.prototype.removeChild;
  (Node.prototype as any).removeChild = function (child: any) {
    if (child.parentNode !== this) {
      if (console) {
        console.warn('Cannot remove a child from a different parent', child, this);
      }
      return child;
    }
    return originalRemoveChild.apply(this, arguments as any);
  };
  const originalInsertBefore = Node.prototype.insertBefore;
  (Node.prototype as any).insertBefore = function (newNode: any, referenceNode: any) {
    if (referenceNode && referenceNode.parentNode !== this) {
      if (console) {
        console.warn('Cannot insert before a reference node from a different parent', referenceNode, this);
      }
      return newNode;
    }
    return originalInsertBefore.apply(this, arguments as any);
  };
}

const queryClient = new QueryClient();
function App() {
  return (
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
  );
}

export default App;
