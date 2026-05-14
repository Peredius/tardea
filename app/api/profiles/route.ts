import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

type ProfilePayload = {
  id?: string
  email?: string
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
  const payload = (await request.json().catch(() => null)) as ProfilePayload | null

  if (!payload?.id || !payload?.email) {
    return NextResponse.json(
      { error: 'Faltan datos de la cuenta.' },
      { status: 400 }
    )
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: 'Falta configurar la clave segura de Supabase.' },
      { status: 500 }
    )
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const { data: authUser, error: authError } =
    await supabaseAdmin.auth.admin.getUserById(payload.id)

  if (authError || !authUser.user || authUser.user.email !== payload.email) {
    return NextResponse.json(
      { error: 'No se pudo validar la cuenta creada.' },
      { status: 403 }
    )
  }

  const role = payload.role === 'venue' ? 'venue' : 'user'
  const profile: Record<string, unknown> =
    role === 'venue'
      ? {
          id: payload.id,
          role,
          venue_name: payload.venueName || null,
          area_preferences: [],
        }
      : {
          id: payload.id,
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

  const { error } = await supabaseAdmin
    .from('profiles')
    .upsert(profile, { onConflict: 'id' })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
