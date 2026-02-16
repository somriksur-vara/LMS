'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '@/lib/services/authService';
import { useRouter } from 'next/navigation';
import { User } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean }>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => ({ success: false }),
  logout: () => {},
  loading: true,
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {

    if (typeof window !== 'undefined') {
      const token = authService.getToken();
      const savedUser = authService.getCurrentUser();

      if (token && savedUser) {
        setUser(savedUser);
      }
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean }> => {
    try {
      console.log('AuthContext: Starting login...');
      const response = await authService.login(email, password);
      console.log('AuthContext: Login response:', response);


      const { accessToken, user: userData } = response.data;
      console.log('AuthContext: Token:', accessToken ? 'exists' : 'missing');
      console.log('AuthContext: User data:', userData);

      if (!accessToken || !userData) {
        throw new Error('Invalid response from server');
      }

      const userWithFullName: User = {
        ...userData,
        name: `${userData.firstName} ${userData.lastName}`,
      } as User;

      console.log('AuthContext: Saving auth...');
      authService.setAuth(accessToken, userWithFullName);

      console.log('AuthContext: Setting user state...');
      setUser(userWithFullName);

      console.log('AuthContext: Redirecting to dashboard...');

      setTimeout(() => {
        router.replace('/dashboard');
      }, 100);

      return { success: true };
    } catch (error) {
      console.error('AuthContext: Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    router.replace('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
