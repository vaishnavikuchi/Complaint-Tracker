import React, { createContext, useContext, useState } from 'react';
import type { LoginResponse } from '../types/index';

interface AuthContextType {
  isAdmin: boolean;
  token: string | null;
  adminUser: { username: string; role: 'admin' } | null;
  setAuth: (data: LoginResponse) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('admin_token');
  });

  const [adminUser, setAdminUser] = useState<{ username: string; role: 'admin' } | null>(() => {
    const saved = localStorage.getItem('admin_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const setAuth = (data: LoginResponse) => {
    setToken(data.token);
    setAdminUser(data.user);
    localStorage.setItem('admin_token', data.token);
    localStorage.setItem('admin_user', JSON.stringify(data.user));
  };

  const logout = () => {
    setToken(null);
    setAdminUser(null);
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
  };

  return (
    <AuthContext.Provider
      value={{
        isAdmin: !!token,
        token,
        adminUser,
        setAuth,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
