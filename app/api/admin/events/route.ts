import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function fallbackSlug(slug: string) {
  return (slug || `evento-${Date.now().toString(36)}`)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

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

  return { serviceClient }
}

async function getUniqueSlug(serviceClient: any, desiredSlug: string, eventId?: string) {
  const baseSlug = fallbackSlug(desiredSlug)

  for (let attempt = 1; attempt <= 50; attempt += 1) {
    const candidate = attempt === 1 ? baseSlug : `${baseSlug}-${attempt}`
    const { data, error } = await serviceClient
      .from('events')
      .select('id')
      .eq('slug', candidate)
      .maybeSingle()

    if (error) throw error
    if (!data || data.id === eventId) return candidate
  }

  return `${baseSlug}-${Date.now().toString(36)}`
}

async function saveEventWithSchemaFallback(
  serviceClient: any,
  event: Record<string, any>,
  eventId?: string
) {
  const cleanEvent = { ...event }
  let lastError: any = null

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const query = eventId
      ? serviceClient.from('events').update(cleanEvent).eq('id', eventId).select('*').maybeSingle()
      : serviceClient.from('events').insert(cleanEvent).select('*').maybeSingle()

    const { data, error } = await query
    if (!error) return { data, error: null, appliedPayload: cleanEvent }

    lastError = error
    const missingColumn = error.message?.match(/Could not find the '([^']+)' column/)?.[1]
    if (!missingColumn || !(missingColumn in cleanEvent)) break

    delete cleanEvent[missingColumn]
  }

  return { data: null, error: lastError, appliedPayload: cleanEvent }
}

export async function POST(request: Request) {
  const admin = await assertAdmin(request)
  if ('error' in admin) {
    return NextResponse.json({ error: admin.error }, { status: 401 })
  }

  const payload = (await request.json().catch(() => null)) as
    | { eventId?: string; event?: Record<string, any> }
    | null

  if (!payload?.event) {
    return NextResponse.json({ error: 'Faltan datos del evento.' }, { status: 400 })
  }

  try {
    const event = { ...payload.event }
    event.slug = await getUniqueSlug(admin.serviceClient, event.slug, payload.eventId)

    const { data, error } = await saveEventWithSchemaFallback(
      admin.serviceClient,
      event,
      payload.eventId
    )

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'No se pudo guardar el evento.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, event: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'No se pudo guardar el evento.' }, { status: 500 })
  }
}
