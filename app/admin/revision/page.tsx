'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, Eye, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type ScannerEvent = {
  id: string
  title: string
  date: string
  start_time: string | null
  end_time: string | null
  venue: string | null
  area: string | null
  address: string | null
  description: string | null
  music: string[] | null
  audience: string | null
  price_from: number | null
  cover: string | null
  source_url: string | null
  created_at: string
  event_profile_id: string | null
  status: string | null
  published: boolean | null
  needs_review: boolean | null
  external_id: string | null
  promoter_event_profiles?: {
    name: string | null
  } | null
}

type ScannerRunResult = {
  checkedProfiles: number
  checkedUrls: number
  addedCount: number
  results: Array<{
    profileId: string
    profileName: string
    profileSlug: string | null
    provider: string
    checkedUrls: string[]
    reviewUrls: string[]
    found: number
    skipped: number
    added: Array<{
      id: string
      title: string
      date: string
      sourceUrl: string
    }>
    error?: string
  }>
}

function formatDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
  })
}

function formatToday() {
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())
}

function formatCreatedDay(value: string) {
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}

function isTodayInMadrid(value: string) {
  const madridDay = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value))
  const todayInMadrid = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())

  return madridDay === todayInMadrid
}

function resultName(event: ScannerEvent) {
  return event.promoter_event_profiles?.name || event.venue || 'una ficha'
}

export default function AdminRevisionPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [scannerStatus, setScannerStatus] = useState('')
  const [scannerRunning, setScannerRunning] = useState(false)
  const [scannerRun, setScannerRun] = useState<ScannerRunResult | null>(null)
  const [scannerEvents, setScannerEvents] = useState<ScannerEvent[]>([])
  const [reviewingEventId, setReviewingEventId] = useState('')
  const [previewEventId, setPreviewEventId] = useState('')
  const [manualProvider, setManualProvider] = useState('Todas')

  async function loadRecentScannerEvents() {
    setLoading(true)
    setError('')

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.access_token) {
      setError('Inicia sesión como admin para ver la revisión.')
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
      setError(payload?.error || 'No se pudo cargar la revisión.')
      setLoading(false)
      return
    }

    setScannerEvents((payload?.scannerEvents || []).filter((event: ScannerEvent) => isTodayInMadrid(event.created_at)))
    setLoading(false)
  }

  useEffect(() => {
    loadRecentScannerEvents()
  }, [])

  async function runTicketScanner() {
    setScannerRunning(true)
    setScannerStatus('')
    setScannerRun(null)

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.access_token) {
      setScannerStatus('Inicia sesión como admin para revisar tiqueteras.')
      setScannerRunning(false)
      return
    }

    const response = await fetch('/api/admin/ticket-scanner/run', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    })
    const payload = await response.json().catch(() => null)

    if (!response.ok) {
      setScannerStatus(payload?.error || 'No se pudieron revisar las tiqueteras.')
      setScannerRunning(false)
      return
    }

    setScannerRun(payload)
    const failed = payload.results?.filter((result: { error?: string }) => result.error).length || 0
    setScannerStatus(
      payload.addedCount > 0
        ? `${payload.addedCount} fecha${payload.addedCount === 1 ? '' : 's'} nueva${payload.addedCount === 1 ? '' : 's'} para aprobar.${payload.email?.sent ? ' Aviso enviado por correo.' : ''}`
        : failed
          ? 'No hay propuestas automáticas. Quedan fuentes por revisar manualmente.'
          : 'No hay fechas nuevas en las fuentes comprobadas.'
    )

    await loadRecentScannerEvents()
    setScannerRunning(false)
  }

  async function reviewScannerEvent(event: ScannerEvent, action: 'approve' | 'reject') {
    if (action === 'reject' && !window.confirm(`Descartar la fecha ${formatDate(event.date)} de ${resultName(event)}?`)) {
      return
    }

    setReviewingEventId(event.id)
    setError('')

    const {
      data: { session },
    } = await supabase.auth.getSession()

    const response = await fetch('/api/admin/ticket-scanner/review', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session?.access_token || ''}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ eventId: event.id, action }),
    })
    const payload = await response.json().catch(() => null)

    if (!response.ok) {
      setError(payload?.error || 'No se pudo guardar la revisión.')
      setReviewingEventId('')
      return
    }

    await loadRecentScannerEvents()
    setReviewingEventId('')
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="container-page py-5 pb-24 md:py-8">
        <Link href="/admin" className="inline-flex items-center gap-2 text-xs font-bold text-brand-400 md:text-sm">
          <ArrowLeft className="h-4 w-4" />
          Volver al admin
        </Link>

        <div className="mt-5 flex flex-col gap-1.5">
          <p className="text-xs font-bold uppercase text-brand-500">Revisión</p>
          <h1 className="text-2xl font-black tracking-tight md:text-4xl">Revisión diaria</h1>
          <p className="text-xs leading-5 text-slate-400 md:text-sm">
            Hoy, {formatToday()}. Las fechas encontradas quedan pendientes y no se publican hasta que las apruebes.
          </p>
        </div>

        <div className="mt-5">
          <button
            type="button"
            onClick={runTicketScanner}
            disabled={scannerRunning}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-500 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-brand-600 disabled:opacity-60 md:w-auto md:text-sm"
          >
            <RefreshCw className={`h-4 w-4 ${scannerRunning ? 'animate-spin' : ''}`} />
            {scannerRunning ? 'Revisando enlaces...' : 'Revisar enlaces'}
          </button>
          {scannerStatus && (
            <p className="mt-2 text-xs font-semibold text-slate-300">{scannerStatus}</p>
          )}
        </div>

        {loading && <p className="mt-8 text-slate-400">Cargando revisión...</p>}
        {error && <p className="mt-8 text-sm font-semibold text-brand-100">{error}</p>}

        {!loading && !error && (
          <>
            {scannerRun && (
              <section className="mt-6">
                <p className="text-xs text-slate-400">
                  {scannerRun.checkedProfiles - scannerRun.results.filter((result) => result.error).length} fichas sin incidencias · {scannerRun.results.filter((result) => result.error).length} para revisar manualmente
                </p>
              </section>
            )}

            <section className="mt-6">
              <h2 className="text-sm font-bold md:text-base">Propuestas encontradas</h2>
              {scannerEvents.length === 0 ? (
                <p className="mt-2 text-sm text-slate-400">Todavía no hay fechas nuevas encontradas hoy.</p>
              ) : (
                <div className="mt-2">
                  {scannerEvents.slice(0, 40).map((event) => (
                    <div key={event.id} className="border-b border-white/10 py-3 last:border-b-0">
                      <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold">
                          1 fecha nueva encontrada en {resultName(event)}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-400 md:text-xs">
                          Revisado el {formatCreatedDay(event.created_at)} · Fecha: {formatDate(event.date)}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewEventId(previewEventId === event.id ? '' : event.id)}
                        aria-expanded={previewEventId === event.id}
                        className="mt-0.5 inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-xs font-bold text-white hover:border-brand-500/50"
                      >
                        <Eye className="h-4 w-4" />
                        {previewEventId === event.id ? 'Ocultar evento' : 'Ver evento'}
                      </button>
                      {event.source_url && (
                        <a
                          href={event.source_url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-0.5 inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-xs font-bold text-brand-400 hover:border-brand-500/50 hover:text-brand-300"
                          aria-label="Abrir fuente"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Abrir tiquetera
                        </a>
                      )}
                      </div>
                      </div>
                      {previewEventId === event.id && (
                        <div className="mt-3 grid gap-4 rounded-lg border border-white/15 bg-white/5 p-4 sm:grid-cols-[minmax(0,160px)_1fr]">
                          {event.cover ? (
                            <img src={event.cover} alt={`Cartel de ${event.title}`} className="w-full max-w-40 rounded object-cover" />
                          ) : (
                            <div className="flex min-h-32 items-center justify-center rounded bg-white/5 text-xs text-slate-400">Sin cartel</div>
                          )}
                          <div className="space-y-2 text-sm text-slate-200">
                            <p className="font-bold text-white">{event.title}</p>
                            <p>{formatDate(event.date)} · {event.start_time?.slice(0, 5) || 'Hora sin confirmar'}{event.end_time ? `–${event.end_time.slice(0, 5)}` : ''}</p>
                            <p>{[event.venue, event.area, event.address].filter(Boolean).join(' · ')}</p>
                            {event.description && <p className="text-slate-300">{event.description}</p>}
                            <p>{event.music?.length ? event.music.join(', ') : 'Música sin indicar'} · {event.audience || 'Edad sin indicar'} · {event.price_from == null ? 'Precio sin indicar' : `Desde ${event.price_from} €`}</p>
                            <p className="text-xs text-amber-300">Vista previa: todavía no está publicado.</p>
                          </div>
                        </div>
                      )}
                      {event.needs_review && !event.published ? (
                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            onClick={() => reviewScannerEvent(event, 'approve')}
                            disabled={reviewingEventId === event.id}
                            className="rounded-full bg-brand-500 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
                          >
                            Aprobar y publicar
                          </button>
                          <button
                            type="button"
                            onClick={() => reviewScannerEvent(event, 'reject')}
                            disabled={reviewingEventId === event.id}
                            className="rounded-full border border-white/15 px-4 py-2 text-xs font-bold text-slate-200 disabled:opacity-50"
                          >
                            Descartar
                          </button>
                        </div>
                      ) : (
                        <p className="mt-2 text-[11px] font-semibold text-emerald-300">Publicada</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
            {scannerRun && scannerRun.results.some((result) => result.error) && (
              <details className="mt-6 border-t border-white/15 pt-4">
                <summary className="cursor-pointer text-sm font-bold text-white">
                  Revisar manualmente ({scannerRun.results.filter((result) => result.error).length})
                </summary>
                <div className="mt-4 flex flex-wrap gap-2" aria-label="Filtrar por tiquetera">
                  {['Todas', ...Array.from(new Set(scannerRun.results.filter((result) => result.error).map((result) => result.provider)))].map((provider) => (
                    <button
                      key={provider}
                      type="button"
                      onClick={() => setManualProvider(provider)}
                      aria-pressed={manualProvider === provider}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${manualProvider === provider ? 'border-brand-500 bg-brand-500 text-white' : 'border-white/20 text-slate-300 hover:border-brand-500'}`}
                    >
                      {provider} ({scannerRun.results.filter((result) => result.error && (provider === 'Todas' || result.provider === provider)).length})
                    </button>
                  ))}
                </div>
                <div className="mt-3 divide-y divide-white/10">
                  {scannerRun.results.filter((result) => result.error && (manualProvider === 'Todas' || result.provider === manualProvider)).map((result) => (
                    <div key={result.profileId} className="flex flex-wrap items-center justify-between gap-2 py-3">
                      <div>
                        <p className="text-sm font-semibold">{result.profileName}</p>
                        <p className="mt-1 max-w-2xl text-xs text-slate-400">{result.error}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {result.reviewUrls.map((url, index) => (
                          <a key={url} href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold hover:border-brand-500">
                            <ExternalLink className="h-3 w-3" /> {index === 0 ? 'Abrir fuente' : `Fuente ${index + 1}`}
                          </a>
                        ))}
                        {result.profileSlug && <Link href={`/admin/eventos/${result.profileSlug}`} className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold hover:border-brand-500">Abrir ficha</Link>}
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </>
        )}
      </section>
    </main>
  )
}
