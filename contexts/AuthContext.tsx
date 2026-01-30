
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User, UserRole } from '../types';
import { api } from '../api/client';

const SESSION_STORAGE_KEY = 'vjn_session';
const SESSION_EXPIRES_AT_KEY = 'vjn_session_expires_at';
const SESSION_DURATION_MS = 60 * 60 * 1000; // 60 minutes

const getSessionExpiresAt = (): number | null => {
  const raw = localStorage.getItem(SESSION_EXPIRES_AT_KEY);
  if (raw == null) return null;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
};

const isSessionExpired = (): boolean => {
  const expiresAt = getSessionExpiresAt();
  return expiresAt == null || Date.now() >= expiresAt;
};

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
    const clearSession = () => {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      localStorage.removeItem(SESSION_EXPIRES_AT_KEY);
      setUser(null);
    };

    const restoreSession = async () => {
      const storedSession = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!storedSession) {
        setIsLoading(false);
        return;
      }
      if (isSessionExpired()) {
        clearSession();
        setIsLoading(false);
        return;
      }
      try {
        const parsed = JSON.parse(storedSession);
        if (parsed && parsed.id) {
          // @ts-ignore
          const freshUser = await api.getUser(parsed.id);
          if (freshUser && freshUser.status === 'ACTIVE' && !isSessionExpired()) {
            setUser(freshUser);
            localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(freshUser));
          } else {
            clearSession();
          }
        } else {
          clearSession();
        }
      } catch (e) {
        console.error("Session restore failed", e);
        clearSession();
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
            const expiresAt = Date.now() + SESSION_DURATION_MS;
            localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(response.user));
            localStorage.setItem(SESSION_EXPIRES_AT_KEY, String(expiresAt));
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
        const expiresAt = Date.now() + SESSION_DURATION_MS;
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(response.user));
        localStorage.setItem(SESSION_EXPIRES_AT_KEY, String(expiresAt));
      }
    } catch (e) {
      throw e;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(SESSION_EXPIRES_AT_KEY);
  };

  // Auto-logout when session expires (check every 60 seconds)
  const logoutRef = useRef(logout);
  logoutRef.current = logout;
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      if (isSessionExpired()) {
        logoutRef.current();
      }
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

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
