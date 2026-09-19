'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, BarChart3, CalendarDays, Heart, Mail, MousePointerClick, Search, Share2, Ticket } from 'lucide-react'
import { supabase } from '@/lib/supabase'

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

type RecentEvent = {
  event_name: string
  target_type: string | null
  target_id: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

type AnalyticsSummary = {
  calendar_searches: number
  calendar_search_users: number
  text_searches: number
  event_opens: number
  whatsapp_clicks: number
  ticket_clicks: number
  favorite_clicks: number
}

const eventLabels: Record<string, string> = {
  calendar_search: 'Buscar calendario',
  text_search: 'Buscar texto',
  event_card_open: 'Abre evento',
  event_detail_whatsapp: 'WhatsApp',
  event_detail_ticket: 'Entradas',
  event_detail_favorite_date: 'Guarda fecha',
  event_detail_favorite_plan: 'Guarda plan',
  event_detail_all_dates: 'Ver fechas',
  favorite_button_toggle: 'Favorito',
}

function numberValue(value: number | null | undefined) {
  return value || 0
}

function formatDay(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

export default function AdminAnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [emailStatus, setEmailStatus] = useState('')
  const [sendingEmail, setSendingEmail] = useState(false)
  const [funnel, setFunnel] = useState<FunnelRow[]>([])
  const [summaries, setSummaries] = useState<Record<string, AnalyticsSummary>>({})
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([])

  useEffect(() => {
    async function loadAnalytics() {
      setLoading(true)
      setError('')

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        setError('Inicia sesión como admin para ver la analítica.')
        setLoading(false)
        return
      }

      const response = await fetch('/api/admin/analytics?days=14', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        cache: 'no-store',
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        setError(payload?.error || 'No se pudo cargar la analítica.')
        setLoading(false)
        return
      }

      setFunnel(payload?.funnel || [])
      setSummaries(payload?.summaries || {})
      setRecentEvents(payload?.recentEvents || [])
      setLoading(false)
    }

    loadAnalytics()
  }, [])

  const summaryBlocks = [
    { label: 'Último día', value: summaries.lastDay },
    { label: 'Última semana', value: summaries.lastWeek },
    { label: 'Último mes', value: summaries.lastMonth },
    { label: 'Totales', value: summaries.total },
  ]

  const metricItems = [
    { key: 'calendar_searches', label: 'Calendario', icon: CalendarDays },
    { key: 'calendar_search_users', label: 'Visitantes únicos', icon: MousePointerClick },
    { key: 'text_searches', label: 'Texto', icon: Search },
    { key: 'event_opens', label: 'Abren', icon: BarChart3 },
    { key: 'whatsapp_clicks', label: 'WhatsApp', icon: Share2 },
    { key: 'ticket_clicks', label: 'Entradas', icon: Ticket },
    { key: 'favorite_clicks', label: 'Favoritos', icon: Heart },
  ] as const

  async function sendEmailReport() {
    setSendingEmail(true)
    setEmailStatus('')

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.access_token) {
      setEmailStatus('Inicia sesión como admin para enviar el resumen.')
      setSendingEmail(false)
      return
    }

    const response = await fetch('/api/admin/analytics/email', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    })
    const payload = await response.json().catch(() => null)

    setEmailStatus(
      response.ok
        ? `Resumen enviado a ${payload?.to || 'info@tardea.com'}.`
        : payload?.error || 'No se pudo enviar el resumen.'
    )
    setSendingEmail(false)
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="container-page py-5 md:py-8">
        <Link href="/admin" className="inline-flex items-center gap-2 text-xs font-bold text-brand-400 md:text-sm">
          <ArrowLeft className="h-4 w-4" />
          Volver al admin
        </Link>

        <div className="mt-5 flex flex-col gap-1.5">
          <p className="text-xs font-bold uppercase text-brand-500">Analítica</p>
          <h1 className="text-2xl font-black tracking-tight md:text-4xl">Flujo de Tardea</h1>
          <p className="text-xs leading-5 text-slate-400 md:text-sm">
            Búsquedas, aperturas de evento, WhatsApp, entradas y favoritos.
          </p>
        </div>

        {loading && <p className="mt-8 text-slate-400">Cargando analítica...</p>}

        {error && (
          <p className="mt-8 text-sm font-semibold text-brand-100">
            {error}
          </p>
        )}

        {!loading && !error && (
          <>
            <div className="mt-5">
              <div className="flex flex-col gap-2 md:flex-row">
                <button
                  type="button"
                  onClick={sendEmailReport}
                  disabled={sendingEmail}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-500 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-brand-600 disabled:opacity-60 md:w-auto md:text-sm"
                >
                  <Mail className="h-4 w-4" />
                  {sendingEmail ? 'Enviando resumen...' : 'Enviar resumen por email'}
                </button>
              </div>
              {emailStatus && (
                <p className="mt-2 text-xs font-semibold text-slate-300">{emailStatus}</p>
              )}
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              {summaryBlocks.map((block) => (
                <section key={block.label}>
                  <h2 className="text-sm font-black text-white md:text-base">{block.label}</h2>
                  <div className="mt-2">
                    {metricItems.map((item) => {
                      const Icon = item.icon

                      return (
                        <div key={item.key} className="flex items-center justify-between gap-3 py-1.5">
                          <div className="flex min-w-0 items-center gap-2">
                            <Icon className="h-3.5 w-3.5 shrink-0 text-brand-500" />
                            <p className="truncate text-xs font-semibold text-slate-300 md:text-sm">{item.label}</p>
                          </div>
                          <p className="text-base font-black text-white md:text-lg">
                            {numberValue(block.value?.[item.key])}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </section>
              ))}
            </div>

            <div className="mt-6">
              <div>
                <h2 className="text-sm font-bold md:text-base">Por día</h2>
              </div>
              <div className="mt-2">
                {funnel.map((row) => (
                  <div key={row.day} className="grid grid-cols-[1fr_auto] gap-4 py-2">
                    <div>
                      <p className="text-sm font-bold capitalize">{formatDay(row.day)}</p>
                      <p className="mt-1 text-[11px] leading-5 text-slate-400 md:text-xs">
                        {numberValue(row.calendar_searches)} calendario · {numberValue(row.event_opens)} abren · {numberValue(row.whatsapp_clicks)} WhatsApp · {numberValue(row.ticket_clicks)} entradas
                      </p>
                    </div>
                    <p className="text-lg font-black text-brand-400">{numberValue(row.calendar_search_users)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <div>
                <h2 className="text-sm font-bold md:text-base">Actividad reciente</h2>
              </div>
              <div className="mt-2">
                {recentEvents.slice(0, 25).map((event, index) => (
                  <div key={`${event.created_at}-${index}`} className="py-2">
                    <p className="text-sm font-bold">{eventLabels[event.event_name] || event.event_name}</p>
                    <p className="mt-1 text-[11px] text-slate-400 md:text-xs">
                      {new Date(event.created_at).toLocaleString('es-ES')}
                      {event.target_id ? ` · ${event.target_id}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  )
}
