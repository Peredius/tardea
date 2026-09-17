import { NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/server-security'

const ACCESS_COOKIE = 'tardea_access'

async function sha256(value: string) {
  const data = new TextEncoder().encode(value)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(request, 'private-access', 5, 15 * 60_000)
  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Prueba de nuevo más tarde.' },
      { status: 429 }
    )
  }

  const sitePassword = process.env.SITE_PASSWORD

  if (!sitePassword) {
    return NextResponse.json({ ok: true })
  }

  const body = await request.json().catch(() => null)

  const suppliedHash = await sha256(String(body?.password || ''))
  const expectedHash = await sha256(sitePassword)
  if (suppliedHash !== expectedHash) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })

  response.cookies.set({
    name: ACCESS_COOKIE,
    value: expectedHash,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })

  return response
}
