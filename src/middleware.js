import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function middleware(request) {
  // Forward the current pathname via a request header so Server Components
  // (which have no direct access to the active route) can read it with
  // headers(). Used by (main)/layout.js to decide whether '/' should render
  // the public landing page or the authenticated app shell.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', request.nextUrl.pathname);

  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request: { headers: requestHeaders },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Do NOT use supabase.auth.getSession() here.
  // Use getUser() instead — it sends a request to the Supabase Auth server
  // every time to revalidate the Auth token.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Define public routes that don't require authentication.
  // '/' is public too: signed-out visitors see the marketing landing page
  // there (handled by (main)/layout.js), signed-in visitors see the app.
  const publicPaths = [
    '/',
    '/login',
    '/signup',
    '/forgot-password',
    '/update-password',
    '/auth',
    '/api/auth',
  ];

  const { pathname } = request.nextUrl;

  // Check if the current path is public
  const isPublicPath = publicPaths.some(
    (path) => pathname === path || pathname.startsWith(path + '/')
  );

  // If user is not authenticated and trying to access a protected route
  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // If user IS authenticated and trying to access login/signup, redirect to home
  if (user && (pathname === '/login' || pathname === '/signup')) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets (images, icons, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
