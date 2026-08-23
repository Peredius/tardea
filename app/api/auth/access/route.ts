import { NextResponse } from 'next/server'
import { isAllowedAuthEmail, isAuthLockdownEnabled } from '@/lib/auth-lockdown'

const LOCKDOWN_MESSAGE =
  'Próximamente abriremos TARDEA. Ahora mismo estamos en pruebas privadas.'

export async function POST(request: Request) {
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
