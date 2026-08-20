'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const MUSIC_OPTIONS = ['Comercial', 'Electronica', 'Pop', 'Indie', 'Flamenquito', 'Remember']
const AUDIENCE_OPTIONS = ['18-25', '25-35', '30+', 'Mixto']
const EVENT_TYPE_OPTIONS = ['Tardeo', 'Rooftop', 'Brunch', 'Afterwork', 'Fitness Party']

function generateSlug(title: string, date: string) {
  const cleanTitle = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return date ? `${cleanTitle}-${date}` : cleanTitle
}

function normalizeEventSeriesText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\b\d{1,2}\s*(?:de\s*)?(?:ene|enero|feb|febrero|mar|marzo|abr|abril|may|mayo|jun|junio|jul|julio|ago|agosto|sep|septiembre|oct|octubre|nov|noviembre|dic|diciembre)\b/gi, ' ')
    .replace(/\b\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?\b/g, ' ')
    .replace(/\b20\d{2}\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function getEventSeriesSlug(event: any) {
  const title = normalizeEventSeriesText(event.title || 'evento')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '')
  const venue = normalizeEventSeriesText(event.venue || '')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '')
  return [event.type || 'Tardeo', title || 'evento', venue].filter(Boolean).join('__').toLowerCase()
}

function formatDate(date: string) {
  if (!date) return 'Sin fecha'
  return new Date(date).toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  })
}

function firstMusic(event: any) {
  return Array.isArray(event.music) ? event.music[0] || 'Comercial' : event.music || 'Comercial'
}

function getUrlsFromText(text: string) {
  return Array.from(text.matchAll(/https?:\/\/[^\s)"']+/g)).map((match) => match[0])
}

function getHost(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

function isTicketUrl(url: string) {
  const host = getHost(url)
  return ['fourvenues', 'feverup', 'entradium', 'xceed', 'eventbrite', 'ticketmaster', 'dice.fm', 'ra.co'].some((domain) => host.includes(domain))
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  )
}

function TicketIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8Z" />
      <path d="M9 8v8" />
    </svg>
  )
}

function WebIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3Z" />
    </svg>
  )
}

export default function AdminEventSeriesPage() {
  const params = useParams()
  const series = decodeURIComponent(params.series as string)
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<any[]>([])
  const [researchItems, setResearchItems] = useState<any[]>([])
  const [message, setMessage] = useState('')
  const [editingEventId, setEditingEventId] = useState('')
  const [duplicateDate, setDuplicateDate] = useState('')

  async function loadEvents() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      window.location.href = '/login'
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      window.location.href = '/dashboard'
      return
    }

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: true })

    if (error) {
      setMessage(`No se pudieron cargar eventos: ${error.message}`)
      setLoading(false)
      return
    }

    setEvents((data || []).filter((event) => getEventSeriesSlug(event) === series))

    const { data: researchData } = await supabase
      .from('event_research_items')
      .select('*')
      .order('created_at', { ascending: false })

    setResearchItems((researchData || []).filter((item) => getEventSeriesSlug(item) === series))
    setLoading(false)
  }

  useEffect(() => {
    loadEvents()
  }, [series])

  const mainEvent = events[0] || researchItems[0]
  const upcomingEvents = useMemo(
    () => events.filter((event) => !event.date || event.date >= new Date().toISOString().slice(0, 10)),
    [events]
  )
  const pastEvents = useMemo(
    () => events.filter((event) => event.date && event.date < new Date().toISOString().slice(0, 10)),
    [events]
  )
  const editingEvent = events.find((event) => event.id === editingEventId)
  const relatedUrls = useMemo(() => {
    const urls = [...events, ...researchItems].flatMap((event) => [
      event.source_url,
      event.website_url,
      ...getUrlsFromText(event.description || ''),
    ]).filter(Boolean) as string[]
    return Array.from(new Set(urls))
  }, [events, researchItems])
  const instagramUrl = relatedUrls.find((url) => getHost(url).includes('instagram.com')) || ''
  const ticketUrl = relatedUrls.find(isTicketUrl) || mainEvent?.source_url || ''
  const websiteUrl = relatedUrls.find((url) => {
    const host = getHost(url)
    return host && !host.includes('instagram.com') && !isTicketUrl(url)
  }) || ''

  async function approveEvent(eventId: string) {
    const { error } = await supabase
      .from('events')
      .update({ status: 'approved', published: true, needs_review: false })
      .eq('id', eventId)

    if (error) {
      setMessage(`No se pudo aprobar: ${error.message}`)
      return
    }

    setMessage('Evento aprobado')
    loadEvents()
  }

  async function updateEvent(event: any) {
    const { error } = await supabase
      .from('events')
      .update({
        title: event.title,
        slug: generateSlug(event.title, event.date),
        venue: event.venue,
        area: event.area,
        address: event.address,
        maps_url: event.maps_url || null,
        source_url: event.source_url || null,
        date: event.date,
        start_time: event.start_time,
        end_time: event.end_time,
        type: event.type,
        music: Array.isArray(event.music) ? event.music : [event.music || 'Comercial'],
        audience: event.audience,
        price_from: event.price_from ? Number(event.price_from) : 0,
        cover: event.cover,
        description: event.description,
      })
      .eq('id', event.id)

    if (error) {
      setMessage(`No se pudo guardar: ${error.message}`)
      return
    }

    setEditingEventId('')
    setMessage('Fecha actualizada')
    loadEvents()
  }

  async function duplicateEvent(event: any) {
    if (!duplicateDate) {
      setMessage('Selecciona una fecha para duplicar')
      return
    }

    const exists = events.some((item) => item.date === duplicateDate)
    if (exists) {
      setMessage('Esa fecha ya existe en este evento')
      return
    }

    const { id: _id, created_at: _createdAt, updated_at: _updatedAt, ...baseEvent } = event
    const { error } = await supabase.from('events').insert({
      ...baseEvent,
      date: duplicateDate,
      slug: generateSlug(event.title, duplicateDate),
      status: 'pending',
      published: false,
      needs_review: true,
    })

    if (error) {
      setMessage(`No se pudo duplicar: ${error.message}`)
      return
    }

    setDuplicateDate('')
    setMessage('Nueva fecha creada como pendiente')
    loadEvents()
  }

  function updateEditingEvent(field: string, value: any) {
    setEvents((current) =>
      current.map((event) =>
        event.id === editingEventId ? { ...event, [field]: value } : event
      )
    )
  }

  if (loading) {
    return (
      <main className="container-page py-16">
        <p className="text-slate-400">Cargando ficha del evento...</p>
      </main>
    )
  }

  if (!mainEvent) {
    return (
      <main className="container-page py-16">
        <Link href="/admin" className="text-sm font-bold uppercase tracking-[0.18em] text-brand-500">← Volver al admin</Link>
        <h1 className="mt-6 text-3xl font-bold">Evento no encontrado</h1>
      </main>
    )
  }

  return (
    <main className="container-page py-10">
      <Link href="/admin" className="text-sm font-bold uppercase tracking-[0.18em] text-brand-500">← Volver al admin</Link>

      <section className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {mainEvent.cover && (
              <img src={mainEvent.cover} alt="" className="h-16 w-16 rounded-2xl object-cover" />
            )}
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-500">Ficha interna</p>
              <h1 className="text-4xl font-black">{mainEvent.title}</h1>
              <p className="mt-2 text-slate-400">
                {[mainEvent.venue, mainEvent.area, mainEvent.type].filter(Boolean).join(' - ')}
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
              <p className="text-xs text-slate-500">Total fechas</p>
              <p className="text-3xl font-black">{events.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
              <p className="text-xs text-slate-500">Aprobadas</p>
              <p className="text-3xl font-black text-emerald-300">{events.filter((event) => event.status === 'approved').length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
              <p className="text-xs text-slate-500">Pendientes</p>
              <p className="text-3xl font-black text-yellow-300">{events.filter((event) => event.status !== 'approved').length}</p>
            </div>
          </div>
        </div>

        <aside className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
          <h2 className="text-xl font-bold">Datos base</h2>
          <div className="mt-4 space-y-2 text-sm text-slate-300">
            <p><span className="text-slate-500">Tipo:</span> {mainEvent.type || 'Tardeo'}</p>
            <p><span className="text-slate-500">Musica:</span> {Array.isArray(mainEvent.music) ? mainEvent.music.join(', ') : mainEvent.music || 'Comercial'}</p>
            <p><span className="text-slate-500">Edad:</span> {mainEvent.audience || 'Mixto'}</p>
            <p><span className="text-slate-500">Precio:</span> Desde {mainEvent.price_from || 0} EUR</p>
            <p><span className="text-slate-500">Fuente:</span> {mainEvent.source_name || 'No indicada'}</p>
          </div>
          {mainEvent.description && (
            <p className="mt-4 text-sm leading-6 text-slate-400">{mainEvent.description}</p>
          )}
        </aside>
      </section>

      {message && (
        <div className="mt-6 rounded-2xl border border-brand-500/30 bg-brand-500/10 p-4 text-sm text-brand-100">
          {message}
        </div>
      )}

      <section className="mt-10">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Próximas fechas</h2>
            <p className="mt-1 text-sm text-slate-400">Edita, aprueba o duplica fechas desde una sola ficha.</p>
          </div>
          {events.length > 0 && (
            <div className="flex gap-2">
              <input type="date" className="input max-w-44" value={duplicateDate} onChange={(event) => setDuplicateDate(event.target.value)} />
              <button type="button" onClick={() => duplicateEvent(mainEvent)} className="rounded-full bg-brand-500 px-4 py-2 text-sm font-bold text-white hover:bg-brand-600">
                Duplicar fecha
              </button>
            </div>
          )}
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          {websiteUrl && (
            <a href={websiteUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs font-bold text-slate-200 hover:border-brand-500/60">
              <WebIcon /> Web
            </a>
          )}
          {instagramUrl && (
            <a href={instagramUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs font-bold text-slate-200 hover:border-brand-500/60">
              <InstagramIcon /> Instagram
            </a>
          )}
          {ticketUrl && (
            <a href={ticketUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs font-bold text-slate-200 hover:border-brand-500/60">
              <TicketIcon /> Tiquetera
            </a>
          )}
        </div>

        {upcomingEvents.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-slate-400">
            Esta ficha todavia no tiene fechas creadas en Admin. Usa el listado para pasarla a revision o crea el primer evento desde Crear evento.
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {upcomingEvents.map((event) => (
            <article key={event.id} className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80">
              <Link href={`/eventos/${event.slug}?from=admin`} className="block aspect-[4/5] bg-slate-950">
                {event.cover ? (
                  <img src={event.cover} alt="" className="h-full w-full object-cover transition hover:scale-[1.02]" />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-600">{event.type || 'TARDEA'}</div>
                )}
              </Link>
              <div className="p-4">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-slate-200">{formatDate(event.date)}</span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${event.status === 'approved' ? 'bg-emerald-500/20 text-emerald-200' : 'bg-yellow-500/20 text-yellow-200'}`}>
                    {event.status === 'approved' ? 'Aprobado' : 'Pendiente'}
                  </span>
                </div>
                <h3 className="mt-3 text-lg font-bold">{event.title}</h3>
                <p className="mt-1 text-sm text-slate-400">{event.start_time} - {event.end_time}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={() => setEditingEventId(event.id)} className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-brand-500/60">
                    Editar
                  </button>
                  {event.status !== 'approved' && (
                    <button type="button" onClick={() => approveEvent(event.id)} className="rounded-full bg-brand-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-600">
                      Aprobar
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {pastEvents.length > 0 && (
        <section className="mt-10">
          <h2 className="text-2xl font-bold">Fechas pasadas</h2>
          <div className="mt-4 space-y-2">
            {pastEvents.map((event) => (
              <div key={event.id} className="flex flex-col gap-2 rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-semibold">{formatDate(event.date)} · {event.title}</p>
                <Link href={`/eventos/${event.slug}?from=admin`} className="text-sm font-semibold text-brand-500">Vista</Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {editingEvent && (
        <section className="mt-10 rounded-3xl border border-white/10 bg-slate-900/80 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Editar fecha</h2>
            <button type="button" onClick={() => setEditingEventId('')} className="text-sm font-semibold text-slate-400 hover:text-white">Cerrar</button>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <input className="input" value={editingEvent.title || ''} onChange={(event) => updateEditingEvent('title', event.target.value)} placeholder="Nombre" />
            <input className="input" value={editingEvent.source_url || ''} onChange={(event) => updateEditingEvent('source_url', event.target.value)} placeholder="Link entradas" />
            <select className="select" value={editingEvent.type || 'Tardeo'} onChange={(event) => updateEditingEvent('type', event.target.value)}>
              {EVENT_TYPE_OPTIONS.map((option) => <option key={option}>{option}</option>)}
            </select>
            <select className="select" value={editingEvent.audience || 'Mixto'} onChange={(event) => updateEditingEvent('audience', event.target.value)}>
              {['Mixto', ...AUDIENCE_OPTIONS].map((option) => <option key={option}>{option}</option>)}
            </select>
            <input className="input" value={Array.isArray(editingEvent.music) ? editingEvent.music.join(', ') : editingEvent.music || ''} onChange={(event) => updateEditingEvent('music', event.target.value.split(',').map((item) => item.trim()).filter(Boolean))} placeholder={MUSIC_OPTIONS.join(', ')} />
            <input className="input" value={editingEvent.price_from || ''} onChange={(event) => updateEditingEvent('price_from', event.target.value)} placeholder="Precio desde" />
            <input className="input" value={editingEvent.venue || ''} onChange={(event) => updateEditingEvent('venue', event.target.value)} placeholder="Lugar" />
            <input className="input" value={editingEvent.area || ''} onChange={(event) => updateEditingEvent('area', event.target.value)} placeholder="Zona" />
            <input type="date" className="input" value={editingEvent.date || ''} onChange={(event) => updateEditingEvent('date', event.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <input type="time" className="input" value={editingEvent.start_time || '18:00'} onChange={(event) => updateEditingEvent('start_time', event.target.value)} />
              <input type="time" className="input" value={editingEvent.end_time || '23:00'} onChange={(event) => updateEditingEvent('end_time', event.target.value)} />
            </div>
            <input className="input lg:col-span-2" value={editingEvent.maps_url || ''} onChange={(event) => updateEditingEvent('maps_url', event.target.value)} placeholder="Google Maps" />
            <input className="input lg:col-span-2" value={editingEvent.cover || ''} onChange={(event) => updateEditingEvent('cover', event.target.value)} placeholder="URL cartel" />
            <textarea className="input lg:col-span-2" value={editingEvent.description || ''} onChange={(event) => updateEditingEvent('description', event.target.value)} placeholder="Descripcion" />
          </div>

          <button type="button" onClick={() => updateEvent(editingEvent)} className="mt-4 rounded-full bg-brand-500 px-5 py-3 text-sm font-bold text-white hover:bg-brand-600">
            Guardar cambios
          </button>
        </section>
      )}
    </main>
  )
}
