import { NextResponse } from 'next/server'

const ACCESS_COOKIE = 'tardea_access'

export async function POST(request: Request) {
  const sitePassword = process.env.SITE_PASSWORD

  if (!sitePassword) {
    return NextResponse.json({ ok: true })
  }

  const body = await request.json().catch(() => null)

  if (body?.password !== sitePassword) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })

  response.cookies.set({
    name: ACCESS_COOKIE,
    value: sitePassword,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })

  return response
}
