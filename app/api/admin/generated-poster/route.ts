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
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data: profile } = await serviceClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') return { error: 'No tienes permisos de admin' }
  return { serviceClient }
}

function safePathPart(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function POST(request: Request) {
  const admin = await assertAdmin(request)
  if ('error' in admin) {
    return NextResponse.json({ error: admin.error }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const poster = formData.get('poster')
    const eventId = String(formData.get('eventId') || '')
    const series = safePathPart(String(formData.get('series') || 'evento')) || 'evento'

    if (!(poster instanceof File) || !eventId) {
      return NextResponse.json({ error: 'Faltan el cartel o el evento.' }, { status: 400 })
    }
    if (!poster.type.startsWith('image/')) {
      return NextResponse.json({ error: 'El archivo no es una imagen valida.' }, { status: 400 })
    }

    const { data: event, error: eventError } = await admin.serviceClient
      .from('events')
      .select('id')
      .eq('id', eventId)
      .maybeSingle()
    if (eventError) throw eventError
    if (!event) {
      return NextResponse.json({ error: 'No se encontro el evento.' }, { status: 404 })
    }

    const fileName = `series/${series}/generated/${eventId}-${Date.now()}.jpg`
    const { error: uploadError } = await admin.serviceClient.storage
      .from('events')
      .upload(fileName, await poster.arrayBuffer(), {
        contentType: 'image/jpeg',
        upsert: true,
      })
    if (uploadError) throw uploadError

    const { data } = admin.serviceClient.storage.from('events').getPublicUrl(fileName)
    const { error: updateError } = await admin.serviceClient
      .from('events')
      .update({ cover: data.publicUrl, image_status: 'generated' })
      .eq('id', eventId)
    if (updateError) throw updateError

    return NextResponse.json({ ok: true, publicUrl: data.publicUrl })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'No se pudo guardar el cartel generado.' },
      { status: 500 }
    )
  }
}
