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

export default function AdminRevisionPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [scannerStatus, setScannerStatus] = useState('')
  const [scannerRunning, setScannerRunning] = useState(false)
  const [scannerRun, setScannerRun] = useState<ScannerRunResult | null>(null)
  const [scannerEvents, setScannerEvents] = useState<ScannerEvent[]>([])

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

    setScannerEvents(payload?.scannerEvents || [])
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
        ? `${payload.addedCount} fecha${payload.addedCount === 1 ? '' : 's'} nueva${payload.addedCount === 1 ? '' : 's'} añadida${payload.addedCount === 1 ? '' : 's'}.`
        : 'Revisión terminada: no hay fechas nuevas.'
    )

    await loadRecentScannerEvents()
    setScannerRunning(false)
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
          <h1 className="text-2xl font-black tracking-tight md:text-4xl">Tiqueteras</h1>
          <p className="text-xs leading-5 text-slate-400 md:text-sm">
            Revisa los enlaces de las fichas y añade automáticamente nuevas fechas futuras sin duplicar.
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
            {scannerRunning ? 'Revisando tiqueteras...' : 'Revisar tiqueteras'}
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
                <h2 className="text-sm font-bold md:text-base">Resultado de la revisión</h2>
                <p className="mt-1 text-xs text-slate-400">
                  {scannerRun.checkedProfiles} fichas · {scannerRun.checkedUrls} enlaces revisados
                </p>
                <div className="mt-2 space-y-2">
                  {scannerRun.results
                    .filter((result) => result.added.length > 0 || result.error)
                    .slice(0, 20)
                    .map((result) => (
                      <div key={result.profileId} className="py-2">
                        <p className="text-sm font-bold text-white">
                          {result.profileName}
                          {result.added.length > 0 ? ` · +${result.added.length}` : ''}
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
              <h2 className="text-sm font-bold md:text-base">Añadidas recientemente</h2>
              {scannerEvents.length === 0 ? (
                <p className="mt-2 text-sm text-slate-400">Todavía no hay fechas añadidas por revisión en los últimos 14 días.</p>
              ) : (
                <div className="mt-2">
                  {scannerEvents.slice(0, 20).map((event) => (
                    <div key={event.id} className="flex items-start justify-between gap-3 py-2">
                      <div>
                        <p className="text-sm font-bold">{event.title}</p>
                        <p className="mt-1 text-[11px] text-slate-400 md:text-xs">
                          {formatDate(event.date)}
                          {event.venue ? ` · ${event.venue}` : ''}
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
