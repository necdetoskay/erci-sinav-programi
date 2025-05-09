'use client';

import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { UserPayload } from '@/lib/jwt-auth';
import { useLoading } from '@/providers/loading-provider'; // LoadingProvider'dan hook'u import et

interface AuthContextType {
  user: UserPayload | null;
  isAuthenticated: boolean;
  isLoading: boolean; // Bu, Auth işlemlerinin yüklenme durumudur
  login: (email: string, password: string, rememberMe?: boolean) => Promise<UserPayload | null>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<UserPayload | null>;
  fetchUser: () => Promise<UserPayload | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserPayload | null>(null);
  const { setIsLoading: setGlobalIsLoading, isLoading: isGlobalLoading } = useLoading();

  const fetchUserCallback = useCallback(async (): Promise<UserPayload | null> => {
    setGlobalIsLoading(true);
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        return data.user;
      } else {
        setUser(null);
        if (response.status !== 401) { // 401 normal, diğer hataları logla
          console.error('Auth Provider: Failed to fetch user:', response.status, await response.text());
        } else {
          console.log('Auth Provider: No active session found (fetchUser).');
        }
      }
    } catch (error) {
      console.error('Auth Provider: Error fetching user:', error);
      setUser(null);
    } finally {
      setGlobalIsLoading(false);
    }
    return null;
  }, [setGlobalIsLoading]);

  useEffect(() => {
    // Sayfa ilk yüklendiğinde kullanıcıyı çekmeyi dene
    fetchUserCallback();
  }, [fetchUserCallback]);

  const login = async (email: string, password: string, rememberMe: boolean = false): Promise<UserPayload | null> => {
    setGlobalIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe }),
      });
      const data = await response.json();
      if (response.ok) {
        setUser(data.user); // Kullanıcı state'ini güncelle
        return data.user;
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (error) {
      setUser(null); // Hata durumunda kullanıcıyı temizle
      console.error('Login error:', error);
      throw error;
    } finally {
      setGlobalIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name?: string): Promise<UserPayload | null> => {
    setGlobalIsLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await response.json();
      if (response.ok) {
        console.log('Registration successful:', data.message);
        // Kayıt sonrası otomatik giriş yapılmaz, kullanıcı login olmalı.
        return data.user;
      } else {
        throw new Error(data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setGlobalIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setGlobalIsLoading(true);
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (response.ok) {
        setUser(null);
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
      setUser(null); // Her durumda kullanıcıyı client'tan temizle
      // throw error; // İsteğe bağlı: UI'da hata göstermek için
    } finally {
      setGlobalIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading: isGlobalLoading, // Global yükleme durumunu kullan
        login,
        logout,
        register,
        fetchUser: fetchUserCallback,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
