import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

async function assertAdmin(request: Request) {
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return { error: 'Faltan claves de Supabase en el servidor' }
  }

  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return { error: 'Sesion no valida' }

  const authClient = createClient(supabaseUrl, anonKey)
  const {
    data: { user },
    error,
  } = await authClient.auth.getUser(token)

  if (error || !user) return { error: 'Sesion no valida' }

  const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const { data: profile } = await serviceClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') return { error: 'No tienes permisos de admin' }

  return { serviceClient, user }
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function updateProfileWithSchemaFallback(
  serviceClient: any,
  profileId: string,
  payload: Record<string, any>
) {
  const cleanPayload = { ...payload }
  let lastError: any = null

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const { data, error } = await serviceClient
      .from('promoter_event_profiles')
      .update(cleanPayload)
      .eq('id', profileId)
      .select('*')
      .maybeSingle()

    if (!error) return { data, error: null, appliedPayload: cleanPayload }

    lastError = error
    const missingColumn = error.message?.match(/Could not find the '([^']+)' column/)?.[1]

    if (!missingColumn || !(missingColumn in cleanPayload)) break

    delete cleanPayload[missingColumn]
  }

  return { data: null, error: lastError, appliedPayload: cleanPayload }
}

async function upsertProfileWithSchemaFallback(
  serviceClient: any,
  userId: string,
  payload: Record<string, any>
) {
  const cleanPayload: Record<string, any> = {
    ...payload,
    user_id: userId,
    slug: payload.slug || slugify(payload.name || payload.venue_name || 'evento'),
  }
  let lastError: any = null

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const { data, error } = await serviceClient
      .from('promoter_event_profiles')
      .upsert(cleanPayload, { onConflict: 'user_id,slug' })
      .select('*')
      .maybeSingle()

    if (!error) return { data, error: null, appliedPayload: cleanPayload }

    lastError = error
    const missingColumn = error.message?.match(/Could not find the '([^']+)' column/)?.[1]

    if (!missingColumn || !(missingColumn in cleanPayload)) break

    delete cleanPayload[missingColumn]
  }

  return { data: null, error: lastError, appliedPayload: cleanPayload }
}

export async function POST(request: Request) {
  const admin = await assertAdmin(request)
  if ('error' in admin) {
    return NextResponse.json({ error: admin.error }, { status: 401 })
  }

  const payload = (await request.json().catch(() => null)) as
    | { profileId?: string; profile?: Record<string, any> }
    | null

  if (!payload?.profile) {
    return NextResponse.json({ error: 'Falta la ficha para guardar.' }, { status: 400 })
  }

  const { data, error, appliedPayload } = payload.profileId
    ? await updateProfileWithSchemaFallback(admin.serviceClient, payload.profileId, payload.profile)
    : await upsertProfileWithSchemaFallback(admin.serviceClient, admin.user.id, payload.profile)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: 'No se encontro la ficha base.' }, { status: 404 })
  }

  return NextResponse.json({ ok: true, profile: data, appliedPayload })
}

export async function GET(request: Request) {
  const admin = await assertAdmin(request)
  if ('error' in admin) {
    return NextResponse.json({ error: admin.error }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const profileId = searchParams.get('profileId')

  if (!profileId) {
    return NextResponse.json({ error: 'Falta la ficha.' }, { status: 400 })
  }

  const { data, error } = await admin.serviceClient
    .from('promoter_event_profiles')
    .select('*')
    .eq('id', profileId)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: 'No se encontro la ficha base.' }, { status: 404 })
  }

  return NextResponse.json({ ok: true, profile: data })
}
