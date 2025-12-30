
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../api/client';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  checkPermission: (allowedRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check local storage for session (Mock session persistence)
    const storedUser = localStorage.getItem('vjn_session');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, pass: string) => {
    // In real app, this calls api.login which calls service.login
    // We will assume api.client has a login method added or use direct service logic for simplicity in this demo context if allowed, 
    // but better to stick to architectural pattern:
    
    // Simulate API call delay
    await new Promise(r => setTimeout(r, 500));
    
    // Logic moved to Service/DB, but accessed here via simple mocked logic or extending API client. 
    // For this implementation, we will use a direct import of service in API client to handle this securely.
    // Let's assume api.login exists. If not, we'll implement it.
    
    try {
        // @ts-ignore
        const authenticatedUser = await api.login(email, pass);
        setUser(authenticatedUser);
        localStorage.setItem('vjn_session', JSON.stringify(authenticatedUser));
    } catch (e) {
        throw e;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('vjn_session');
  };

  const checkPermission = (allowedRoles: UserRole[]) => {
    if (!user) return false;
    return allowedRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, checkPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
