import { create } from 'zustand';

interface UIState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  isTabBarVisible: boolean;
  setTabBarVisible: (v: boolean) => void;
}

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number;
}

let toastCounter = 0;

export const useUIStore = create<UIState>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = `toast-${++toastCounter}`;
    set(state => ({ toasts: [...state.toasts, { ...toast, id }] }));
    const duration = toast.duration ?? 3500;
    setTimeout(() => {
      set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }));
    }, duration);
  },
  removeToast: (id) => set(state => ({ toasts: state.toasts.filter(t => t.id !== id) })),
  isTabBarVisible: true,
  setTabBarVisible: (v) => set({ isTabBarVisible: v }),
}));
