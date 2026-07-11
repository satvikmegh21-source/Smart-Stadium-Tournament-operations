import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('accessToken')?.value;
  const role = request.cookies.get('userRole')?.value;

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup') || pathname.startsWith('/forgot-password');
  const isDashboardPage = pathname.startsWith('/dashboard');
  const isAdminPage = pathname.startsWith('/dashboard/admin');

  // 1. If trying to access dashboard/admin without a token, redirect to login
  if (isDashboardPage && !token) {
    const url = new URL('/login', request.url);
    // Remember origin
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // 2. If logged in and trying to access login/signup/forgot-password, redirect to dashboard
  if (isAuthPage && token) {
    if (role === 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/dashboard/admin', request.url));
    }
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 3. RBAC: Non-admin trying to access Super Admin routes
  if (isAdminPage && role !== 'SUPER_ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login',
    '/signup',
    '/forgot-password',
  ],
};
