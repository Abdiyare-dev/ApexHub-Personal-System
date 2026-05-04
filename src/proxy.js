import { NextResponse } from 'next/server';

export function proxy(request) {
  const token = request.cookies.get('supabaseToken')?.value;
  const pathname = request.nextUrl.pathname;

  const isLoginPage = pathname.startsWith('/login');
  const isHomePage = pathname === '/';

  // Allow the home page through for everyone — page.js handles showing
  // LandingPage (unauthenticated) vs Dashboard (authenticated)
  if (isHomePage) {
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
