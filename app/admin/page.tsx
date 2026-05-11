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
  const [startTime, setStartTime] = useState('17:00')
  const [endTime, setEndTime] = useState('23:00')
  const [priceFrom, setPriceFrom] = useState('')
  const [music, setMusic] = useState('')
  const [cover, setCover] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [message, setMessage] = useState('')
  const [description, setDescription] = useState('')
  const [perks, setPerks] = useState('')
  const [events, setEvents] = useState<any[]>([])
  const [pendingEvents, setPendingEvents] = useState<any[]>([])
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
      .order('date', { ascending: true })

    if (error || pendingError) {
      console.error(error || pendingError)
      return
    }

    setEvents(data || [])
    setPendingEvents(pendingData || [])
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
      date,
      start_time: startTime,
      end_time: endTime,
      type,
      music: music ? [music] : [],
      audience: '25-35',
      price_from: priceFrom ? Number(priceFrom) : 0,
      cover: imageUrl,
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
    setStartTime('17:00')
    setEndTime('23:00')
    setPriceFrom('')
    setMusic('')
    setCover(null)
    setPreviewUrl('')
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
    setArea(event.area || '')
    setDate(event.date || '')
    setStartTime(event.start_time || '17:00')
    setEndTime(event.end_time || '23:00')
    setType(event.type || '')
    setMusic(event.music?.[0] || '')
    setPriceFrom(event.price_from?.toString() || '')
    setPreviewUrl(cleanCover || '')
    setCover(null)
    setDescription(event.description || '')
    setPerks(event.perks?.join(', ') || '')
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

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
          Cerrar sesión
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

        <select className="select" value={music} onChange={(e) => setMusic(e.target.value)}>
          <option value="">Estilo musical</option>
          <option>Indie</option>
          <option>Pop</option>
          <option>House</option>
          <option>Urbano</option>
          <option>Techno</option>
        </select>

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

        <input className="input" placeholder="Precio (€)" value={priceFrom} onChange={(e) => setPriceFrom(e.target.value)} />
        <input className="input" placeholder="Lugar" value={venue} onChange={(e) => setVenue(e.target.value)} />
        <input className="input" placeholder="Dirección" value={address} onChange={(e) => setAddress(e.target.value)} />
        <input className="input" placeholder="Link de Google Maps" value={mapsUrl} onChange={(e) => setMapsUrl(e.target.value)} />

        <textarea className="input" placeholder="Descripción" value={description} onChange={(e) => setDescription(e.target.value)} />
        <input className="input" placeholder="Extras" value={perks} onChange={(e) => setPerks(e.target.value)} />

        <input
          type="file"
          accept="image/*"
          className="input"
          onChange={(e) => {
            const file = e.target.files?.[0] || null
            setCover(file)
            setPreviewUrl(file ? URL.createObjectURL(file) : '')
          }}
        />

        {previewUrl && (
          <img src={previewUrl} alt="Preview del evento" className="h-56 w-full rounded-xl object-cover" />
        )}

        <button className="btn-primary w-full" type="submit">
          {editingEvent ? 'Guardar cambios' : 'Crear evento'}
        </button>

        {message && <p className="text-sm text-brand-500">{message}</p>}
      </form>

      <div className="mt-12">
        <h2 className="mb-4 text-2xl font-bold">Eventos creados</h2>

        {events.map((event) => (
          <div key={event.id} className="mb-3 flex justify-between rounded-xl bg-slate-800 p-4">
            <div>
              <p>{event.title}</p>

              <span className="mt-2 inline-block rounded-full bg-emerald-500/20 px-3 py-1 text-xs text-emerald-300">
                Publicado
              </span>

              <p className="text-sm text-slate-400">
                {new Date(event.date).toLocaleDateString('es-ES')}
              </p>

              {event.address && (
                <p className="mt-1 text-sm text-slate-400">{event.address}</p>
              )}

              {event.maps_url && (
                <a
                  href={event.maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-sm text-brand-500"
                >
                  Ver en Google Maps
                </a>
              )}
            </div>

            <button
              className="text-sm text-brand-500"
              onClick={() => loadEventForEdit(event)}
            >
              Editar
            </button>
          </div>
        ))}
      </div>

      <div className="mt-12">
        <h2 className="mb-4 text-2xl font-bold">Eventos pendientes</h2>

        {pendingEvents.length === 0 && (
          <p className="text-slate-400">No hay eventos pendientes</p>
        )}

        {pendingEvents.map((event) => (
          <div key={event.id} className="mb-3 flex items-center justify-between rounded-xl bg-yellow-900/30 p-4">
            <div>
              <p className="font-semibold">{event.title}</p>

              <span className="mt-2 inline-block rounded-full bg-yellow-500/20 px-3 py-1 text-xs text-yellow-300">
                Pendiente
              </span>

              <p className="text-sm text-slate-400">
                {new Date(event.date).toLocaleDateString('es-ES')}
              </p>

              {event.address && (
                <p className="mt-1 text-sm text-slate-400">{event.address}</p>
              )}

              {event.maps_url && (
                <a
                  href={event.maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-sm text-brand-500"
                >
                  Ver en Google Maps
                </a>
              )}
            </div>

            <div className="flex gap-3">
              <Link href={`/eventos/${event.slug}?from=admin`} className="btn-secondary">
                Vista previa
              </Link>

              <button
                className="text-sm text-brand-500"
                onClick={() => loadEventForEdit(event)}
              >
                Editar
              </button>

              <button className="btn-primary" onClick={() => approveEvent(event.id)}>
                Aprobar
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
