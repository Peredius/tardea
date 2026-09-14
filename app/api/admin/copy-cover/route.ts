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

function extensionFromContentType(contentType: string) {
  if (contentType.includes('png')) return 'png'
  if (contentType.includes('webp')) return 'webp'
  return 'jpg'
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

  const payload = (await request.json().catch(() => null)) as
    | { url?: string; folder?: string; name?: string }
    | null

  if (!payload?.url) {
    return NextResponse.json({ error: 'Falta la URL del cartel.' }, { status: 400 })
  }

  try {
    const sourceUrl = new URL(payload.url)
    if (!['http:', 'https:'].includes(sourceUrl.protocol)) {
      return NextResponse.json({ error: 'URL de cartel no valida.' }, { status: 400 })
    }

    const response = await fetch(sourceUrl.toString(), {
      headers: {
        'User-Agent': 'Tardea Admin/1.0',
      },
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'No se pudo descargar el cartel externo.' }, { status: 502 })
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg'
    if (!contentType.startsWith('image/')) {
      return NextResponse.json({ error: 'La URL no parece ser una imagen.' }, { status: 400 })
    }

    const extension = extensionFromContentType(contentType)
    const bytes = await response.arrayBuffer()
    const folder = safePathPart(payload.folder || 'copied-covers') || 'copied-covers'
    const name = safePathPart(payload.name || sourceUrl.pathname.split('/').pop() || 'cartel') || 'cartel'
    const fileName = `${folder}/${Date.now()}-${name}.${extension}`

    const { error: uploadError } = await admin.serviceClient.storage
      .from('events')
      .upload(fileName, bytes, { contentType, upsert: true })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data } = admin.serviceClient.storage.from('events').getPublicUrl(fileName)
    return NextResponse.json({ ok: true, publicUrl: data.publicUrl })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'No se pudo copiar el cartel.' }, { status: 500 })
  }
}
