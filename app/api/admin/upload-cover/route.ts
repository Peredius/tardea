import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !anonKey || !serviceKey) {
    return NextResponse.json({ error: 'Faltan claves de Supabase en el servidor' }, { status: 500 })
  }

  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Sesion no valida' }, { status: 401 })

  const auth = createClient(url, anonKey)
  const { data: { user }, error: authError } = await auth.auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Sesion no valida' }, { status: 401 })

  const db = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'No tienes permisos de admin' }, { status: 403 })

  try {
    const form = await request.formData()
    const file = form.get('file')
    const series = String(form.get('series') || '')
    const eventId = String(form.get('eventId') || '')
    if (!(file instanceof File) || !file.type.startsWith('image/') || file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Selecciona una imagen de hasta 10 MB.' }, { status: 400 })
    }
    if (!/^[a-z0-9-]{1,120}$/.test(series)) {
      return NextResponse.json({ error: 'Ficha no valida.' }, { status: 400 })
    }
    if (eventId) {
      if (!/^[0-9a-f-]{36}$/i.test(eventId)) return NextResponse.json({ error: 'Evento no valido.' }, { status: 400 })
      const { data: event } = await db.from('events').select('id').eq('id', eventId).maybeSingle()
      if (!event) return NextResponse.json({ error: 'No se encontro el evento.' }, { status: 404 })
    }

    const extension = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
    const folder = eventId ? `series/${series}/dates` : `series/${series}`
    const path = `${folder}/${eventId || 'base'}-${crypto.randomUUID()}.${extension}`
    const { error: uploadError } = await db.storage.from('events').upload(path, await file.arrayBuffer(), {
      contentType: file.type,
    })
    if (uploadError) throw uploadError
    const { data } = db.storage.from('events').getPublicUrl(path)
    return NextResponse.json({ publicUrl: data.publicUrl })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'No se pudo subir el cartel.' }, { status: 500 })
  }
}
