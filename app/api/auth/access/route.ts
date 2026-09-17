import { NextResponse } from 'next/server'
import { isAllowedAuthEmail, isAuthLockdownEnabled } from '@/lib/auth-lockdown'
import { checkRateLimit } from '@/lib/server-security'

const LOCKDOWN_MESSAGE =
  'Próximamente abriremos TARDEA. Ahora mismo estamos en pruebas privadas.'

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(request, 'auth-access', 20, 15 * 60_000)
  if (!rateLimit.ok) {
    return NextResponse.json({ error: 'Demasiados intentos. Prueba más tarde.' }, { status: 429 })
  }

  const payload = (await request.json().catch(() => null)) as
    | { email?: string | null }
    | null

  if (!isAuthLockdownEnabled()) {
    return NextResponse.json({ ok: true, locked: false })
  }

  if (!isAllowedAuthEmail(payload?.email)) {
    return NextResponse.json(
      {
        ok: false,
        locked: true,
        error: LOCKDOWN_MESSAGE,
      },
      { status: 403 }
    )
  }

  return NextResponse.json({ ok: true, locked: true })
}
