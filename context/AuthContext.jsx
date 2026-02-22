'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured, getSupabaseConfigErrorMessage } from '@/lib/supabase';
import { resolveWorkspaceForUser } from '@/lib/workspaces';
import { isE2EMockModeEnabled } from '@/lib/mock-mode';

const AuthContext = createContext(null);
const MOCK_SESSION_KEY = 'crm:e2e:session';

function loadMockSession() {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(MOCK_SESSION_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (!parsed?.user) return null;
    if (!parsed.workspace) {
      parsed.workspace = resolveWorkspaceForUser(parsed.user);
    }
    if (!parsed.workspace) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveMockSession(user, workspace) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify({ user, workspace }));
}

function clearMockSession() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(MOCK_SESSION_KEY);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const allowE2EBootstrap =
      process.env.NODE_ENV !== 'production' &&
      typeof window !== 'undefined' &&
      window.localStorage.getItem('crm:e2e:bootstrap') === '1';

    if (allowE2EBootstrap) {
      const session = loadMockSession();
      setUser(session?.user ?? null);
      setWorkspace(session?.workspace ?? null);
      setLoading(false);
      return undefined;
    }

    if (isE2EMockModeEnabled()) {
      const session = loadMockSession();
      setUser(session?.user ?? null);
      setWorkspace(session?.workspace ?? null);
      setLoading(false);
      return undefined;
    }

    if (!isSupabaseConfigured) {
      setUser(null);
      setWorkspace(null);
      setLoading(false);
      return undefined;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      setWorkspace(resolveWorkspaceForUser(nextUser));
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      setWorkspace(resolveWorkspaceForUser(nextUser));
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    if (isE2EMockModeEnabled()) {
      const normalizedEmail = String(email || '').trim().toLowerCase();
      const workspaceId =
        normalizedEmail.includes('lumyf') || normalizedEmail.includes('lumify')
          ? 'lumyf'
          : 'graphyx';

      const mockUser = {
        id: `mock-user-${workspaceId}`,
        email: normalizedEmail || `${workspaceId}@mock.local`,
        app_metadata: { workspace: workspaceId },
        user_metadata: { workspace: workspaceId }
      };

      const resolvedWorkspace = resolveWorkspaceForUser(mockUser);
      setUser(mockUser);
      setWorkspace(resolvedWorkspace);
      saveMockSession(mockUser, resolvedWorkspace);
      return { user: mockUser };
    }

    if (!isSupabaseConfigured) {
      throw new Error(getSupabaseConfigErrorMessage());
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const allowedWorkspace = resolveWorkspaceForUser(data?.user);
    if (!allowedWorkspace) {
      await supabase.auth.signOut();
      throw new Error('Usuario sem workspace autorizado.');
    }

    return data;
  };

  const signOut = async () => {
    setUser(null);
    setWorkspace(null);
    clearMockSession();

    if (isE2EMockModeEnabled()) {
      return;
    }

    if (!isSupabaseConfigured) return;

    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const isAuthenticated = !!user && !!workspace;

  return (
    <AuthContext.Provider value={{ user, workspace, loading, signIn, signOut, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

