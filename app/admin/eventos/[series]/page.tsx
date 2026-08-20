'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
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

function formatTime(time: string) {
  if (!time) return ''
  return time.split(':').slice(0, 2).join(':')
}

function formatCalendarMonth(date: Date) {
  return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
}

function formatCalendarDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getCalendarDays(monthDate: Date) {
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const leadingBlanks = (firstDay.getDay() + 6) % 7
  return [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => new Date(year, month, index + 1)),
  ]
}

function moveMonth(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1)
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

function getFirstUrl(...urls: string[]) {
  return urls.find(Boolean) || ''
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

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M16.6 4.1c.4 2.2 1.7 3.6 3.8 4v3.2a7.2 7.2 0 0 1-3.7-1.1v5.6c0 3.1-2.2 5.4-5.4 5.4-3 0-5.3-2-5.3-4.9 0-3.1 2.4-5.1 5.8-5.1.4 0 .7 0 1 .1v3.3a4 4 0 0 0-1.1-.2c-1.4 0-2.3.7-2.3 1.8 0 1.1.8 1.8 1.9 1.8 1.3 0 2-.8 2-2.3V4.1h3.3Z" />
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
  const router = useRouter()
  const series = decodeURIComponent(params.series as string)
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<any[]>([])
  const [researchItems, setResearchItems] = useState<any[]>([])
  const [message, setMessage] = useState('')
  const [editingEventId, setEditingEventId] = useState('')
  const [duplicateDates, setDuplicateDates] = useState<string[]>([])
  const [calendarMonth, setCalendarMonth] = useState(() => new Date())
  const [isEditingBase, setIsEditingBase] = useState(false)
  const [baseForm, setBaseForm] = useState<any>({})
  const [baseCoverFile, setBaseCoverFile] = useState<File | null>(null)
  const [baseCoverPreview, setBaseCoverPreview] = useState('')
  const [baseSaving, setBaseSaving] = useState(false)
  const [uploadingEventCoverId, setUploadingEventCoverId] = useState('')

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
  const existingDates = useMemo(() => new Set(events.map((event) => event.date).filter(Boolean)), [events])
  const calendarDays = useMemo(() => getCalendarDays(calendarMonth), [calendarMonth])
  const relatedUrls = useMemo(() => {
    const urls = [...events, ...researchItems].flatMap((event) => [
      event.source_url,
      event.website_url,
      event.instagram_url,
      event.tiktok_url,
      ...getUrlsFromText(event.description || ''),
    ]).filter(Boolean) as string[]
    return Array.from(new Set(urls))
  }, [events, researchItems])
  const instagramUrl = relatedUrls.find((url) => getHost(url).includes('instagram.com')) || ''
  const tiktokUrl = relatedUrls.find((url) => getHost(url).includes('tiktok.com')) || ''
  const ticketUrl = relatedUrls.find(isTicketUrl) || mainEvent?.source_url || ''
  const websiteUrl = relatedUrls.find((url) => {
    const host = getHost(url)
    return host && !host.includes('instagram.com') && !host.includes('tiktok.com') && !isTicketUrl(url)
  }) || ''

  function openBaseEditor() {
    const currentCover = mainEvent.cover || ''
    setBaseForm({
      title: mainEvent.title || '',
      type: mainEvent.type || 'Tardeo',
      music: Array.isArray(mainEvent.music) ? mainEvent.music.join(', ') : mainEvent.music || 'Comercial',
      audience: mainEvent.audience || 'Mixto',
      venue: mainEvent.venue || '',
      area: mainEvent.area || 'Madrid',
      address: mainEvent.address || '',
      maps_url: mainEvent.maps_url || '',
      price_from: mainEvent.price_from?.toString() || '0',
      website_url: getFirstUrl(mainEvent.website_url, websiteUrl),
      source_url: getFirstUrl(mainEvent.source_url, ticketUrl),
      instagram_url: getFirstUrl(mainEvent.instagram_url, instagramUrl),
      tiktok_url: getFirstUrl(mainEvent.tiktok_url, tiktokUrl),
      cover: currentCover,
      description: mainEvent.description || '',
    })
    setBaseCoverFile(null)
    setBaseCoverPreview(currentCover)
    setIsEditingBase(true)
  }

  function updateBaseForm(field: string, value: string) {
    setBaseForm((current: any) => ({ ...current, [field]: value }))
  }

  function handleBaseCoverChange(file: File | null) {
    setBaseCoverFile(file)
    if (file) {
      const preview = URL.createObjectURL(file)
      setBaseCoverPreview(preview)
      return
    }
    setBaseCoverPreview(baseForm.cover || '')
  }

  function closeBaseEditor() {
    setIsEditingBase(false)
    setBaseCoverFile(null)
    setBaseCoverPreview('')
  }

  async function saveBaseProfile() {
    setBaseSaving(true)
    const musicList = (baseForm.music || '')
      .split(',')
      .map((item: string) => item.trim())
      .filter(Boolean)
    let coverUrl = baseForm.cover || null

    if (baseCoverFile) {
      const safeName = baseCoverFile.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9.]+/g, '-')
        .replace(/^-+|-+$/g, '')
      const fileName = `series/${series}/${Date.now()}-${safeName}`
      const { error: uploadError } = await supabase.storage
        .from('events')
        .upload(fileName, baseCoverFile, { upsert: true })

      if (uploadError) {
        setBaseSaving(false)
        setMessage(`No se pudo subir el cartel: ${uploadError.message}`)
        return
      }

      const { data } = supabase.storage.from('events').getPublicUrl(fileName)
      coverUrl = data.publicUrl
    }

    const payload = {
      title: baseForm.title || mainEvent.title,
      venue: baseForm.venue || null,
      area: baseForm.area || null,
      address: baseForm.address || null,
      maps_url: baseForm.maps_url || null,
      type: baseForm.type || 'Tardeo',
      music: musicList.length ? musicList : ['Comercial'],
      audience: baseForm.audience || 'Mixto',
      price_from: baseForm.price_from ? Number(baseForm.price_from) : 0,
      website_url: baseForm.website_url || null,
      source_url: baseForm.source_url || null,
      instagram_url: baseForm.instagram_url || null,
      tiktok_url: baseForm.tiktok_url || null,
      cover: coverUrl,
      description: baseForm.description || null,
    }

    if (events.length > 0) {
      const { error } = await supabase
        .from('events')
        .update(payload)
        .in('id', events.map((event) => event.id))

      if (error) {
        setBaseSaving(false)
        setMessage(`No se pudieron guardar los datos base: ${error.message}`)
        return
      }
    }

    const researchIds = researchItems.map((item) => item.id).filter(Boolean)
    if (researchIds.length > 0) {
      const { error } = await supabase
        .from('event_research_items')
        .update({
          title: payload.title,
          venue: payload.venue,
          area: payload.area,
          maps_url: payload.maps_url,
          type: payload.type,
          music: payload.music,
          audience: payload.audience,
          price_from: payload.price_from,
          source_url: payload.source_url,
          notes: payload.description,
        })
        .in('id', researchIds)

      if (error) {
        setBaseSaving(false)
        setMessage(`Datos guardados en eventos, pero no en listado: ${error.message}`)
        return
      }
    }

    const newSeries = getEventSeriesSlug({ title: payload.title, type: payload.type, venue: payload.venue })
    setIsEditingBase(false)
    setBaseCoverFile(null)
    setBaseCoverPreview('')
    setBaseSaving(false)
    setMessage('Datos base de la ficha guardados')
    if (newSeries !== series) {
      router.replace(`/admin/eventos/${newSeries}`)
      return
    }
    loadEvents()
  }

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
        website_url: event.website_url || null,
        instagram_url: event.instagram_url || null,
        tiktok_url: event.tiktok_url || null,
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

  async function uploadEventCover(event: any, file: File | null) {
    if (!file) return

    setUploadingEventCoverId(event.id)
    const safeName = file.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9.]+/g, '-')
      .replace(/^-+|-+$/g, '')
    const fileName = `series/${series}/dates/${event.id}-${Date.now()}-${safeName}`

    const { error: uploadError } = await supabase.storage
      .from('events')
      .upload(fileName, file, { upsert: true })

    if (uploadError) {
      setUploadingEventCoverId('')
      setMessage(`No se pudo subir el cartel: ${uploadError.message}`)
      return
    }

    const { data } = supabase.storage.from('events').getPublicUrl(fileName)
    const { error } = await supabase
      .from('events')
      .update({ cover: data.publicUrl })
      .eq('id', event.id)

    setUploadingEventCoverId('')

    if (error) {
      setMessage(`Cartel subido, pero no se pudo guardar: ${error.message}`)
      return
    }

    setMessage(`Cartel actualizado para ${formatDate(event.date)}`)
    loadEvents()
  }

  function toggleDuplicateDate(date: string) {
    const exists = events.some((item) => item.date === date)
    if (exists) {
      setMessage(`La fecha ${formatDate(date)} ya esta creada`)
      return
    }

    setDuplicateDates((current) =>
      current.includes(date)
        ? current.filter((item) => item !== date)
        : [...current, date].sort()
    )
  }

  async function duplicateEvent(event: any) {
    if (duplicateDates.length === 0) {
      setMessage('Selecciona una o varias fechas para duplicar')
      return
    }

    const { id: _id, created_at: _createdAt, updated_at: _updatedAt, ...baseEvent } = event
    const rowsToInsert = duplicateDates.map((date) => ({
      ...baseEvent,
      date,
      slug: generateSlug(event.title, date),
      status: 'pending',
      published: false,
      needs_review: true,
    }))
    const { error } = await supabase.from('events').insert(rowsToInsert)

    if (error) {
      setMessage(`No se pudo duplicar: ${error.message}`)
      return
    }

    const createdCount = duplicateDates.length
    setDuplicateDates([])
    setMessage(`${createdCount} fecha${createdCount === 1 ? '' : 's'} creada${createdCount === 1 ? '' : 's'} como pendiente${createdCount === 1 ? '' : 's'}`)
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
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold">Datos base</h2>
            <button type="button" onClick={openBaseEditor} className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-bold text-slate-200 hover:border-brand-500/60">
              Editar
            </button>
          </div>
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

      {isEditingBase && (
        <section className="mt-10 rounded-3xl border border-white/10 bg-slate-900/80 p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-500">Editar ficha</p>
              <h2 className="text-2xl font-bold">Datos base y enlaces</h2>
              <p className="mt-1 text-sm text-slate-400">Estos cambios se aplican a todas las fechas de esta ficha.</p>
            </div>
            <button type="button" onClick={closeBaseEditor} className="text-sm font-semibold text-slate-400 hover:text-white">Cerrar</button>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <input className="input" value={baseForm.title || ''} onChange={(event) => updateBaseForm('title', event.target.value)} placeholder="Nombre del evento" />
            <select className="select" value={baseForm.type || 'Tardeo'} onChange={(event) => updateBaseForm('type', event.target.value)}>
              {EVENT_TYPE_OPTIONS.map((option) => <option key={option}>{option}</option>)}
            </select>
            <input className="input" value={baseForm.venue || ''} onChange={(event) => updateBaseForm('venue', event.target.value)} placeholder="Lugar" />
            <input className="input" value={baseForm.area || ''} onChange={(event) => updateBaseForm('area', event.target.value)} placeholder="Zona" />
            <input className="input" value={baseForm.music || ''} onChange={(event) => updateBaseForm('music', event.target.value)} placeholder={MUSIC_OPTIONS.join(', ')} />
            <select className="select" value={baseForm.audience || 'Mixto'} onChange={(event) => updateBaseForm('audience', event.target.value)}>
              {['Mixto', ...AUDIENCE_OPTIONS].map((option) => <option key={option}>{option}</option>)}
            </select>
            <input className="input" value={baseForm.price_from || ''} onChange={(event) => updateBaseForm('price_from', event.target.value)} placeholder="Precio desde" />
            <input className="input" value={baseForm.maps_url || ''} onChange={(event) => updateBaseForm('maps_url', event.target.value)} placeholder="Google Maps" />
            <input className="input" value={baseForm.website_url || ''} onChange={(event) => updateBaseForm('website_url', event.target.value)} placeholder="Web oficial" />
            <input className="input" value={baseForm.source_url || ''} onChange={(event) => updateBaseForm('source_url', event.target.value)} placeholder="Tiquetera" />
            <input className="input" value={baseForm.instagram_url || ''} onChange={(event) => updateBaseForm('instagram_url', event.target.value)} placeholder="Instagram" />
            <input className="input" value={baseForm.tiktok_url || ''} onChange={(event) => updateBaseForm('tiktok_url', event.target.value)} placeholder="TikTok" />
            <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4 lg:col-span-2">
              <div className="grid gap-4 md:grid-cols-[140px_1fr] md:items-center">
                <div className="aspect-square overflow-hidden rounded-2xl bg-slate-950">
                  {baseCoverPreview ? (
                    <img src={baseCoverPreview} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center px-3 text-center text-xs font-semibold text-slate-600">
                      Sin cartel
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Cartel principal</p>
                  <p className="mt-1 text-xs text-slate-500">Sube el cartel desde tu ordenador. Se guardara como imagen base de todas las fechas de esta ficha.</p>
                  <label className="mt-3 inline-flex cursor-pointer rounded-full border border-white/10 px-4 py-2 text-xs font-bold text-slate-200 hover:border-brand-500/60">
                    Subir cartel
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => handleBaseCoverChange(event.target.files?.[0] || null)}
                    />
                  </label>
                  {baseCoverFile && (
                    <p className="mt-2 truncate text-xs text-brand-200">{baseCoverFile.name}</p>
                  )}
                </div>
              </div>
            </div>
            <textarea className="input lg:col-span-2" value={baseForm.description || ''} onChange={(event) => updateBaseForm('description', event.target.value)} placeholder="Descripcion base de la ficha" />
          </div>

          <button type="button" onClick={saveBaseProfile} disabled={baseSaving} className="mt-4 rounded-full bg-brand-500 px-5 py-3 text-sm font-bold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60">
            {baseSaving ? 'Guardando...' : 'Guardar ficha'}
          </button>
        </section>
      )}

      <section className="mt-10">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Próximas fechas</h2>
            <p className="mt-1 text-sm text-slate-400">Edita, aprueba o duplica fechas desde una sola ficha.</p>
          </div>
          {events.length > 0 && (
            <div className="w-full rounded-2xl border border-white/10 bg-slate-950/40 p-3 sm:max-w-[360px]">
              <div className="mb-3 flex items-center justify-between gap-3">
                <button type="button" onClick={() => setCalendarMonth((current) => moveMonth(current, -1))} className="rounded-full border border-white/10 px-3 py-1 text-sm font-bold text-slate-300 hover:border-brand-500/60">
                  ←
                </button>
                <p className="text-sm font-black capitalize text-white">{formatCalendarMonth(calendarMonth)}</p>
                <button type="button" onClick={() => setCalendarMonth((current) => moveMonth(current, 1))} className="rounded-full border border-white/10 px-3 py-1 text-sm font-bold text-slate-300 hover:border-brand-500/60">
                  →
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day) => <span key={day}>{day}</span>)}
              </div>

              <div className="mt-2 grid grid-cols-7 gap-1">
                {calendarDays.map((date, index) => {
                  if (!date) return <span key={`blank-${index}`} className="h-8" />
                  const dateKey = formatCalendarDate(date)
                  const isExisting = existingDates.has(dateKey)
                  const isSelected = duplicateDates.includes(dateKey)

                  return (
                    <button
                      key={dateKey}
                      type="button"
                      disabled={isExisting}
                      onClick={() => toggleDuplicateDate(dateKey)}
                      className={`h-8 rounded-full text-xs font-bold transition ${
                        isExisting
                          ? 'cursor-not-allowed bg-white/5 text-slate-600 line-through'
                          : isSelected
                            ? 'bg-brand-500 text-white shadow-[0_0_0_2px_rgba(244,63,94,0.25)]'
                            : 'text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {date.getDate()}
                    </button>
                  )
                })}
              </div>

              {duplicateDates.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {duplicateDates.map((date) => (
                    <button
                      key={date}
                      type="button"
                      onClick={() => toggleDuplicateDate(date)}
                      className="rounded-full bg-brand-500/15 px-2.5 py-1 text-[11px] font-bold text-brand-100 hover:bg-red-500/20 hover:text-red-100"
                    >
                      {formatDate(date)} x
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-3 flex items-center justify-between gap-2">
                <button type="button" onClick={() => setDuplicateDates([])} className={`text-[11px] font-semibold text-slate-500 hover:text-white ${duplicateDates.length === 0 ? 'invisible' : ''}`}>
                  Limpiar
                </button>
                <button type="button" onClick={() => duplicateEvent(mainEvent)} className="rounded-full bg-brand-500 px-4 py-2 text-xs font-bold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50" disabled={duplicateDates.length === 0}>
                  Crear fecha{duplicateDates.length === 1 ? '' : 's'}
                </button>
              </div>
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
          {tiktokUrl && (
            <a href={tiktokUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs font-bold text-slate-200 hover:border-brand-500/60">
              <TikTokIcon /> TikTok
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

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {upcomingEvents.map((event) => (
            <article key={event.id} className="group relative aspect-[9/16] overflow-hidden rounded-3xl border border-white/10 bg-slate-900">
              <Link
                href={`/eventos/${event.slug}?from=admin`}
                className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105"
                style={{
                  backgroundImage: `url(${event.cover || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80'})`,
                }}
                aria-label={`Ver ${event.title}`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/5" />

              <div className="relative z-10 flex h-full flex-col justify-between p-3">
                <div className="flex flex-wrap gap-1.5">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${event.status === 'approved' ? 'bg-emerald-500/25 text-emerald-100' : 'bg-yellow-500/25 text-yellow-100'}`}>
                    {event.status === 'approved' ? 'Aprobado' : 'Pendiente'}
                  </span>
                  <span className="rounded-full bg-black/35 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur">
                    {event.type || 'Tardeo'}
                  </span>
                </div>

                <div>
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">{formatDate(event.date)}</span>
                    <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">
                      {formatTime(event.start_time)} - {formatTime(event.end_time)}
                    </span>
                  </div>
                  <h3 className="line-clamp-2 text-base font-black leading-tight text-white">{event.title}</h3>
                  <p className="mt-1 line-clamp-1 text-xs font-semibold text-slate-200">{event.venue || mainEvent.venue}</p>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                  <label className={`cursor-pointer rounded-full border border-white/10 px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:border-brand-500/60 ${uploadingEventCoverId === event.id ? 'pointer-events-none opacity-60' : ''}`}>
                    {uploadingEventCoverId === event.id ? 'Subiendo' : 'Subir cartel'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(inputEvent) => uploadEventCover(event, inputEvent.target.files?.[0] || null)}
                    />
                  </label>
                  <button type="button" onClick={() => setEditingEventId(event.id)} className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:border-brand-500/60">
                    Editar
                  </button>
                  {event.status !== 'approved' && (
                    <button type="button" onClick={() => approveEvent(event.id)} className="rounded-full bg-brand-500 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-brand-600">
                      Aprobar
                    </button>
                  )}
                  </div>
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
                <p className="font-semibold">{formatDate(event.date)} · {formatTime(event.start_time)} - {formatTime(event.end_time)} · {event.title}</p>
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
