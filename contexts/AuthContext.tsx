
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../api/client';

interface LoginResponse {
  needs2FA: boolean;
  userId?: string;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<LoginResponse>;
  verifyOtp: (userId: string, code: string) => Promise<void>;
  logout: () => void;
  checkPermission: (allowedRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      const storedSession = localStorage.getItem('vjn_session');
      if (storedSession) {
        try {
          // Parse user object or token from storage
          const parsed = JSON.parse(storedSession);
          // If we have a user ID, validate it against the server to ensure session is fresh
          if (parsed && parsed.id) {
             // @ts-ignore
             const freshUser = await api.getUser(parsed.id);
             // Ensure user exists and is active
             if (freshUser && freshUser.status === 'ACTIVE') {
               setUser(freshUser);
               // Update cache with fresh data
               localStorage.setItem('vjn_session', JSON.stringify(freshUser));
             } else {
               console.warn("Session invalid or user inactive");
               localStorage.removeItem('vjn_session');
             }
          }
        } catch (e) {
          console.error("Session restore failed", e);
          localStorage.removeItem('vjn_session'); // Clear corrupt data
        }
      }
      setIsLoading(false);
    };
    
    restoreSession();
  }, []);

  const login = async (email: string, pass: string): Promise<LoginResponse> => {
    try {
        // @ts-ignore
        const response = await api.login(email, pass);
        
        if (response.status === '2FA_REQUIRED') {
            return { needs2FA: true, userId: response.userId, email: response.email };
        } else if (response.status === 'SUCCESS' && response.user) {
            setUser(response.user);
            localStorage.setItem('vjn_session', JSON.stringify(response.user));
            return { needs2FA: false };
        }
        
        throw new Error("Unexpected login response");
    } catch (e) {
        throw e;
    }
  };

  const verifyOtp = async (userId: string, code: string) => {
    try {
      // @ts-ignore
      const response = await api.verifyTwoFactor(userId, code);
      if (response.status === 'SUCCESS' && response.user) {
        setUser(response.user);
        localStorage.setItem('vjn_session', JSON.stringify(response.user));
      }
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
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, verifyOtp, logout, checkPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
