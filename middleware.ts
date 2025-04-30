import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    // If the user is authenticated and trying to access login/register
    if (req.nextUrl.pathname.startsWith('/login') || 
        req.nextUrl.pathname.startsWith('/register')) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  // Apply middleware only to dashboard paths
  matcher: [
    '/dashboard/:path*',
    // '/login', // Removed: Login should be public
    // '/register', // Removed: Register should be public
    // Add other protected routes here if needed, e.g., '/admin/:path*'
  ],
};
