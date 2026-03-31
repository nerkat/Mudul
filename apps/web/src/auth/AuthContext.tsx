import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { AuthSession, GoogleLoginRequest, AuthError, Permission } from './types';
import { authService } from './AuthService';
import { hasPermission } from './types';

interface AuthContextValue {
  // Auth state
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: AuthError | null;

  // Auth actions
  loginWithGoogle: (request: GoogleLoginRequest) => Promise<void>;
  loginAsDemo: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;

  // Permission checking
  hasPermission: (permission: Permission) => boolean;
  
  // User info shortcuts
  user: AuthSession['user'] | null;
  organization: AuthSession['organization'] | null;
  membership: AuthSession['membership'] | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        
        // Check for existing session
        const existingSession = authService.getCurrentSession();
        
        if (existingSession) {
          // Check if token needs refresh
          if (authService.shouldRefreshToken()) {
            try {
              const refreshedSession = await authService.refreshToken();
              setSession(refreshedSession);
            } catch (refreshError) {
              // Refresh failed, clear session
              await authService.logout();
              setSession(null);
            }
          } else {
            setSession(existingSession);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setSession(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Auto-refresh token before expiry
  useEffect(() => {
    if (!session) return;

    const checkTokenRefresh = async () => {
      if (authService.shouldRefreshToken()) {
        try {
          const refreshedSession = await authService.refreshToken();
          setSession(refreshedSession);
        } catch (error) {
          console.error('Token refresh failed:', error);
          // Don't automatically log out on refresh failure
          // Let the user continue until they make a request that fails
        }
      }
    };

    // Check every minute
    const interval = setInterval(checkTokenRefresh, 60 * 1000);
    return () => clearInterval(interval);
  }, [session]);

  const loginWithGoogle = useCallback(async (request: GoogleLoginRequest) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await authService.loginWithGoogle(request);
      setSession(response.session);
    } catch (error) {
      const authError = error as AuthError;
      setError(authError);
      throw authError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginAsDemo = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await authService.loginAsDemo();
      setSession(response.session);
    } catch (error) {
      const authError = error as AuthError;
      setError(authError);
      throw authError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      await authService.logout();
      setSession(null);
    } catch (error) {
      const authError = error as AuthError;
      setError(authError);
      throw authError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const checkPermission = useCallback((permission: Permission): boolean => {
    if (!session?.membership) return false;
    return hasPermission(session.membership.role, permission);
  }, [session]);

  const value: AuthContextValue = {
    // Auth state
    session,
    isAuthenticated: !!session,
    isLoading,
    error,

    // Auth actions
    loginWithGoogle,
    loginAsDemo,
    logout,
    clearError,

    // Permission checking
    hasPermission: checkPermission,

    // Shortcuts
    user: session?.user || null,
    organization: session?.organization || null,
    membership: session?.membership || null
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}