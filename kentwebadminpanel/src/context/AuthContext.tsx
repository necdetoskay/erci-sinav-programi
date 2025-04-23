import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, refreshAccessToken } from '../services/auth.service';

// Kullanıcı tipi tanımlama
interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  roles?: string[];
}

// Auth context için tip tanımlama
interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (token: string, refreshToken: string, userData: User) => void;
  logout: () => void;
  register: (userData: any) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

// Context oluşturma
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider bileşeni
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Başlangıçta true olarak ayarla
  const [error, setError] = useState<string | null>(null);

  // Token kontrolü ve yenileme
  const checkAndRefreshToken = async () => {
    const token = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refreshToken');
    const savedUser = localStorage.getItem('user');
    
    if (!token || !refreshToken || !savedUser) {
      return false;
    }

    try {
      // Önce token'ın geçerliliğini kontrol et
      await getCurrentUser();
      return true;
    } catch (error) {
      try {
        // Token geçersizse yenilemeyi dene
        const response = await refreshAccessToken(refreshToken);
        localStorage.setItem('token', response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken);
        return true;
      } catch (refreshError) {
        // Yenileme başarısız olursa çıkış yap
        logout();
        return false;
      }
    }
  };

  // Uygulama başladığında oturum kontrolü
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const isValid = await checkAndRefreshToken();
        
        if (isValid) {
          const savedUser = localStorage.getItem('user');
          if (savedUser) {
            try {
              const parsedUser = JSON.parse(savedUser);
              setIsAuthenticated(true);
              setUser(parsedUser);
            } catch (parseError) {
              console.error('User data parse error:', parseError);
              logout();
            }
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Giriş işlemi
  const login = async (token: string, refreshToken: string, userData: User) => {
    try {
      setIsLoading(true);
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(userData));
      setIsAuthenticated(true);
      setUser(userData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Giriş işlemi başarısız oldu');
    } finally {
      setIsLoading(false);
    }
  };

  // Kayıt işlemi
  const register = async (userData: any) => {
    try {
      setIsLoading(true);
      // API çağrısı burada yapılacak
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error('Kayıt işlemi başarısız oldu');
      }

      const data = await response.json();
      login(data.token, data.refreshToken, data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt işlemi başarısız oldu');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Çıkış işlemi
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
  };

  // Hata temizleme
  const clearError = () => {
    setError(null);
  };

  // Context değerlerini sağla
  return (
    <AuthContext.Provider 
      value={{ 
        isAuthenticated, 
        user, 
        login, 
        logout,
        register,
        isLoading,
        error,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for easy context access
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 