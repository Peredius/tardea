import { NextResponse } from 'next/server'
import { isAllowedAuthEmail } from '@/lib/auth-lockdown'
import { checkRateLimit, requireUser } from '@/lib/server-security'

type ProfilePayload = {
  role?: string
  venueName?: string
  firstName?: string
  lastName?: string
  birthDate?: string
  address?: string
  postalCode?: string
  municipality?: string
  province?: string
  musicPrefs?: string[]
}

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(request, 'profile-write', 10, 60_000)
  if (!rateLimit.ok) {
    return NextResponse.json({ error: 'Demasiados intentos. Espera un minuto.' }, { status: 429 })
  }

  const auth = await requireUser(request)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }

  const payload = (await request.json().catch(() => null)) as ProfilePayload | null

  if (!payload) {
    return NextResponse.json(
      { error: 'Faltan datos de la cuenta.' },
      { status: 400 }
    )
  }

  if (!isAllowedAuthEmail(auth.user.email)) {
    return NextResponse.json(
      { error: 'Próximamente abriremos TARDEA. Ahora mismo estamos en pruebas privadas.' },
      { status: 403 }
    )
  }

  const { data: existingProfile } = await auth.serviceClient
    .from('profiles')
    .select('role')
    .eq('id', auth.user.id)
    .maybeSingle()

  const requestedRole = payload.role === 'venue' ? 'venue' : 'user'
  const role = existingProfile?.role || requestedRole
  const profile: Record<string, unknown> =
    role === 'venue'
      ? {
          id: auth.user.id,
          role,
          venue_name: payload.venueName || null,
          area_preferences: [],
        }
      : {
          id: auth.user.id,
          role,
          first_name: payload.firstName || null,
          last_name: payload.lastName || null,
          birth_date: payload.birthDate || null,
          address: payload.address || null,
          postal_code: payload.postalCode || null,
          municipality: payload.municipality || null,
          province: payload.province || null,
          city: payload.municipality || null,
          music_preferences: Array.isArray(payload.musicPrefs)
            ? payload.musicPrefs
            : [],
          area_preferences: [],
        }

  const { error } = await auth.serviceClient
    .from('profiles')
    .upsert(profile, { onConflict: 'id' })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
