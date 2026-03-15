import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, getToken, setToken, clearToken } from './api';
import { Organizer } from './types';

interface AuthState {
  organizer: Organizer | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshOrganizer: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    organizer: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    async function init() {
      try {
        const token = await getToken();
        if (token) {
          const { organizer } = await authApi.me();
          setState({ organizer, isLoading: false, isAuthenticated: true });
        } else {
          setState({ organizer: null, isLoading: false, isAuthenticated: false });
        }
      } catch {
        await clearToken();
        setState({ organizer: null, isLoading: false, isAuthenticated: false });
      }
    }
    init();
  }, []);

  async function login(email: string, password: string) {
    const { token, organizer } = await authApi.login(email, password);
    await setToken(token);
    setState({ organizer, isLoading: false, isAuthenticated: true });
  }

  async function signup(name: string, email: string, password: string) {
    const { token, organizer } = await authApi.signup(name, email, password);
    await setToken(token);
    setState({ organizer, isLoading: false, isAuthenticated: true });
  }

  async function logout() {
    await clearToken();
    setState({ organizer: null, isLoading: false, isAuthenticated: false });
  }

  async function refreshOrganizer() {
    try {
      const { organizer } = await authApi.me();
      setState(prev => ({ ...prev, organizer }));
    } catch {
      // silently fail
    }
  }

  return (
    <AuthContext.Provider value={{ ...state, login, signup, logout, refreshOrganizer }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
