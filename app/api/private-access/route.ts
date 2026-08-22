import { NextResponse } from 'next/server'

const ACCESS_COOKIE = 'tardea_access'

async function sha256(value: string) {
  const data = new TextEncoder().encode(value)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

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
    value: await sha256(sitePassword),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })

  return response
}
