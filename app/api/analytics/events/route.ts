import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkRateLimit } from '@/lib/server-security'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const allowedEventNames = new Set([
  'calendar_search',
  'text_search',
  'event_card_open',
  'event_detail_whatsapp',
  'event_detail_ticket',
  'event_detail_instagram',
  'event_detail_favorite_date',
  'event_detail_favorite_plan',
  'event_detail_all_dates',
  'favorite_button_toggle',
])

const excludedSearchEmails = new Set([
  'davidperedagarate@gmail.com',
  'dapegasa@gmail.com',
  'peredius1@gmail.com',
  'djdavidpereda@gmail.com',
  'koderoomescape@gmail.com',
])

const searchEventNames = new Set(['calendar_search', 'text_search'])

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) return null

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(request, 'analytics-events', 120, 60_000)
  if (!rateLimit.ok) {
    return NextResponse.json({ error: 'Demasiadas solicitudes.' }, { status: 429 })
  }

  const contentLength = Number(request.headers.get('content-length') || 0)
  if (contentLength > 32_000) {
    return NextResponse.json({ error: 'Solicitud demasiado grande.' }, { status: 413 })
  }

  const supabase = getSupabaseAdmin()

  if (!supabase) {
    return NextResponse.json({ ok: false })
  }

  const payload = await request.json().catch(() => null)
  const eventName = String(payload?.eventName || '')

  if (!allowedEventNames.has(eventName)) {
    return NextResponse.json({ error: 'Evento de analitica no permitido.' }, { status: 400 })
  }

  const authorization = request.headers.get('authorization') || ''
  const accessToken = authorization.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length).trim()
    : ''

  if (accessToken && searchEventNames.has(eventName)) {
    const { data } = await supabase.auth.getUser(accessToken)
    const email = data.user?.email?.trim().toLowerCase()

    if (email && excludedSearchEmails.has(email)) {
      return NextResponse.json({ ok: true, ignored: true })
    }
  }

  const path = String(payload?.path || '/').slice(0, 300)
  const sessionId = String(payload?.sessionId || '').slice(0, 120)
  const targetType = payload?.targetType ? String(payload.targetType).slice(0, 80) : null
  const targetId = payload?.targetId ? String(payload.targetId).slice(0, 160) : null
  const metadata =
    payload?.metadata && typeof payload.metadata === 'object' && !Array.isArray(payload.metadata)
      ? payload.metadata
      : {}

  if (JSON.stringify(metadata).length > 4_000) {
    return NextResponse.json({ error: 'Datos de analítica demasiado grandes.' }, { status: 413 })
  }

  const { error } = await supabase.from('analytics_events').insert({
    event_name: eventName,
    path,
    session_id: sessionId,
    target_type: targetType,
    target_id: targetId,
    metadata,
  })

  if (error) {
    return NextResponse.json({ ok: false })
  }

  return NextResponse.json({ ok: true })
}
