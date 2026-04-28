import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/session';

const PUBLIC_ROUTES = ['/login', '/register'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('session')?.value;
  const session = token ? await decrypt(token) : null;
  const isAuthenticated = !!session;
  const isPublicRoute = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));

  if (!isAuthenticated && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAuthenticated && isPublicRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.svg).*)'],
};
