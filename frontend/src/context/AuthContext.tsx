'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useRouter } from 'next/navigation';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<unknown>;
  googleLogin: (credential: string) => Promise<unknown>;
  register: (email: string, password: string, name: string, role?: string) => Promise<unknown>;
  logout: () => Promise<void>;
  verifyEmailToken: (token: string) => Promise<unknown>;
  verifyOtpToken: (email: string, otp: string) => Promise<unknown>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Load user on mount
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('currentUser');
      }
    }
    setLoading(false);
  }, []);

  const saveAuthSession = (userData: User, tokens: { accessToken: string; refreshToken: string }) => {
    setUser(userData);
    localStorage.setItem('currentUser', JSON.stringify(userData));
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);

    // Save tokens and role as cookies so server middleware can access them
    document.cookie = `accessToken=${tokens.accessToken}; path=/; max-age=604800; SameSite=Lax`;
    document.cookie = `userRole=${userData.role}; path=/; max-age=604800; SameSite=Lax`;
    document.cookie = `isVerified=${userData.isVerified}; path=/; max-age=604800; SameSite=Lax`;
  };

  const clearAuthSession = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    // Remove cookies
    document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax';
    document.cookie = 'userRole=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax';
    document.cookie = 'isVerified=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax';
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const { user: userData, tokens } = res.data.data;
      saveAuthSession(userData, tokens);
      
      // Redirect based on role
      if (userData.role === 'SUPER_ADMIN') {
        router.push('/dashboard/admin');
      } else {
        router.push('/dashboard');
      }
      return res.data;
    } catch (error: unknown) {
      clearAuthSession();
      throw (error as { response?: { data?: unknown } })?.response?.data || error;
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = async (credential: string) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/google-login', { credential });
      const { user: userData, tokens } = res.data.data;
      saveAuthSession(userData, tokens);
      router.push('/dashboard');
      return res.data;
    } catch (error: unknown) {
      clearAuthSession();
      throw (error as { response?: { data?: unknown } })?.response?.data || error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string, role?: string) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/register', { email, password, name, role });
      return res.data;
    } catch (error: unknown) {
      throw (error as { response?: { data?: unknown } })?.response?.data || error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('refreshToken');
      if (token) {
        await api.post('/auth/logout', { token });
      }
    } catch (e) {
      console.error('Logout error', e);
    } finally {
      clearAuthSession();
      router.push('/login');
      setLoading(false);
    }
  };

  const verifyEmailToken = async (token: string) => {
    try {
      const res = await api.post('/auth/verify-email', { token });
      // update state if currently logged in
      if (user) {
        const updated = { ...user, isVerified: true };
        setUser(updated);
        localStorage.setItem('currentUser', JSON.stringify(updated));
        document.cookie = `isVerified=true; path=/; max-age=604800; SameSite=Lax`;
      }
      return res.data;
    } catch (error: unknown) {
      throw (error as { response?: { data?: unknown } })?.response?.data || error;
    }
  };

  const verifyOtpToken = async (email: string, otp: string) => {
    try {
      const res = await api.post('/auth/verify-otp', { email, otp });
      if (user && user.email === email) {
        const updated = { ...user, isVerified: true };
        setUser(updated);
        localStorage.setItem('currentUser', JSON.stringify(updated));
        document.cookie = `isVerified=true; path=/; max-age=604800; SameSite=Lax`;
      }
      return res.data;
    } catch (error: unknown) {
      throw (error as { response?: { data?: unknown } })?.response?.data || error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        googleLogin,
        register,
        logout,
        verifyEmailToken,
        verifyOtpToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
