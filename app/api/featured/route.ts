import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const storagePath = 'site/featured-profiles.json'

function serviceClient() {
  if (!url || !serviceKey) throw new Error('Falta la configuración de Supabase')
  return createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
}

async function readPositions(db: ReturnType<typeof serviceClient>): Promise<(string | null)[]> {
  const { data, error } = await db.storage.from('events').download(storagePath)
  if (!error && data) {
    const parsed = JSON.parse(await data.text())
    if (!Array.isArray(parsed.positions) || parsed.positions.length !== 5) throw new Error('Configuración de destacados no válida')
    const ids = parsed.positions.filter(Boolean)
    if (!ids.length) return parsed.positions
    const today = new Date().toISOString().slice(0, 10)
    const { data: events, error: eventsError } = await db.from('events')
      .select('event_profile_id').in('event_profile_id', ids)
      .eq('published', true).eq('status', 'approved').gte('date', today)
    if (eventsError) throw eventsError
    const active = new Set((events || []).map((event) => event.event_profile_id))
    return parsed.positions.map((id: string | null) => id && active.has(id) ? id : null)
  }
  if (error && !['404', 'not_found'].includes(String(error.statusCode))) throw error

  const today = new Date().toISOString().slice(0, 10)
  const { data: events, error: eventsError } = await db.from('events')
    .select('event_profile_id,date')
    .eq('featured', true).eq('published', true).eq('status', 'approved')
    .gte('date', today).not('event_profile_id', 'is', null)
    .order('date').range(0, 999)
  if (eventsError) throw eventsError
  return [...new Set((events || []).map((event) => event.event_profile_id))].slice(0, 5)
    .concat(Array(5).fill(null)).slice(0, 5)
}

export async function GET() {
  try {
    const positions = await readPositions(serviceClient())
    return NextResponse.json({ positions }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'No se pudieron cargar destacados' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    if (!url || !anonKey) throw new Error('Falta la configuración de Supabase')
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Sesión no válida' }, { status: 401 })
    const auth = createClient(url, anonKey)
    const { data: { user }, error: authError } = await auth.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: 'Sesión no válida' }, { status: 401 })

    const db = serviceClient()
    const { data: admin } = await db.from('profiles').select('role').eq('id', user.id).single()
    if (admin?.role !== 'admin') return NextResponse.json({ error: 'Sin permisos de administrador' }, { status: 403 })

    const body = await request.json().catch(() => null)
    const positions = body?.positions
    if (!Array.isArray(positions) || positions.length !== 5 || positions.some((value) => value !== null && (typeof value !== 'string' || !/^[0-9a-f-]{36}$/i.test(value)))) {
      return NextResponse.json({ error: 'Se necesitan cinco posiciones válidas' }, { status: 400 })
    }
    const ids = positions.filter(Boolean) as string[]
    if (new Set(ids).size !== ids.length) return NextResponse.json({ error: 'Una ficha no puede ocupar dos puestos' }, { status: 400 })

    if (ids.length) {
      const { data: profiles, error: profilesError } = await db.from('promoter_event_profiles').select('id').in('id', ids)
      if (profilesError) throw profilesError
      if (profiles?.length !== ids.length) return NextResponse.json({ error: 'Alguna ficha ya no existe' }, { status: 400 })
      const today = new Date().toISOString().slice(0, 10)
      const { data: events, error: eventsError } = await db.from('events').select('event_profile_id')
        .in('event_profile_id', ids).eq('published', true).eq('status', 'approved').gte('date', today)
      if (eventsError) throw eventsError
      const active = new Set((events || []).map((event) => event.event_profile_id))
      if (ids.some((id) => !active.has(id))) return NextResponse.json({ error: 'La ficha necesita una fecha futura publicada' }, { status: 400 })
    }

    const { error: uploadError } = await db.storage.from('events').upload(
      storagePath,
      Buffer.from(JSON.stringify({ positions })),
      { contentType: 'application/json', upsert: true, cacheControl: '0' },
    )
    if (uploadError) throw uploadError
    return NextResponse.json({ positions }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'No se pudieron guardar destacados' }, { status: 500 })
  }
}
