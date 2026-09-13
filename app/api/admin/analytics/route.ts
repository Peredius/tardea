import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/server-security'

export const dynamic = 'force-dynamic'
export const revalidate = 0

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

  const [{ data: funnel, error: funnelError }, { data: events, error: eventsError }] =
    await Promise.all([
      admin.serviceClient
        .from('analytics_daily_funnel')
        .select('*')
        .gte('day', fromDate.toISOString().slice(0, 10))
        .order('day', { ascending: false }),
      admin.serviceClient
        .from('analytics_events')
        .select('event_name, target_type, target_id, metadata, created_at')
        .gte('created_at', fromDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(80),
    ])

  if (funnelError || eventsError) {
    return NextResponse.json(
      {
        error:
          funnelError?.message ||
          eventsError?.message ||
          'No se pudo cargar la analitica.',
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    funnel: funnel || [],
    recentEvents: events || [],
  })
}
