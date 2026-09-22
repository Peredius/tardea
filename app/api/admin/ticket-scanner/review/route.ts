import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/server-security'

export async function POST(request: Request) {
  const admin = await requireAdmin(request)
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: 401 })
  }

  const payload = (await request.json().catch(() => null)) as
    | { eventId?: string; action?: 'approve' | 'reject' }
    | null

  if (!payload?.eventId || !['approve', 'reject'].includes(payload.action || '')) {
    return NextResponse.json({ error: 'Falta la decisión de revisión.' }, { status: 400 })
  }

  const { data, error } = payload.action === 'approve'
    ? await admin.serviceClient
        .from('events')
        .update({
          status: 'approved',
          published: true,
          needs_review: false,
          profile_reviewed: true,
        })
        .eq('id', payload.eventId)
        .like('external_id', 'ticket-scanner:%')
        .eq('needs_review', true)
        .select('id')
        .maybeSingle()
    : await admin.serviceClient
        .from('events')
        .delete()
        .eq('id', payload.eventId)
        .like('external_id', 'ticket-scanner:%')
        .eq('needs_review', true)
        .select('id')
        .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: 'La propuesta ya no está pendiente.' }, { status: 409 })
  }

  return NextResponse.json({ ok: true, action: payload.action })
}
