import { NextRequest, NextResponse } from 'next/server'

const ACCESS_COOKIE = 'tardea_access'
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)',
}

async function sha256(value: string) {
  const data = new TextEncoder().encode(value)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

function withSecurityHeaders(response: NextResponse) {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  return response
}

function isPublicAsset(pathname: string) {
  return (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/logotardeaweb.png') ||
    pathname.startsWith('/publictest.txt')
  )
}

export async function middleware(request: NextRequest) {
  const password = process.env.SITE_PASSWORD

  if (!password) {
    return withSecurityHeaders(NextResponse.next())
  }

  const { pathname } = request.nextUrl

  if (pathname === '/private-access' || isPublicAsset(pathname)) {
    return withSecurityHeaders(NextResponse.next())
  }

  const accessCookie = request.cookies.get(ACCESS_COOKIE)?.value
  const expectedCookie = await sha256(password)

  if (accessCookie === expectedCookie) {
    return withSecurityHeaders(NextResponse.next())
  }

  const url = request.nextUrl.clone()
  url.pathname = '/private-access'
  url.searchParams.set('next', `${pathname}${request.nextUrl.search}`)

  return withSecurityHeaders(NextResponse.redirect(url))
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|robots.txt|sitemap.xml).*)'],
}
