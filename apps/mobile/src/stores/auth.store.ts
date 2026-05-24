import { create } from 'zustand';
import { api } from '../services/api.service';

interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; name: string }) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const res = await api.post<{ accessToken: string }>('/auth/login', { email, password });
      api.setToken(res.accessToken);
      const user = await api.get<User>('/users/me');
      set({ user, isAuthenticated: true });
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (data) => {
    set({ isLoading: true });
    try {
      const res = await api.post<{ accessToken: string }>('/auth/register', data);
      api.setToken(res.accessToken);
      const user = await api.get<User>('/users/me');
      set({ user, isAuthenticated: true });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      api.setToken(null);
      set({ user: null, isAuthenticated: false });
    }
  },

  loadUser: async () => {
    await api.init();
    try {
      const user = await api.get<User>('/users/me');
      set({ user, isAuthenticated: true });
    } catch {
      set({ user: null, isAuthenticated: false });
    }
  },
}));
