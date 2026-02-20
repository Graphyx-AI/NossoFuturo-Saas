import { cookies } from 'next/headers';

export function hasSupabaseSessionCookie() {
  const cookieStore = cookies();
  return cookieStore.getAll().some((c) => c.name.startsWith('sb-') && c.name.includes('auth-token') && c.value);
}
