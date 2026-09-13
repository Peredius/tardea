import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/server-security'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type FunnelRow = {
  day: string
  calendar_searches: number | null
  calendar_search_users: number | null
  text_searches: number | null
  event_opens: number | null
  whatsapp_clicks: number | null
  ticket_clicks: number | null
  favorite_clicks: number | null
}

function numberValue(value: number | null | undefined) {
  return value || 0
}

function sumFunnel(rows: FunnelRow[]) {
  return rows.reduce(
    (acc, row) => ({
      calendar_searches: acc.calendar_searches + numberValue(row.calendar_searches),
      calendar_search_users: acc.calendar_search_users + numberValue(row.calendar_search_users),
      text_searches: acc.text_searches + numberValue(row.text_searches),
      event_opens: acc.event_opens + numberValue(row.event_opens),
      whatsapp_clicks: acc.whatsapp_clicks + numberValue(row.whatsapp_clicks),
      ticket_clicks: acc.ticket_clicks + numberValue(row.ticket_clicks),
      favorite_clicks: acc.favorite_clicks + numberValue(row.favorite_clicks),
    }),
    {
      calendar_searches: 0,
      calendar_search_users: 0,
      text_searches: 0,
      event_opens: 0,
      whatsapp_clicks: 0,
      ticket_clicks: 0,
      favorite_clicks: 0,
    }
  )
}

function dateKeyDaysAgo(daysAgo: number) {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  date.setHours(0, 0, 0, 0)
  return date.toISOString().slice(0, 10)
}

function rowsFrom(rows: FunnelRow[], days: number) {
  const fromDay = dateKeyDaysAgo(days - 1)
  return rows.filter((row) => row.day >= fromDay)
}

export async function GET(request: Request) {
  const admin = await requireAdmin(request)
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: 401 })
  }

  const url = new URL(request.url)
  const days = Math.min(Math.max(Number(url.searchParams.get('days') || 14), 1), 60)
  const fromDate = new Date()
  fromDate.setDate(fromDate.getDate() - days + 1)
  fromDate.setHours(0, 0, 0, 0)

  const [{ data: funnel, error: funnelError }, { data: allFunnel, error: allFunnelError }, { data: events, error: eventsError }] =
    await Promise.all([
      admin.serviceClient
        .from('analytics_daily_funnel')
        .select('*')
        .gte('day', fromDate.toISOString().slice(0, 10))
        .order('day', { ascending: false }),
      admin.serviceClient
        .from('analytics_daily_funnel')
        .select('*')
        .order('day', { ascending: false }),
      admin.serviceClient
        .from('analytics_events')
        .select('event_name, target_type, target_id, metadata, created_at')
        .gte('created_at', fromDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(80),
    ])

  if (funnelError || allFunnelError || eventsError) {
    return NextResponse.json(
      {
        error:
          funnelError?.message ||
          allFunnelError?.message ||
          eventsError?.message ||
          'No se pudo cargar la analitica.',
      },
      { status: 500 }
    )
  }

  const allRows = (allFunnel || []) as FunnelRow[]

  return NextResponse.json({
    funnel: funnel || [],
    summaries: {
      lastDay: sumFunnel(rowsFrom(allRows, 1)),
      lastWeek: sumFunnel(rowsFrom(allRows, 7)),
      lastMonth: sumFunnel(rowsFrom(allRows, 30)),
      total: sumFunnel(allRows),
    },
    recentEvents: events || [],
  })
}
