import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/server-security'
import { runTicketScanner } from '@/lib/ticket-scanner'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: Request) {
  const admin = await requireAdmin(request)
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: 401 })
  }

  try {
    const result = await runTicketScanner(admin.serviceClient)
    return NextResponse.json({ ok: true, ...result })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'No se pudieron revisar las tiqueteras.' },
      { status: 500 }
    )
  }
}
