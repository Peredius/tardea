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
const EVENT_TYPE_OPTIONS = ['Tardeo', 'Rooftop', 'Brunch', 'Afterwork', 'Fitness Party']

type BulkEventRow = {
  id: string
  active: boolean
  title: string
  type: string
  music: string
  audience: string
  venue: string
  area: string
  date: string
  startTime: string
  endTime: string
  priceFrom: string
  ticketUrl: string
  mapsUrl: string
  description: string
}

function createBulkRow(values: Partial<BulkEventRow> = {}): BulkEventRow {
  const { id: _id, ...rowValues } = values

  return {
    id: Date.now().toString() + '-' + Math.random().toString(16).slice(2),
    active: true,
    title: '',
    type: 'Tardeo',
    music: 'Comercial',
    audience: 'Mixto',
    venue: '',
    area: 'Madrid',
    date: '',
    startTime: '18:00',
    endTime: '23:00',
    priceFrom: '0',
    ticketUrl: '',
    mapsUrl: '',
    description: '',
    ...rowValues,
  }
}

function scoutCoverFor(type: string, music: string) {
  if (music === 'Electronica') return '/scout-covers/electronica.svg'
  if (music === 'Flamenquito') return '/scout-covers/flamenquito.svg'
  if (type === 'Brunch') return '/scout-covers/brunch.svg'
  if (type === 'Rooftop') return '/scout-covers/rooftop.svg'
  return '/scout-covers/tardeo.svg'
}

export default function AdminPage() {
  const formRef = useRef<HTMLFormElement | null>(null)
  const bulkSectionRef = useRef<HTMLElement | null>(null)
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
  const [selectedScoutEventIds, setSelectedScoutEventIds] = useState<string[]>([])
  const [eventTypeFilter, setEventTypeFilter] = useState('Todos')
  const [editingEvent, setEditingEvent] = useState<any | null>(null)
  const [bulkRows, setBulkRows] = useState<BulkEventRow[]>([createBulkRow()])
  const [bulkDuplicateRowId, setBulkDuplicateRowId] = useState('')
  const [bulkDuplicateDate, setBulkDuplicateDate] = useState('')
  const [bulkDuplicateDates, setBulkDuplicateDates] = useState<string[]>([])
  const [bulkExtractingRowId, setBulkExtractingRowId] = useState('')

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

  function scoutEventToBulkRow(event: any) {
    return createBulkRow({
      title: event.title || '',
      type: event.type || 'Tardeo',
      music: Array.isArray(event.music) ? event.music.join(', ') : event.music || 'Comercial',
      audience: event.audience || 'Mixto',
      venue: event.venue || '',
      area: event.area || 'Madrid',
      date: event.date || '',
      startTime: event.start_time || '18:00',
      endTime: event.end_time || '23:00',
      priceFrom: event.price_from?.toString() || '0',
      ticketUrl: event.source_url || '',
      mapsUrl: event.maps_url || '',
      description: event.description || '',
    })
  }

  function toggleScoutSelection(eventId: string) {
    setSelectedScoutEventIds((current) =>
      current.includes(eventId)
        ? current.filter((item) => item !== eventId)
        : [...current, eventId]
    )
  }

  function addScoutEventsToBulkRows(eventsToAdd: any[]) {
    if (eventsToAdd.length === 0) {
      setMessage('Selecciona al menos un evento encontrado')
      return
    }

    const rows = eventsToAdd.map(scoutEventToBulkRow)
    setBulkRows((current) => {
      const emptyInitialRow = current.length === 1 && !current[0].title && !current[0].ticketUrl
      return emptyInitialRow ? rows : [...current, ...rows]
    })
    setSelectedScoutEventIds([])
    setMessage(`${rows.length} evento${rows.length === 1 ? '' : 's'} pasado${rows.length === 1 ? '' : 's'} a la tabla editorial para revisar y duplicar fechas.`)
    window.setTimeout(() => {
      bulkSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  function addSelectedScoutEventsToBulkRows() {
    addScoutEventsToBulkRows(scoutEvents.filter((event) => selectedScoutEventIds.includes(event.id)))
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
  function updateBulkRow(rowId: string, field: keyof BulkEventRow, value: string | boolean) {
    setBulkRows((rows) =>
      rows.map((row) => row.id === rowId ? { ...row, [field]: value } : row)
    )
  }

  function addBulkRow() {
    setBulkRows((rows) => [...rows, createBulkRow()])
  }

  function removeBulkRow(rowId: string) {
    setBulkRows((rows) => rows.length === 1 ? [createBulkRow()] : rows.filter((row) => row.id !== rowId))
  }

  function pasteBulkRows(text: string) {
    const rows = text
      .trim()
      .split(/\r?\n/)
      .map((line) => line.split('\t'))
      .filter((cells) => cells.some(Boolean))
      .map((cells) => createBulkRow({
        title: cells[0] || '',
        type: cells[1] || 'Tardeo',
        music: cells[2] || 'Comercial',
        audience: cells[3] || 'Mixto',
        venue: cells[4] || '',
        area: cells[5] || 'Madrid',
        date: cells[6] || '',
        startTime: cells[7] || '18:00',
        endTime: cells[8] || '23:00',
        priceFrom: cells[9] || '0',
        ticketUrl: cells[10] || '',
        mapsUrl: cells[11] || '',
        description: cells[12] || '',
      }))

    if (rows.length) setBulkRows(rows)
  }

  function addDuplicateDate() {
    if (!bulkDuplicateDate || bulkDuplicateDates.includes(bulkDuplicateDate)) return
    setBulkDuplicateDates((dates) => [...dates, bulkDuplicateDate].sort())
    setBulkDuplicateDate('')
  }

  function duplicateBulkRowOnDates() {
    const source = bulkRows.find((row) => row.id === bulkDuplicateRowId) || bulkRows[0]
    if (!source || bulkDuplicateDates.length === 0) return

    const duplicates = bulkDuplicateDates.map((dateValue) => createBulkRow({ ...source, date: dateValue }))
    setBulkRows((rows) => [...rows, ...duplicates])
    setBulkDuplicateDates([])
  }

  async function extractBulkRowFromUrl(rowId: string) {
    const row = bulkRows.find((item) => item.id === rowId)

    if (!row?.ticketUrl) {
      setMessage('Pega primero un enlace en la fila')
      return
    }

    setBulkExtractingRowId(rowId)

    try {
      const response = await fetch('/api/scout/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: row.ticketUrl }),
      })
      const data = await response.json()

      if (!response.ok) {
        setMessage(data.error || 'No se pudo extraer informacion del enlace')
        return
      }

      setBulkRows((rows) =>
        rows.map((item) =>
          item.id === rowId
            ? {
                ...item,
                title: data.title || item.title,
                description: data.description || item.description,
                date: data.date || item.date,
                startTime: data.startTime || item.startTime,
                endTime: data.endTime || item.endTime,
                type: data.type || item.type,
                music: data.music || item.music,
                venue: data.venue || item.venue,
                area: data.area || item.area,
                priceFrom: data.priceFrom || item.priceFrom,
                mapsUrl: data.mapsUrl || item.mapsUrl,
              }
            : item
        )
      )

      setMessage(
        data.confidence === 'low'
          ? `He leido ${data.sourceName || 'la fuente'}, pero esa pagina da pocos datos. Revisa y completa la fila antes de crear el evento.`
          : `Informacion extraida de ${data.sourceName || 'la fuente'}. Revisala antes de crear el evento.`
      )
    } catch {
      setMessage('No se pudo extraer informacion del enlace')
    } finally {
      setBulkExtractingRowId('')
    }
  }

  async function createBulkEvents() {
    const validRows = bulkRows.filter((row) => row.active && row.title && row.date)

    if (validRows.length === 0) {
      setMessage('No hay filas activas con evento y fecha')
      return
    }

    const rowsToInsert = validRows.map((row) => {
      const musicList = row.music
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)

      return {
        title: row.title,
        slug: generateSlug(row.title, row.date),
        venue: row.venue || 'Pendiente de revisar',
        area: row.area || 'Madrid',
        address: row.venue || row.area || 'Madrid',
        maps_url: row.mapsUrl || null,
        date: row.date,
        start_time: row.startTime || '18:00',
        end_time: row.endTime || '23:00',
        type: row.type || 'Tardeo',
        music: musicList.length ? musicList : ['Comercial'],
        audience: row.audience || 'Mixto',
        price_from: row.priceFrom ? Number(row.priceFrom) : 0,
        cover: scoutCoverFor(row.type, musicList[0] || row.music),
        reel_url: null,
        featured: false,
        description: row.description || 'Evento cargado desde la tabla editorial de TARDEA. Pendiente de revision antes de publicar.',
        perks: [row.type, row.area, ...(musicList.length ? musicList : [row.music])].filter(Boolean),
        status: 'pending',
        published: false,
        source_name: 'Carga admin',
        source_url: row.ticketUrl || null,
        external_id: row.ticketUrl || row.title + '-' + row.date,
        imported_by_agent: true,
        image_status: 'provisional',
        needs_review: true,
      }
    })

    const { error } = await supabase.from('events').upsert(rowsToInsert, { onConflict: 'slug' })

    if (error) {
      setMessage(`Error al crear eventos desde tabla: ${error.message}`)
      return
    }

    setMessage(`${rowsToInsert.length} eventos enviados a revision`)
    setBulkRows([createBulkRow()])
    fetchEvents()
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

      <section ref={bulkSectionRef} className="mt-12 rounded-3xl border border-white/10 bg-slate-900/70 p-5">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-500">Carga rapida tipo Excel</p>
            <h2 className="text-2xl font-bold">Listado editorial de eventos</h2>
            <p className="mt-2 text-sm text-slate-400">Pega un enlace, extrae la informacion, revisa los datos, duplica por fechas y mandalo a revision. Solo se crean las filas activas.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={addBulkRow} className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-brand-500/60">Anadir fila</button>
            <button type="button" onClick={createBulkEvents} className="rounded-full bg-brand-500 px-4 py-2 text-sm font-bold text-white hover:bg-brand-600">Crear en revision</button>
          </div>
        </div>

        <textarea
          className="input mb-4 min-h-20 text-sm"
          placeholder="Pega aqui desde Excel/Sheets o rellena una fila con un enlace y pulsa Extraer: evento, tipo, musica, edad, sala, zona, fecha, inicio, fin, precio, link entradas, maps, descripcion"
          onPaste={(event) => {
            const text = event.clipboardData.getData('text')
            if (text.includes('\t')) {
              event.preventDefault()
              pasteBulkRows(text)
            }
          }}
        />

        <div className="mb-4 rounded-2xl border border-white/10 bg-slate-950/50 p-4">
          <p className="mb-3 text-sm font-semibold text-slate-300">Duplicar evento por varios dias</p>
          <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto] lg:items-center">
            <select className="select" value={bulkDuplicateRowId} onChange={(event) => setBulkDuplicateRowId(event.target.value)}>
              <option value="">Selecciona evento de la tabla</option>
              {bulkRows.map((row) => (
                <option key={row.id} value={row.id}>{row.title || 'Fila sin titulo'} {row.date ? `- ${row.date}` : ''}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <input type="date" className="input" value={bulkDuplicateDate} onChange={(event) => setBulkDuplicateDate(event.target.value)} />
              <button type="button" onClick={addDuplicateDate} className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-brand-500/60">Anadir fecha</button>
            </div>
            <button type="button" onClick={duplicateBulkRowOnDates} className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/15">Duplicar</button>
          </div>
          {bulkDuplicateDates.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {bulkDuplicateDates.map((dateValue) => (
                <button key={dateValue} type="button" onClick={() => setBulkDuplicateDates((dates) => dates.filter((item) => item !== dateValue))} className="rounded-full bg-brand-500/20 px-3 py-1 text-xs font-semibold text-brand-100">
                  {new Date(dateValue).toLocaleDateString('es-ES')} x
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[1420px] border-collapse text-left text-sm">
            <thead className="bg-slate-950/70 text-xs uppercase tracking-[0.12em] text-slate-500">
              <tr>
                <th className="px-3 py-3">Activo</th>
                <th className="px-3 py-3">Evento</th>
                <th className="px-3 py-3">Tipo</th>
                <th className="px-3 py-3">Musica</th>
                <th className="px-3 py-3">Edad</th>
                <th className="px-3 py-3">Sala</th>
                <th className="px-3 py-3">Ubicacion</th>
                <th className="px-3 py-3">Fecha</th>
                <th className="px-3 py-3">Horario</th>
                <th className="px-3 py-3">Precio</th>
                <th className="px-3 py-3">Enlace</th>
                <th className="px-3 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {bulkRows.map((row) => (
                <tr key={row.id} className="border-t border-white/5 align-top">
                  <td className="px-3 py-2"><input type="checkbox" checked={row.active} onChange={(event) => updateBulkRow(row.id, 'active', event.target.checked)} /></td>
                  <td className="px-3 py-2"><input className="w-56 rounded-lg bg-slate-950 px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-brand-500" value={row.title} onChange={(event) => updateBulkRow(row.id, 'title', event.target.value)} placeholder="Nombre" /></td>
                  <td className="px-3 py-2"><select className="w-36 rounded-lg bg-slate-950 px-3 py-2 outline-none ring-1 ring-white/10" value={row.type} onChange={(event) => updateBulkRow(row.id, 'type', event.target.value)}>{EVENT_TYPE_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select></td>
                  <td className="px-3 py-2"><input className="w-44 rounded-lg bg-slate-950 px-3 py-2 outline-none ring-1 ring-white/10" value={row.music} onChange={(event) => updateBulkRow(row.id, 'music', event.target.value)} placeholder="Comercial, Pop" /></td>
                  <td className="px-3 py-2"><select className="w-32 rounded-lg bg-slate-950 px-3 py-2 outline-none ring-1 ring-white/10" value={row.audience} onChange={(event) => updateBulkRow(row.id, 'audience', event.target.value)}>{['Mixto', ...AUDIENCE_OPTIONS].map((option) => <option key={option}>{option}</option>)}</select></td>
                  <td className="px-3 py-2"><input className="w-44 rounded-lg bg-slate-950 px-3 py-2 outline-none ring-1 ring-white/10" value={row.venue} onChange={(event) => updateBulkRow(row.id, 'venue', event.target.value)} placeholder="Sala" /></td>
                  <td className="px-3 py-2"><input className="w-40 rounded-lg bg-slate-950 px-3 py-2 outline-none ring-1 ring-white/10" value={row.area} onChange={(event) => updateBulkRow(row.id, 'area', event.target.value)} placeholder="Zona" /></td>
                  <td className="px-3 py-2"><input type="date" className="w-40 rounded-lg bg-slate-950 px-3 py-2 outline-none ring-1 ring-white/10" value={row.date} onChange={(event) => updateBulkRow(row.id, 'date', event.target.value)} /></td>
                  <td className="px-3 py-2"><div className="flex gap-2"><input type="time" className="w-28 rounded-lg bg-slate-950 px-3 py-2 outline-none ring-1 ring-white/10" value={row.startTime} onChange={(event) => updateBulkRow(row.id, 'startTime', event.target.value)} /><input type="time" className="w-28 rounded-lg bg-slate-950 px-3 py-2 outline-none ring-1 ring-white/10" value={row.endTime} onChange={(event) => updateBulkRow(row.id, 'endTime', event.target.value)} /></div></td>
                  <td className="px-3 py-2"><input className="w-24 rounded-lg bg-slate-950 px-3 py-2 outline-none ring-1 ring-white/10" value={row.priceFrom} onChange={(event) => updateBulkRow(row.id, 'priceFrom', event.target.value)} /></td>
                  <td className="px-3 py-2"><input className="w-64 rounded-lg bg-slate-950 px-3 py-2 outline-none ring-1 ring-white/10" value={row.ticketUrl} onChange={(event) => updateBulkRow(row.id, 'ticketUrl', event.target.value)} placeholder="Tiquetera" /></td>
                  <td className="px-3 py-2">
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => extractBulkRowFromUrl(row.id)}
                        disabled={bulkExtractingRowId === row.id}
                        className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-brand-500/60 disabled:cursor-wait disabled:opacity-60"
                      >
                        {bulkExtractingRowId === row.id ? 'Leyendo...' : 'Extraer'}
                      </button>
                      <button type="button" onClick={() => removeBulkRow(row.id)} className="text-xs font-semibold text-slate-500 hover:text-red-300">Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <div className="mt-12">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-500">TARDEA Scout</p>
            <h2 className="text-2xl font-bold">Eventos encontrados para revisar</h2>
          </div>
          <p className="text-sm text-slate-400">Se publican solo despues de revisar datos, imagen y fuente.</p>
        </div>

        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
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

          {selectedScoutEventIds.length > 0 && (
            <button
              type="button"
              onClick={addSelectedScoutEventsToBulkRows}
              className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/15"
            >
              Pasar {selectedScoutEventIds.length} a tabla
            </button>
          )}
        </div>

        {filteredScoutEvents.length === 0 && (
          <p className="text-slate-400">No hay eventos encontrados para este filtro</p>
        )}

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70">
          <div className="hidden grid-cols-[34px_92px_minmax(220px,1.4fr)_120px_130px_minmax(150px,1fr)_auto] gap-3 border-b border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 xl:grid">
            <span></span>
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
              className="grid gap-3 border-b border-white/5 px-4 py-3 last:border-b-0 xl:grid-cols-[34px_92px_minmax(220px,1.4fr)_120px_130px_minmax(150px,1fr)_auto] xl:items-center"
            >
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedScoutEventIds.includes(event.id)}
                  onChange={() => toggleScoutSelection(event.id)}
                />
              </label>

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
                <button className="rounded-full border border-brand-500/40 px-3 py-1.5 text-xs font-semibold text-brand-100 hover:bg-brand-500/10" onClick={() => addScoutEventsToBulkRows([event])}>
                  A tabla
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
