import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const refreshToken = request.cookies.get('refresh_token');
  const isAuthRoute = request.nextUrl.pathname.startsWith('/login') || 
                      request.nextUrl.pathname.startsWith('/register');
  const isApiRoute = request.nextUrl.pathname.startsWith('/api');
  const isAppRoute = request.nextUrl.pathname.startsWith('/dashboard') ||
                     request.nextUrl.pathname.startsWith('/character') ||
                     request.nextUrl.pathname.startsWith('/session');
  
  if (isAppRoute && !refreshToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  if (isAuthRoute && refreshToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
