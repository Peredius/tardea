import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/server-security'
import { runTicketScanner } from '@/lib/ticket-scanner'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

async function sendNewDatesEmail(result: Awaited<ReturnType<typeof runTicketScanner>>) {
  if (result.addedCount === 0) return { sent: false, reason: 'no-new-dates' }

  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.ANALYTICS_FROM_EMAIL
  const to = process.env.ANALYTICS_REPORT_EMAIL || 'info@tardea.com'
  if (!apiKey || !from) return { sent: false, reason: 'email-not-configured' }

  const profiles = result.results.filter((item) => item.added.length > 0)
  const rows = profiles.map((item) => {
    const dates = item.added.map((event) => event.date.split('-').reverse().join('/')).join(', ')
    return `<li style="margin:0 0 14px"><strong>${escapeHtml(item.profileName)}</strong><br>${escapeHtml(dates)}</li>`
  }).join('')

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `${result.addedCount} fecha${result.addedCount === 1 ? '' : 's'} nueva${result.addedCount === 1 ? '' : 's'} pendiente${result.addedCount === 1 ? '' : 's'} en TARDEA`,
      html: `<div style="font-family:Arial,sans-serif;color:#10182d"><h1 style="font-size:22px">Hay fechas nuevas para revisar</h1><p>Se han detectado ${result.addedCount} fecha${result.addedCount === 1 ? '' : 's'}. No se han publicado automáticamente.</p><ul style="padding-left:20px">${rows}</ul><p><a href="https://www.tardea.com/admin/revision" style="color:#f5325f;font-weight:700">Abrir revisión</a></p></div>`,
    }),
  })

  if (!response.ok) return { sent: false, reason: 'send-failed' }
  return { sent: true, to }
}

export async function POST(request: Request) {
  const admin = await requireAdmin(request)
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: 401 })
  }

  try {
    const result = await runTicketScanner(admin.serviceClient)
    const email = await sendNewDatesEmail(result)
    return NextResponse.json({ ok: true, ...result, email })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'No se pudieron revisar las tiqueteras.' },
      { status: 500 }
    )
  }
}
