import { NextRequest, NextResponse } from 'next/server'

const ACCESS_COOKIE = 'tardea_access'

function isPublicAsset(pathname: string) {
  return (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/logotardeaweb.png') ||
    pathname.startsWith('/publictest.txt')
  )
}

export function middleware(request: NextRequest) {
  const password = process.env.SITE_PASSWORD

  if (!password) {
    return NextResponse.next()
  }

  const { pathname } = request.nextUrl

  if (pathname === '/private-access' || isPublicAsset(pathname)) {
    return NextResponse.next()
  }

  const accessCookie = request.cookies.get(ACCESS_COOKIE)?.value

  if (accessCookie === password) {
    return NextResponse.next()
  }

  const url = request.nextUrl.clone()
  url.pathname = '/private-access'
  url.searchParams.set('next', `${pathname}${request.nextUrl.search}`)

  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|robots.txt|sitemap.xml).*)'],
}
