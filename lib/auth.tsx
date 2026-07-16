'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { api, clearToken, getToken, setToken } from './api';

interface User {
  id: string;
  email: string;
  role: string;
  displayName?: string | null;
}

interface AuthContextValue {
  user: User | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    // Always resolve `ready` inside .finally (async), never synchronously here.
    const load = getToken()
      ? api<User>('/auth/me')
          .then((u) => {
            if (active) setUser(u);
          })
          .catch(() => clearToken())
      : Promise.resolve();
    load.finally(() => {
      if (active) setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  async function login(email: string, password: string) {
    const res = await api<{ accessToken: string; user: User }>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    setToken(res.accessToken);
    setUser(res.user);
  }

  function logout() {
    clearToken();
    setUser(null);
    window.location.href = '/login';
  }

  return (
    <AuthContext.Provider value={{ user, ready, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
