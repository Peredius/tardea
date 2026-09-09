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

  return { serviceClient }
}

function cleanIds(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.length > 0)
    : []
}

export async function POST(request: Request) {
  const admin = await assertAdmin(request)
  if ('error' in admin) {
    return NextResponse.json({ error: admin.error }, { status: 401 })
  }

  const payload = (await request.json().catch(() => null)) as
    | { profileIds?: string[]; eventIds?: string[]; researchIds?: string[] }
    | null

  const profileIds = cleanIds(payload?.profileIds)
  const eventIds = cleanIds(payload?.eventIds)
  const researchIds = cleanIds(payload?.researchIds)

  if (profileIds.length === 0 && eventIds.length === 0 && researchIds.length === 0) {
    return NextResponse.json({ error: 'No hay datos para eliminar.' }, { status: 400 })
  }

  if (eventIds.length > 0) {
    const { error } = await admin.serviceClient.from('events').delete().in('id', eventIds)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (researchIds.length > 0) {
    const { error } = await admin.serviceClient.from('event_research_items').delete().in('id', researchIds)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (profileIds.length > 0) {
    const { error } = await admin.serviceClient.from('promoter_event_profiles').delete().in('id', profileIds)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
