import React from 'react';
import { Navigate } from 'react-router-dom';

const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('adminToken');
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Vérifier si le token JWT a expiré
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        localStorage.removeItem('adminToken');
        return <Navigate to="/login?expired=true" replace />;
      }
    }
  } catch {
    // Si format invalide, ne pas bloquer si c'est un token personnalisé valide
  }

  return <>{children}</>;
};

export default RequireAuth;
