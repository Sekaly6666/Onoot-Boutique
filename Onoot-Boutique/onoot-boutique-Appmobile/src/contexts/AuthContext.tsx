import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, pass: string, phone?: string) => Promise<{ success: boolean; error?: string }>;
  loginWithToken: (token: string, user?: User) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = '@onoot_auth_token';
const USER_KEY = '@onoot_auth_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const [storedToken, storedUser] = await Promise.all([
        AsyncStorage.getItem(TOKEN_KEY),
        AsyncStorage.getItem(USER_KEY),
      ]);

      if (storedToken) {
        setToken(storedToken);
      }
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }

      if (storedToken) {
        // Refresh profile in background
        api.getCurrentUser().then((freshUser) => {
          if (freshUser) {
            setUser(freshUser);
            AsyncStorage.setItem(USER_KEY, JSON.stringify(freshUser));
          }
        }).catch(() => {});
      }
    } catch (e) {
      console.error('Failed to load auth', e);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, pass: string) => {
    try {
      setIsLoading(true);
      const res = await api.login(email.trim().toLowerCase(), pass);
      if (res?.user && res?.token) {
        setUser(res.user);
        setToken(res.token);
        await Promise.all([
          AsyncStorage.setItem(TOKEN_KEY, res.token),
          AsyncStorage.setItem(USER_KEY, JSON.stringify(res.user)),
        ]);
        return { success: true };
      }
      return { success: false, error: 'Identifiants invalides' };
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Erreur lors de la connexion';
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, pass: string, phone?: string) => {
    try {
      setIsLoading(true);
      const res = await api.register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: pass,
        phone: phone?.trim(),
      });
      if (res?.user && res?.token) {
        setUser(res.user);
        setToken(res.token);
        await Promise.all([
          AsyncStorage.setItem(TOKEN_KEY, res.token),
          AsyncStorage.setItem(USER_KEY, JSON.stringify(res.user)),
        ]);
        return { success: true };
      }
      return { success: false, error: 'Inscription échouée' };
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || "Erreur lors de l'inscription";
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithToken = async (incomingToken: string, providedUser?: User) => {
    try {
      setIsLoading(true);
      setToken(incomingToken);
      await AsyncStorage.setItem(TOKEN_KEY, incomingToken);

      let currentUser: User | null | undefined = providedUser;
      if (!currentUser) {
        currentUser = await api.getCurrentUser(incomingToken);
      }

      if (currentUser) {
        setUser(currentUser);
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(currentUser));
        return { success: true };
      } else {
        const fallbackUser: User = {
          id: 'user-' + Date.now(),
          name: 'Client Onoot',
          email: 'client@onoot.ci',
          role: 'client',
        };
        setUser(fallbackUser);
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(fallbackUser));
        return { success: true };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Erreur lors de la synchronisation du compte' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    await Promise.all([
      AsyncStorage.removeItem(TOKEN_KEY),
      AsyncStorage.removeItem(USER_KEY),
    ]);
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const fresh = await api.getCurrentUser();
      if (fresh) {
        setUser(fresh);
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(fresh));
      }
    } catch (e) {
      // ignore
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        loginWithToken,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
