import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  signUp: (username: string, password: string) => Promise<{ error: any }>;
  signIn: (username: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await checkAdminStatus(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await checkAdminStatus(session.user.id);
        } else {
          setIsAdmin(false);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (username: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email: `${username}@local.app`,
      password,
      options: {
        data: {
          username: username,
        },
      },
    });
    return { error };
  };

  const signIn = async (username: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: `${username}@local.app`,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
  };

  const checkAdminStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('is_admin')
        .eq('id', userId)
        .maybeSingle();

      if (!error && data) {
        setIsAdmin(data.is_admin || false);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
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