'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type ScannerEvent = {
  id: string
  title: string
  date: string
  venue: string | null
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
    checkedUrls: string[]
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
    setScannerStatus(
      payload.addedCount > 0
        ? `${payload.addedCount} fecha${payload.addedCount === 1 ? '' : 's'} nueva${payload.addedCount === 1 ? '' : 's'} enviada${payload.addedCount === 1 ? '' : 's'} a revisión.${payload.email?.sent ? ' Aviso enviado por correo.' : ''}`
        : 'Revisión terminada: no hay fechas nuevas.'
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
                <h2 className="text-sm font-bold md:text-base">Resultado de hoy</h2>
                <p className="mt-1 text-xs text-slate-400">
                  {scannerRun.checkedProfiles} fichas revisadas
                </p>
                <div className="mt-2 space-y-2">
                  {scannerRun.results
                    .filter((result) => result.added.length > 0 || result.error)
                    .slice(0, 20)
                    .map((result) => (
                      <div key={result.profileId} className="py-2">
                        <p className="text-sm font-bold text-white">
                          {result.added.length > 0
                            ? `${result.added.length} fecha${result.added.length === 1 ? '' : 's'} nueva${result.added.length === 1 ? '' : 's'} encontrada${result.added.length === 1 ? '' : 's'} en ${result.profileName}`
                            : result.profileName}
                        </p>
                        {result.error ? (
                          <p className="mt-1 text-[11px] text-brand-200 md:text-xs">{result.error}</p>
                        ) : (
                          <p className="mt-1 text-[11px] leading-5 text-slate-400 md:text-xs">
                            {result.added.map((event) => formatDate(event.date)).join(' · ')}
                          </p>
                        )}
                      </div>
                    ))}
                  {scannerRun.results.every((result) => result.added.length === 0 && !result.error) && (
                    <p className="py-2 text-sm text-slate-400">No se han añadido fechas nuevas.</p>
                  )}
                </div>
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
                      {event.source_url && (
                        <a
                          href={event.source_url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-0.5 shrink-0 text-brand-400 hover:text-brand-300"
                          aria-label="Abrir fuente"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                      </div>
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
          </>
        )}
      </section>
    </main>
  )
}
