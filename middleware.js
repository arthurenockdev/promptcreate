import { NextResponse } from 'next/server';

export function middleware(request) {
  // Clone the response headers
  const response = NextResponse.next();
  
  // Add security headers
  const headers = response.headers;
  
  // Required for SharedArrayBuffer and WebContainer
  headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
  headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  
  // Additional security headers
  headers.set('X-Frame-Options', 'SAMEORIGIN');
  headers.set('X-Content-Type-Options', 'nosniff');
  
  return response;
}

export const config = {
  matcher: '/:path*',
};
