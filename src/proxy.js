import { NextResponse } from 'next/server';

export function proxy(request) {
  const token = request.cookies.get('supabaseToken')?.value;
  const pathname = request.nextUrl.pathname;

  const isLoginPage = pathname.startsWith('/login');
  const isRecoveryPage = pathname.startsWith('/forgot-password') || pathname.startsWith('/update-password');
  const isHomePage = pathname === '/';

  // Allow the home page and recovery pages through for everyone
  if (isHomePage || isRecoveryPage) {
    return NextResponse.next();
  }

  // If there's no token and they aren't on the login page, redirect to /login
  if (!token && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If they have a token and try to hit /login, redirect back to dashboard
  if (token && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Apply proxy to all routes except api, static assets, and images.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)'],
};
