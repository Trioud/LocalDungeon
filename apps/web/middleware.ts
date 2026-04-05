import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const refreshToken = request.cookies.get('refresh_token');

  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register');
  const isAppRoute =
    pathname === '/' ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/characters') ||
    pathname.startsWith('/session');

  // Root path: send to dashboard if logged in, login if not
  if (pathname === '/') {
    return NextResponse.redirect(
      new URL(refreshToken ? '/dashboard' : '/login', request.url)
    );
  }

  if (isAppRoute && !refreshToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  if (isAuthRoute && refreshToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  return NextResponse.next();
}

export const config = {
  // Exclude static files, images, and all /api/* routes from middleware
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
};
