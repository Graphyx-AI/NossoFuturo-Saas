import { NextResponse } from 'next/server';

function hasSupabaseCookie(request) {
  return request.cookies.getAll().some((c) => c.name.startsWith('sb-') && c.name.includes('auth-token') && c.value);
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  const needsAuth = pathname === '/' || pathname.startsWith('/prospeccao') || pathname.startsWith('/mvp');
  const isAuthPage = pathname.startsWith('/login');

  if (!needsAuth && !isAuthPage) return NextResponse.next();

  const hasSession = hasSupabaseCookie(request);

  if (needsAuth && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthPage && hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/mvp', '/prospeccao/:path*']
};
