import { create } from 'zustand';
import { api } from '../services/api.service';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string, phone?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post<{ accessToken: string }>('/auth/login', { email, password });
      api.setToken(res.accessToken);
      const user = await api.get<User>('/users/me');
      set({ user, isAuthenticated: true, isLoading: false });
      return true;
    } catch (err: any) {
      set({ isLoading: false, error: err.message ?? 'Login failed' });
      return false;
    }
  },

  register: async (email, password, name, phone) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post<{ accessToken: string }>('/auth/register', { email, password, name, phone });
      api.setToken(res.accessToken);
      const user = await api.get<User>('/users/me');
      set({ user, isAuthenticated: true, isLoading: false });
      return true;
    } catch (err: any) {
      set({ isLoading: false, error: err.message ?? 'Registration failed' });
      return false;
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      api.setToken(null);
      set({ user: null, isAuthenticated: false, error: null });
    }
  },

  loadUser: async () => {
    set({ isLoading: true });
    await api.init();
    try {
      const user = await api.get<User>('/users/me');
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
