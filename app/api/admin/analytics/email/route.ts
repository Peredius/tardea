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

function formatNumber(value: number) {
  return new Intl.NumberFormat('es-ES').format(value)
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

type CalendarSession = {
  session_id: string | null
  created_at: string
}

function withUniqueCalendarSessions(
  totals: ReturnType<typeof sumFunnel>,
  sessions: CalendarSession[],
  days?: number
) {
  const filtered = days
    ? sessions.filter((row) => row.created_at.slice(0, 10) >= dateKeyDaysAgo(days - 1))
    : sessions

  return {
    ...totals,
    calendar_search_users: new Set(filtered.map((row) => row.session_id).filter(Boolean)).size,
  }
}

function metricRow(label: string, value: number) {
  return `
    <tr>
      <td style="padding:10px 0;color:#94a3b8;font-size:14px;">${label}</td>
      <td style="padding:10px 0;color:#ffffff;font-size:18px;font-weight:800;text-align:right;">${formatNumber(value)}</td>
    </tr>
  `
}

function summaryCard(title: string, totals: ReturnType<typeof sumFunnel>) {
  return `
    <div style="border:1px solid rgba(255,255,255,.12);border-radius:22px;background:rgba(255,255,255,.05);padding:18px;margin-bottom:14px;">
      <h2 style="margin:0 0 8px;color:#ffffff;font-size:18px;">${title}</h2>
      <table style="width:100%;border-collapse:collapse;">
        ${metricRow('Búsquedas en calendario', totals.calendar_searches)}
        ${metricRow('Visitantes únicos calendario', totals.calendar_search_users)}
        ${metricRow('Búsquedas por texto', totals.text_searches)}
        ${metricRow('Eventos abiertos', totals.event_opens)}
        ${metricRow('Clics en WhatsApp', totals.whatsapp_clicks)}
        ${metricRow('Clics en entradas', totals.ticket_clicks)}
        ${metricRow('Clics en favoritos', totals.favorite_clicks)}
      </table>
    </div>
  `
}

function buildEmailHtml(rows: FunnelRow[], sessions: CalendarSession[]) {
  const lastDay = withUniqueCalendarSessions(sumFunnel(rowsFrom(rows, 1)), sessions, 1)
  const lastWeek = withUniqueCalendarSessions(sumFunnel(rowsFrom(rows, 7)), sessions, 7)
  const lastMonth = withUniqueCalendarSessions(sumFunnel(rowsFrom(rows, 30)), sessions, 30)
  const totals = withUniqueCalendarSessions(sumFunnel(rows), sessions)
  const generatedAt = new Date().toLocaleString('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  return `
    <div style="margin:0;padding:0;background:#020617;font-family:Inter,Arial,sans-serif;color:#ffffff;">
      <div style="max-width:620px;margin:0 auto;padding:28px 20px;">
        <p style="margin:0 0 10px;color:#ff2e6f;font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;">TARDEA Analítica</p>
        <h1 style="margin:0;color:#ffffff;font-size:30px;line-height:1.1;">Resumen del flujo</h1>
        <p style="margin:10px 0 22px;color:#94a3b8;font-size:14px;">Generado el ${generatedAt}</p>

        ${summaryCard('Último día', lastDay)}
        ${summaryCard('Última semana', lastWeek)}
        ${summaryCard('Último mes', lastMonth)}
        ${summaryCard('Totales', totals)}

        <h2 style="margin:26px 0 12px;color:#ffffff;font-size:18px;">Últimos días</h2>
        <div style="border:1px solid rgba(255,255,255,.12);border-radius:22px;overflow:hidden;">
          ${rows
            .slice(0, 14)
            .map(
              (row) => `
                <div style="padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.10);">
                  <p style="margin:0;color:#ffffff;font-weight:800;">${new Date(`${row.day}T12:00:00`).toLocaleDateString('es-ES')}</p>
                  <p style="margin:6px 0 0;color:#94a3b8;font-size:13px;">
                    ${formatNumber(numberValue(row.calendar_searches))} calendario ·
                    ${formatNumber(numberValue(row.event_opens))} abren ·
                    ${formatNumber(numberValue(row.whatsapp_clicks))} WhatsApp ·
                    ${formatNumber(numberValue(row.ticket_clicks))} entradas
                  </p>
                </div>
              `
            )
            .join('')}
        </div>
      </div>
    </div>
  `
}

export async function POST(request: Request) {
  const admin = await requireAdmin(request)
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: 401 })
  }

  const resendApiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.ANALYTICS_FROM_EMAIL
  const toEmail = process.env.ANALYTICS_REPORT_EMAIL || 'info@tardea.com'

  if (!resendApiKey || !fromEmail) {
    return NextResponse.json(
      {
        error:
          'Falta configurar RESEND_API_KEY y ANALYTICS_FROM_EMAIL en Vercel.',
      },
      { status: 500 }
    )
  }

  const [
    { data, error },
    { data: sessionData, error: sessionError },
  ] = await Promise.all([
    admin.serviceClient
      .from('analytics_daily_funnel')
      .select('*')
      .order('day', { ascending: false }),
    admin.serviceClient
      .from('analytics_events')
      .select('session_id, created_at')
      .eq('event_name', 'calendar_search'),
  ])

  if (error || sessionError) {
    return NextResponse.json({ error: error?.message || sessionError?.message }, { status: 500 })
  }

  const rows = (data || []) as FunnelRow[]
  const sessions = (sessionData || []) as CalendarSession[]

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [toEmail],
      subject: 'Resumen de analítica TARDEA',
      html: buildEmailHtml(rows, sessions),
    }),
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    return NextResponse.json(
      { error: payload?.message || 'No se pudo enviar el email.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true, to: toEmail })
}
