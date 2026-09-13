'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, BarChart3, CalendarDays, Heart, MousePointerClick, Search, Share2, Ticket } from 'lucide-react'
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
  const [funnel, setFunnel] = useState<FunnelRow[]>([])
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
      setRecentEvents(payload?.recentEvents || [])
      setLoading(false)
    }

    loadAnalytics()
  }, [])

  const today = funnel[0]
  const totals = useMemo(
    () =>
      funnel.reduce(
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
      ),
    [funnel]
  )

  const todayCards = [
    { label: 'Buscan calendario', value: numberValue(today?.calendar_searches), icon: CalendarDays },
    { label: 'Usuarios calendario', value: numberValue(today?.calendar_search_users), icon: MousePointerClick },
    { label: 'Buscan texto', value: numberValue(today?.text_searches), icon: Search },
    { label: 'Abren evento', value: numberValue(today?.event_opens), icon: BarChart3 },
    { label: 'WhatsApp', value: numberValue(today?.whatsapp_clicks), icon: Share2 },
    { label: 'Entradas', value: numberValue(today?.ticket_clicks), icon: Ticket },
    { label: 'Favoritos', value: numberValue(today?.favorite_clicks), icon: Heart },
  ]

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
            <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
              {todayCards.map((item) => {
                const Icon = item.icon

                return (
                  <div key={item.label} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    <Icon className="h-5 w-5 text-brand-500" />
                    <p className="mt-3 text-3xl font-black">{item.value}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-400">{item.label}</p>
                  </div>
                )
              })}
            </div>

            <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-lg font-bold">Últimos 14 días</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                <div>
                  <p className="text-2xl font-black">{totals.calendar_searches}</p>
                  <p className="text-xs text-slate-400">Búsquedas calendario</p>
                </div>
                <div>
                  <p className="text-2xl font-black">{totals.event_opens}</p>
                  <p className="text-xs text-slate-400">Eventos abiertos</p>
                </div>
                <div>
                  <p className="text-2xl font-black">{totals.whatsapp_clicks}</p>
                  <p className="text-xs text-slate-400">WhatsApp</p>
                </div>
                <div>
                  <p className="text-2xl font-black">{totals.ticket_clicks}</p>
                  <p className="text-xs text-slate-400">Entradas</p>
                </div>
              </div>
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
