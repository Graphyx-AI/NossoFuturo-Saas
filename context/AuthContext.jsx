'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured, getSupabaseConfigErrorMessage } from '@/lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tenantId, setTenantId] = useState(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setUser(null);
      setLoading(false);
      return undefined;
    }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('active_tenant_id')
          .eq('id', currentUser.id)
          .single();
        setTenantId(profile?.active_tenant_id || null);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (!currentUser) {
        setTenantId(null);
        return;
      }
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('active_tenant_id')
        .eq('id', currentUser.id)
        .single();
      setTenantId(profile?.active_tenant_id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    if (!isSupabaseConfigured) {
      throw new Error(getSupabaseConfigErrorMessage());
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    if (!isSupabaseConfigured) return;
    await supabase.auth.signOut();
    setTenantId(null);
  };



  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (tenantId) localStorage.setItem('active-tenant-id', tenantId);
    else localStorage.removeItem('active-tenant-id');
  }, [tenantId]);

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, isAuthenticated, tenantId }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
