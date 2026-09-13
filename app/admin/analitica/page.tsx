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
    { key: 'calendar_search_users', label: 'Usuarios', icon: MousePointerClick },
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
      <section className="container-page py-6 md:py-10">
        <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-bold text-brand-400">
          <ArrowLeft className="h-4 w-4" />
          Volver al admin
        </Link>

        <div className="mt-6 flex flex-col gap-2">
          <p className="text-sm font-bold uppercase text-brand-500">Analítica</p>
          <h1 className="text-3xl font-black tracking-tight md:text-5xl">Flujo de Tardea</h1>
          <p className="text-sm text-slate-400">
            Búsquedas, aperturas de evento, WhatsApp, entradas y favoritos.
          </p>
        </div>

        {loading && <p className="mt-8 text-slate-400">Cargando analítica...</p>}

        {error && (
          <div className="mt-8 rounded-3xl border border-brand-500/30 bg-brand-500/10 p-5 text-sm text-brand-100">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-4">
              <button
                type="button"
                onClick={sendEmailReport}
                disabled={sendingEmail}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-600 disabled:opacity-60 md:w-auto"
              >
                <Mail className="h-4 w-4" />
                {sendingEmail ? 'Enviando resumen...' : 'Enviar resumen por email'}
              </button>
              {emailStatus && (
                <p className="mt-3 text-sm font-semibold text-slate-300">{emailStatus}</p>
              )}
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              {summaryBlocks.map((block) => (
                <div key={block.label} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <h2 className="text-lg font-black">{block.label}</h2>
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {metricItems.map((item) => {
                      const Icon = item.icon

                      return (
                        <div key={item.key} className="rounded-2xl border border-white/10 bg-slate-950/55 p-3">
                          <Icon className="h-4 w-4 text-brand-500" />
                          <p className="mt-2 text-2xl font-black">
                            {numberValue(block.value?.[item.key])}
                          </p>
                          <p className="mt-1 text-[11px] font-semibold text-slate-400">{item.label}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-white/5">
              <div className="border-b border-white/10 p-5">
                <h2 className="text-lg font-bold">Por día</h2>
              </div>
              <div className="divide-y divide-white/10">
                {funnel.map((row) => (
                  <div key={row.day} className="grid grid-cols-[1fr_auto] gap-4 p-4">
                    <div>
                      <p className="font-bold capitalize">{formatDay(row.day)}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {numberValue(row.calendar_searches)} calendario · {numberValue(row.event_opens)} abren · {numberValue(row.whatsapp_clicks)} WhatsApp · {numberValue(row.ticket_clicks)} entradas
                      </p>
                    </div>
                    <p className="text-2xl font-black text-brand-400">{numberValue(row.calendar_search_users)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-white/5">
              <div className="border-b border-white/10 p-5">
                <h2 className="text-lg font-bold">Actividad reciente</h2>
              </div>
              <div className="divide-y divide-white/10">
                {recentEvents.slice(0, 25).map((event, index) => (
                  <div key={`${event.created_at}-${index}`} className="p-4">
                    <p className="font-bold">{eventLabels[event.event_name] || event.event_name}</p>
                    <p className="mt-1 text-xs text-slate-400">
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
