import { NextRequest, NextResponse } from 'next/server'

const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)',
}

function withSecurityHeaders(response: NextResponse) {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  return response
}

export async function middleware(request: NextRequest) {
  return withSecurityHeaders(NextResponse.next())
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|robots.txt|sitemap.xml).*)'],
}
