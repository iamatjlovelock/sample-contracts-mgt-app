import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { signIn, signOut, getCurrentUser, fetchAuthSession, fetchUserAttributes } from 'aws-amplify/auth';
import { configureAmplify, API_URL } from '../lib/amplify-config';
import type { AuthUser } from '../lib/types';

// Initialize Amplify on the client
configureAmplify();

interface AuthContextType {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  canPerformAction: (action: string) => boolean;
  getAuthHeaders: () => Record<string, string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserInfo = useCallback(async (token: string, groups: string[] = []) => {
    try {
      // Fetch user attributes from Cognito (includes custom:user_type)
      const attributes = await fetchUserAttributes();

      // Get user_type from Cognito custom attribute
      const userType = attributes['custom:user_type'];
      const name = attributes['custom:name'] || attributes['name'] || attributes['email'];

      const response = await fetch(`${API_URL}/api/auth/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userType,
          name,
        }),
      });

      if (response.ok) {
        const userInfo = await response.json();
        setUser({ ...userInfo, groups });
        setAccessToken(token);
        return true;
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Backend verify failed:', response.status, errorData);
        setError(`Backend verification failed: ${errorData.error || response.statusText}`);
      }
    } catch (err) {
      console.error('Failed to fetch user info:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to backend');
    }
    return false;
  }, []);

  // Check for existing session on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        await getCurrentUser();
        const session = await fetchAuthSession();
        const token = session.tokens?.accessToken?.toString();
        const idToken = session.tokens?.idToken;
        const groups = (idToken?.payload?.['cognito:groups'] as string[]) || [];

        if (token) {
          await fetchUserInfo(token, groups);
        }
      } catch {
        // Not authenticated
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
  }, [fetchUserInfo]);

  const login = async (username: string, password: string): Promise<boolean> => {
    setError(null);
    setIsLoading(true);

    try {
      const result = await signIn({ username, password });

      if (result.isSignedIn) {
        const session = await fetchAuthSession();
        const token = session.tokens?.accessToken?.toString();
        const idToken = session.tokens?.idToken;
        const groups = (idToken?.payload?.['cognito:groups'] as string[]) || [];

        if (token) {
          const success = await fetchUserInfo(token, groups);
          setIsLoading(false);
          return success;
        }
      }

      setError('Sign in failed');
      setIsLoading(false);
      return false;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';

      // Handle "already authenticated" error by fetching existing session
      if (errorMessage.includes('already') && errorMessage.toLowerCase().includes('sign')) {
        try {
          const session = await fetchAuthSession();
          const token = session.tokens?.accessToken?.toString();
          const idToken = session.tokens?.idToken;
          const groups = (idToken?.payload?.['cognito:groups'] as string[]) || [];

          if (token) {
            const success = await fetchUserInfo(token, groups);
            setIsLoading(false);
            return success;
          }
        } catch {
          // Session fetch failed, sign out and let user try again
          await signOut();
        }
      }

      setError(errorMessage);
      setIsLoading(false);
      return false;
    }
  };

  const logout = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    }
    setUser(null);
    setAccessToken(null);
  };

  const canPerformAction = (action: string): boolean => {
    if (!user) return false;
    return user.allowedActions.includes(action.toLowerCase());
  };

  const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {};
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    if (user?.userType) {
      headers['X-User-Type'] = user.userType;
    }
    return headers;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoading,
        error,
        login,
        logout,
        canPerformAction,
        getAuthHeaders,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
