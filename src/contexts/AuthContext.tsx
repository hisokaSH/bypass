import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type User = {
  id: string;
  username: string;
  isAdmin: boolean;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  signUp: (username: string, password: string) => Promise<{ error: any }>;
  signIn: (username: string, password: string) => Promise<{ error: any; isAdmin?: boolean }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    console.log('🔍 AuthContext Init - Raw localStorage:', storedUser);
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        console.log('🔍 AuthContext Init - Parsed user:', userData);
        console.log('🔍 AuthContext Init - isAdmin value:', userData.isAdmin);
        setUser(userData);
        setIsAdmin(userData.isAdmin || false);
        console.log('🔍 AuthContext Init - Set isAdmin to:', userData.isAdmin || false);
      } catch (error) {
        console.error('🔍 AuthContext Init - Parse error:', error);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const signUp = async (username: string, password: string) => {
    try {
      const { data, error } = await supabase.rpc('register_user', {
        p_username: username,
        p_password: password,
      });

      if (error) {
        return { error: { message: error.message } };
      }

      if (!data.success) {
        return { error: { message: data.error } };
      }

      const userData = {
        id: data.user_id,
        username: username,
        isAdmin: false,
      };

      setUser(userData);
      setIsAdmin(false);
      localStorage.setItem('user', JSON.stringify(userData));

      return { error: null };
    } catch (error: any) {
      return { error: { message: error.message || 'Registration failed' } };
    }
  };

  const signIn = async (username: string, password: string) => {
    try {
      const { data, error } = await supabase.rpc('authenticate_user', {
        p_username: username,
        p_password: password,
      });

      if (error) {
        console.error('Auth error:', error);
        return { error: { message: error.message } };
      }

      if (!data.success) {
        return { error: { message: data.error } };
      }

      console.log('🔍 SignIn - API Response:', data);
      console.log('🔍 SignIn - is_admin from API:', data.is_admin);

      const userData = {
        id: data.user_id,
        username: data.username,
        isAdmin: data.is_admin || false,
      };

      console.log('🔍 SignIn - userData to save:', userData);

      // Save to localStorage FIRST before updating state
      localStorage.setItem('user', JSON.stringify(userData));
      console.log('🔍 SignIn - Saved to localStorage');

      // Verify it was saved
      const verify = localStorage.getItem('user');
      console.log('🔍 SignIn - Verify localStorage:', verify);

      // Then update state
      setUser(userData);
      setIsAdmin(data.is_admin || false);
      console.log('🔍 SignIn - Updated React state - isAdmin:', data.is_admin || false);

      return { error: null, isAdmin: data.is_admin || false };
    } catch (error: any) {
      console.error('Login exception:', error);
      return { error: { message: error.message || 'Login failed' } };
    }
  };

  const signOut = async () => {
    setUser(null);
    setIsAdmin(false);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, signUp, signIn, signOut }}>
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