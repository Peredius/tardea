'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

function generateSlug(title: string, date: string) {
  const cleanTitle = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return date ? `${cleanTitle}-${date}` : cleanTitle
}

const MUSIC_OPTIONS = ['Comercial', 'Electronica', 'Pop', 'Indie', 'Flamenquito', 'Remember']
const AUDIENCE_OPTIONS = ['18-25', '25-35', '30+', 'Mixto']

export default function AdminPage() {
  const formRef = useRef<HTMLFormElement | null>(null)
  const [title, setTitle] = useState('')
  const [venue, setVenue] = useState('')
  const [area, setArea] = useState('')
  const [customArea, setCustomArea] = useState('')
  const [date, setDate] = useState('')
  const [type, setType] = useState('')
  const [address, setAddress] = useState('')
  const [mapsUrl, setMapsUrl] = useState('')
  const [ticketUrl, setTicketUrl] = useState('')
  const [startTime, setStartTime] = useState('17:00')
  const [endTime, setEndTime] = useState('23:00')
  const [priceFrom, setPriceFrom] = useState('')
  const [music, setMusic] = useState<string[]>([])
  const [audience, setAudience] = useState('25-35')
  const [cover, setCover] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [reelUrl, setReelUrl] = useState('')
  const [message, setMessage] = useState('')
  const [description, setDescription] = useState('')
  const [perks, setPerks] = useState('')
  const [events, setEvents] = useState<any[]>([])
  const [eventListTab, setEventListTab] = useState<'created' | 'past'>('created')
  const [pendingEvents, setPendingEvents] = useState<any[]>([])
  const [eventClaims, setEventClaims] = useState<any[]>([])
  const [scoutEvents, setScoutEvents] = useState<any[]>([])
  const [scoutTypeFilter, setScoutTypeFilter] = useState('Todos')
  const [eventTypeFilter, setEventTypeFilter] = useState('Todos')
  const [editingEvent, setEditingEvent] = useState<any | null>(null)

  useEffect(() => {
    async function checkAdmin() {
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

      fetchEvents()
    }

    checkAdmin()
  }, [])

  async function fetchEvents() {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'approved')
      .order('date', { ascending: true })

    const { data: pendingData, error: pendingError } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'pending')
      .or('needs_review.is.null,needs_review.eq.false')
      .order('date', { ascending: true })

    const { data: scoutData, error: scoutError } = await supabase
      .from('events')
      .select('*')
      .eq('imported_by_agent', true)
      .eq('needs_review', true)
      .order('date', { ascending: true })

    if (error || pendingError || scoutError) {
      console.error(error || pendingError || scoutError)
      return
    }

    setEvents(data || [])
    setPendingEvents(pendingData || [])
    setScoutEvents(scoutData || [])
    fetchEventClaims()
  }

  async function fetchEventClaims() {
    const { data, error } = await supabase
      .from('event_claims')
      .select('*, events(title, date, venue, slug)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })

    if (error) {
      console.error(error)
      return
    }

    setEventClaims(data || [])
  }

  async function approveEvent(eventId: string) {
    const { error } = await supabase
      .from('events')
      .update({ status: 'approved', published: true })
      .eq('id', eventId)

    if (error) {
      setMessage('Error al aprobar evento')
      console.error(error)
      return
    }

    setMessage('Evento aprobado correctamente')
    fetchEvents()
  }

  async function approveClaim(claim: any) {
    const { error: eventError } = await supabase
      .from('events')
      .update({
        user_id: claim.promoter_user_id,
        claimed_at: new Date().toISOString(),
      })
      .eq('id', claim.event_id)

    if (eventError) {
      setMessage(`Error al asignar evento: ${eventError.message}`)
      return
    }

    const { error: claimError } = await supabase
      .from('event_claims')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', claim.id)

    if (claimError) {
      setMessage(`Evento asignado, pero no se pudo cerrar la solicitud: ${claimError.message}`)
      return
    }

    setMessage('Reclamacion aprobada y evento asignado al promotor')
    fetchEvents()
  }

  async function rejectClaim(claimId: string) {
    const { error } = await supabase
      .from('event_claims')
      .update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', claimId)

    if (error) {
      setMessage(`Error al rechazar solicitud: ${error.message}`)
      return
    }

    setMessage('Reclamacion rechazada')
    fetchEventClaims()
  }

  async function approveScoutEvent(eventId: string) {
    const { error } = await supabase
      .from('events')
      .update({
        status: 'approved',
        published: true,
        needs_review: false,
      })
      .eq('id', eventId)

    if (error) {
      setMessage(`Error al aprobar evento Scout: ${error.message}`)
      return
    }

    setMessage('Evento Scout aprobado y publicado')
    fetchEvents()
  }

  async function discardScoutEvent(eventId: string) {
    const confirmed = window.confirm('Quieres descartar este evento encontrado por Scout?')
    if (!confirmed) return

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId)

    if (error) {
      setMessage(`Error al descartar evento Scout: ${error.message}`)
      return
    }

    setMessage('Evento Scout descartado')
    fetchEvents()
  }
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    let imageUrl = editingEvent?.cover || ''

    if (cover) {
      const fileName = `${Date.now()}-${cover.name}`

      const { error: uploadError } = await supabase.storage
        .from('events')
        .upload(fileName, cover)

      if (uploadError) {
        setMessage(`Error subiendo imagen: ${uploadError.message}`)
        return
      }

      const { data } = supabase.storage.from('events').getPublicUrl(fileName)
      imageUrl = data.publicUrl
    }

    const eventData = {
      title,
      slug: generateSlug(title, date),
      venue,
      area: area === 'Otra' ? customArea : area,
      address,
      maps_url: mapsUrl || null,
      source_url: ticketUrl || null,
      date,
      start_time: startTime,
      end_time: endTime,
      type,
      music,
      audience,
      price_from: priceFrom ? Number(priceFrom) : 0,
      cover: imageUrl,
      reel_url: reelUrl || null,
      featured: false,
      description,
      perks: perks ? perks.split(',').map((p) => p.trim()) : [],
      status: editingEvent?.status || 'approved',
      published: editingEvent ? Boolean(editingEvent.published) : true,
    }

    let error

    if (editingEvent) {
      const { error: updateError } = await supabase
        .from('events')
        .update(eventData)
        .eq('id', editingEvent.id)

      error = updateError
    } else {
      const { error: insertError } = await supabase.from('events').insert(eventData)
      error = insertError
    }

    if (error) {
      setMessage('Error al guardar evento')
      console.error(error)
      return
    }

    setMessage(
      editingEvent
        ? 'Evento actualizado correctamente'
        : 'Evento creado correctamente'
    )

    setEditingEvent(null)
    fetchEvents()

    setTitle('')
    setVenue('')
    setArea('')
    setCustomArea('')
    setDate('')
    setType('')
    setAddress('')
    setMapsUrl('')
    setTicketUrl('')
    setStartTime('17:00')
    setEndTime('23:00')
    setPriceFrom('')
    setMusic([])
    setAudience('25-35')
    setCover(null)
    setPreviewUrl('')
    setReelUrl('')
    setDescription('')
    setPerks('')
  }

  function loadEventForEdit(event: any) {
    const cleanCover = event.cover?.startsWith('blob:') ? '' : event.cover

    setEditingEvent({ ...event, cover: cleanCover })
    setTitle(event.title || '')
    setVenue(event.venue || '')
    setAddress(event.address || '')
    setMapsUrl(event.maps_url || '')
    setTicketUrl(event.source_url || '')
    setArea(event.area || '')
    setDate(event.date || '')
    setStartTime(event.start_time || '17:00')
    setEndTime(event.end_time || '23:00')
    setType(event.type || '')
    setMusic(event.music || [])
    setAudience(event.audience || '25-35')
    setPriceFrom(event.price_from?.toString() || '')
    setPreviewUrl(cleanCover || '')
    setCover(null)
    setReelUrl(event.reel_url || '')
    setDescription(event.description || '')
    setPerks(event.perks?.join(' - ') || '')
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function toggleMusicStyle(style: string) {
    setMusic((current) =>
      current.includes(style)
        ? current.filter((item) => item !== style)
        : [...current, style]
    )
  }

  const todayDate = new Date().toISOString().split('T')[0]
  const createdEvents = events.filter((event) => !event.date || event.date >= todayDate)
  const pastEvents = events
    .filter((event) => event.date && event.date < todayDate)
    .slice()
    .reverse()
  const scoutTypes = ['Todos', ...Array.from(new Set(scoutEvents.map((event) => event.type || 'Tardeo')))]
  const eventTypes = ['Todos', ...Array.from(new Set(events.map((event) => event.type || 'Tardeo')))]
  const filteredScoutEvents = scoutTypeFilter === 'Todos'
    ? scoutEvents
    : scoutEvents.filter((event) => (event.type || 'Tardeo') === scoutTypeFilter)
  const filteredVisibleEvents = eventTypeFilter === 'Todos'
    ? (eventListTab === 'past' ? pastEvents : createdEvents)
    : (eventListTab === 'past' ? pastEvents : createdEvents).filter((event) => (event.type || 'Tardeo') === eventTypeFilter)
  const visibleEvents = filteredVisibleEvents

  return (
    <main className="container-page py-16">
      <section className="mb-10 flex items-start justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold">Panel admin TARDEA</h1>
          <p className="mt-3 text-slate-400">Crear y editar eventos</p>
        </div>

        <button
          onClick={async () => {
            await supabase.auth.signOut()
            window.location.href = '/login'
          }}
          className="shrink-0 text-sm text-slate-400 hover:text-white"
        >
          Cerrar sesion
        </button>
      </section>

      <form ref={formRef} onSubmit={handleSubmit} className="card mt-8 max-w-2xl space-y-6 p-6">
        {editingEvent && (
          <div className="rounded-2xl border border-brand-500/30 bg-brand-500/10 p-4 text-sm text-brand-100">
            Editando: {editingEvent.title}. Si era pendiente, seguira pendiente hasta que pulses Aprobar.
          </div>
        )}

        <input className="input" placeholder="Nombre del evento" value={title} onChange={(e) => setTitle(e.target.value)} />

        <select className="select" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">Tipo de evento</option>
          <option>Tardeo</option>
          <option>Rooftop</option>
          <option>Brunch</option>
          <option>Fitness Party</option>
          <option>Afterwork</option>
        </select>

        <select className="select" value={audience} onChange={(e) => setAudience(e.target.value)}>
          <option value="">Edad recomendada</option>
          {AUDIENCE_OPTIONS.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>

        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
          <p className="mb-3 text-sm font-semibold text-slate-300">Estilos musicales</p>
          <div className="flex flex-wrap gap-2">
            {MUSIC_OPTIONS.map((style) => (
              <button
                key={style}
                type="button"
                onClick={() => toggleMusicStyle(style)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  music.includes(style)
                    ? 'bg-brand-500 text-white'
                    : 'bg-white/10 text-slate-300 hover:bg-white/15'
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        <select className="select" value={area} onChange={(e) => setArea(e.target.value)}>
          <option value="">Zona</option>
          <option>Centro</option>
          <option>Salamanca</option>
          <option>Retiro</option>
          <option value="Otra">Otra</option>
        </select>

        {area === 'Otra' && (
          <input className="input" placeholder="Zona personalizada" value={customArea} onChange={(e) => setCustomArea(e.target.value)} />
        )}

        <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
        <input type="time" className="input" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        <input type="time" className="input" value={endTime} onChange={(e) => setEndTime(e.target.value)} />

        <input className="input" placeholder="Precio (EUR)" value={priceFrom} onChange={(e) => setPriceFrom(e.target.value)} />
        <input className="input" placeholder="Lugar" value={venue} onChange={(e) => setVenue(e.target.value)} />
        <input className="input" placeholder="Direccion" value={address} onChange={(e) => setAddress(e.target.value)} />
        <input className="input" placeholder="Link de Google Maps" value={mapsUrl} onChange={(e) => setMapsUrl(e.target.value)} />
        <input className="input" placeholder="Link de compra / tiquetera" value={ticketUrl} onChange={(e) => setTicketUrl(e.target.value)} />

        <textarea className="input" placeholder="Descripcion" value={description} onChange={(e) => setDescription(e.target.value)} />
        <input className="input" placeholder="Extras" value={perks} onChange={(e) => setPerks(e.target.value)} />

        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
          <p className="text-sm font-semibold text-slate-300">Cartel del evento</p>
          <p className="mt-1 text-xs text-slate-500">
            Imagen principal del evento. Recomendado 4:5 o cuadrado.
          </p>
          <input
            type="file"
            accept="image/*"
            className="input mt-4"
            onChange={(e) => {
              const file = e.target.files?.[0] || null
              setCover(file)
              setPreviewUrl(file ? URL.createObjectURL(file) : '')
            }}
          />
        </div>

        {previewUrl && (
          <img src={previewUrl} alt="Preview del cartel" className="max-h-[520px] w-full rounded-xl object-contain" />
        )}

        <input
          className="input"
          placeholder="Link del reel o video"
          value={reelUrl}
          onChange={(e) => setReelUrl(e.target.value)}
        />

        <button className="btn-primary w-full" type="submit">
          {editingEvent ? 'Guardar cambios' : 'Crear evento'}
        </button>

        {message && <p className="text-sm text-brand-500">{message}</p>}
      </form>

      <div className="mt-12">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-500">TARDEA Scout</p>
            <h2 className="text-2xl font-bold">Eventos encontrados para revisar</h2>
          </div>
          <p className="text-sm text-slate-400">Se publican solo despues de revisar datos, imagen y fuente.</p>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {scoutTypes.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setScoutTypeFilter(option)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${scoutTypeFilter === option ? 'bg-brand-500 text-white' : 'bg-white/10 text-slate-300 hover:bg-white/15'}`}
            >
              {option}
            </button>
          ))}
        </div>

        {filteredScoutEvents.length === 0 && (
          <p className="text-slate-400">No hay eventos encontrados para este filtro</p>
        )}

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70">
          <div className="hidden grid-cols-[92px_minmax(220px,1.4fr)_120px_130px_minmax(150px,1fr)_auto] gap-3 border-b border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 xl:grid">
            <span>Fecha</span>
            <span>Evento</span>
            <span>Tipo</span>
            <span>Zona</span>
            <span>Fuente</span>
            <span className="text-right">Acciones</span>
          </div>

          {filteredScoutEvents.map((event) => (
            <div
              key={event.id}
              className="grid gap-3 border-b border-white/5 px-4 py-3 last:border-b-0 xl:grid-cols-[92px_minmax(220px,1.4fr)_120px_130px_minmax(150px,1fr)_auto] xl:items-center"
            >
              <div className="text-sm font-semibold text-slate-300">
                {event.date ? new Date(event.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }) : 'Sin fecha'}
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-semibold">{event.title}</p>
                  <span className="rounded-full bg-brand-500/15 px-2 py-0.5 text-[11px] font-semibold text-brand-200">Scout</span>
                </div>
                <p className="mt-0.5 truncate text-xs text-slate-500">{event.venue || "Sala por revisar"}</p>
              </div>

              <p className="text-sm text-slate-400">{event.type || "Tardeo"}</p>
              <p className="text-sm text-slate-400">{event.area || "Madrid"}</p>

              <div className="min-w-0 text-sm text-slate-400">
                <p className="truncate">{event.source_name || "No indicada"}</p>
                {event.source_url && (
                  <a href={event.source_url} target="_blank" rel="noreferrer" className="text-xs text-brand-500 hover:text-brand-400">
                    Fuente
                  </a>
                )}
              </div>

              <div className="flex flex-wrap gap-2 xl:justify-end">
                {event.slug && (
                  <Link href={`/eventos/${event.slug}?from=admin`} className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-brand-500/60">
                    Vista
                  </Link>
                )}
                <button className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-brand-500/60" onClick={() => loadEventForEdit(event)}>
                  Editar
                </button>
                <button className="rounded-full bg-brand-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-600" onClick={() => approveScoutEvent(event.id)}>
                  Aprobar
                </button>
                <button className="rounded-full px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-red-300" onClick={() => discardScoutEvent(event.id)}>
                  Descartar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-12">
        <h2 className="mb-4 text-2xl font-bold">Reclamaciones de eventos</h2>

        {eventClaims.length === 0 && (
          <p className="text-slate-400">No hay reclamaciones pendientes</p>
        )}

        <div className="space-y-4">
          {eventClaims.map((claim) => (
            <div key={claim.id} className="rounded-2xl border border-white/10 bg-slate-900/80 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-500">
                    Solicitud pendiente
                  </p>
                  <h3 className="mt-2 text-xl font-bold">
                    {claim.events?.title || 'Evento sin titulo'}
                  </h3>
                  <p className="mt-1 text-sm text-slate-400">
                    {[claim.events?.venue, claim.events?.date ? new Date(claim.events.date).toLocaleDateString('es-ES') : null].filter(Boolean).join(' - ')}
                  </p>
                  <div className="mt-4 grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
                    <p><span className="text-slate-500">Contacto:</span> {claim.contact_name}</p>
                    <p><span className="text-slate-500">Empresa:</span> {claim.company}</p>
                    <p><span className="text-slate-500">Email:</span> {claim.email}</p>
                    <p><span className="text-slate-500">Telefono:</span> {claim.phone || 'No indicado'}</p>
                    <p className="sm:col-span-2"><span className="text-slate-500">Web/Instagram:</span> {claim.website || 'No indicado'}</p>
                    {claim.message && (
                      <p className="sm:col-span-2"><span className="text-slate-500">Mensaje:</span> {claim.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  {claim.events?.slug && (
                    <Link href={`/eventos/${claim.events.slug}?from=admin`} className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-brand-500/60">
                      Ver evento
                    </Link>
                  )}
                  <button className="rounded-full bg-brand-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-600" onClick={() => approveClaim(claim)}>
                    Aprobar
                  </button>
                  <button className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-brand-500/60" onClick={() => rejectClaim(claim.id)}>
                    Rechazar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-12">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-bold">Eventos</h2>

          <div className="flex rounded-full border border-white/10 bg-slate-900/80 p-1 text-sm">
            <button
              type="button"
              onClick={() => setEventListTab('created')}
              className={`rounded-full px-4 py-2 font-semibold transition ${eventListTab === 'created' ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Eventos creados ({createdEvents.length})
            </button>
            <button
              type="button"
              onClick={() => setEventListTab('past')}
              className={`rounded-full px-4 py-2 font-semibold transition ${eventListTab === 'past' ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Eventos pasados ({pastEvents.length})
            </button>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {eventTypes.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setEventTypeFilter(option)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${eventTypeFilter === option ? 'bg-brand-500 text-white' : 'bg-white/10 text-slate-300 hover:bg-white/15'}`}
            >
              {option}
            </button>
          ))}
        </div>

        {visibleEvents.length === 0 && (
          <p className="text-slate-400">
            {eventListTab === 'past' ? 'No hay eventos pasados' : 'No hay eventos publicados activos'}
          </p>
        )}

        <div className="space-y-3">
          {visibleEvents.map((event) => (
            <div
              key={event.id}
              className="flex flex-col gap-3 rounded-xl border border-white/10 bg-slate-800/80 px-4 py-3 lg:flex-row lg:items-center lg:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold lg:truncate">{event.title}</p>
                  <span className={`rounded-full px-3 py-1 text-xs ${eventListTab === 'past' ? 'bg-slate-500/20 text-slate-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                    {eventListTab === 'past' ? 'Pasado' : 'Publicado'}
                  </span>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300">{event.type || 'Tardeo'}</span>
                  {event.source_url && (
                    <span className="rounded-full bg-sky-500/15 px-3 py-1 text-xs text-sky-200">Entradas</span>
                  )}
                  {event.promotion_package_name && (
                    <span className="rounded-full bg-brand-500/20 px-3 py-1 text-xs font-semibold text-brand-200">
                      Promo: {event.promotion_package_name}
                    </span>
                  )}
                </div>

                <p className="mt-1 text-sm text-slate-400">
                  {[new Date(event.date).toLocaleDateString('es-ES'), event.venue, event.address].filter(Boolean).join(' - ')}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {[event.audience ? `Edad: ${event.audience}` : null, event.music?.length ? event.music.join(' - ') : null].filter(Boolean).join(' - ')}
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
                {event.source_url && (
                  <a
                    href={event.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-brand-500/60"
                  >
                    Tiquetera
                  </a>
                )}

                {event.maps_url && (
                  <a
                    href={event.maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-brand-500/60"
                  >
                    Maps
                  </a>
                )}

                <Link href={`/eventos/${event.slug}?from=admin`} className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-brand-500/60">
                  Vista previa
                </Link>

                <button className="rounded-full bg-brand-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-600" onClick={() => loadEventForEdit(event)}>
                  Editar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-12">
        <h2 className="mb-4 text-2xl font-bold">Eventos pendientes</h2>

        {pendingEvents.length === 0 && (
          <p className="text-slate-400">No hay eventos pendientes</p>
        )}

        <div className="space-y-3">
          {pendingEvents.map((event) => (
            <div
              key={event.id}
              className="flex flex-col gap-3 rounded-xl border border-yellow-500/20 bg-yellow-900/20 px-4 py-3 lg:flex-row lg:items-center lg:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold lg:truncate">{event.title}</p>
                  <span className="rounded-full bg-yellow-500/20 px-3 py-1 text-xs text-yellow-300">
                    Pendiente
                  </span>
                  {event.promotion_package_name && (
                    <span className="rounded-full bg-brand-500/20 px-3 py-1 text-xs font-semibold text-brand-200">
                      Promo: {event.promotion_package_name}
                    </span>
                  )}
                </div>

                <p className="mt-1 text-sm text-slate-400">
                  {[new Date(event.date).toLocaleDateString('es-ES'), event.venue, event.address].filter(Boolean).join(' - ')}
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
                {event.maps_url && (
                  <a
                    href={event.maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-brand-500/60"
                  >
                    Maps
                  </a>
                )}

                <Link href={`/eventos/${event.slug}?from=admin`} className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-brand-500/60">
                  Vista previa
                </Link>

                <button className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-brand-500/60" onClick={() => loadEventForEdit(event)}>
                  Editar
                </button>

                <button className="rounded-full bg-brand-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-600" onClick={() => approveEvent(event.id)}>
                  Aprobar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
