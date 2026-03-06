import { create } from 'zustand';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'EMPLOYEE' | 'RECEPTION' | 'CLIENT';
}

interface AuthStore {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  initializeAuth: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  isInitialized: false,
  login: (user, token) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, token, isInitialized: true });
  },
  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    set({ user: null, token: null, isInitialized: true });
  },
  setLoading: (isLoading) => set({ isLoading }),
  initializeAuth: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('authToken');
      const userStr = localStorage.getItem('user');
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          set({ user, token, isInitialized: true });
        } catch (e) {
          console.error('Failed to parse user from localStorage:', e);
          set({ isInitialized: true });
        }
      } else {
        set({ isInitialized: true });
      }
    }
  },
}));

// Create convenience hook
export const useAuth = () => {
  const { user, token, isLoading, isInitialized, login, logout, setLoading, initializeAuth } = useAuthStore();
  return { user, token, isLoading, isInitialized, login, logout, setLoading, initializeAuth };
};
