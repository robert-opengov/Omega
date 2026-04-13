import { NextResponse, type NextRequest } from 'next/server';
import {
  publicRoutes,
  publicPrefixes,
  authOnlyRoutes,
  loginRedirect,
  homeRedirect,
} from '@/config/routes.config';
import { authConfig } from '@/config/auth.config';

function isPublicRoute(pathname: string): boolean {
  if (publicRoutes.some((r) => pathname === r || pathname.startsWith(r + '/'))) return true;
  return publicPrefixes.some((prefix) => pathname.startsWith(prefix));
}

function isAuthOnlyRoute(pathname: string): boolean {
  return authOnlyRoutes.some((r) => pathname === r || pathname.startsWith(r + '/'));
}

function isStaticOrInternal(pathname: string): boolean {
  return (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.')
  );
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isStaticOrInternal(pathname)) {
    return NextResponse.next();
  }

  if (!authConfig.enableAuth) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get('access_token')?.value;
  const isAuthed = !!accessToken;

  if (isAuthed && isAuthOnlyRoute(pathname)) {
    return NextResponse.redirect(new URL(homeRedirect, request.url));
  }

  if (!isAuthed && !isPublicRoute(pathname) && !isAuthOnlyRoute(pathname)) {
    const url = new URL(loginRedirect, request.url);
    if (pathname !== '/') {
      url.searchParams.set('redirect', pathname);
    }
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png|.*\\.jpg).*)'],
};
