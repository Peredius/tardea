'use client'

import { useEffect, useState } from 'react'
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

export default function DashboardPage() {
  const [email, setEmail] = useState<string | null>(null)
  const [events, setEvents] = useState<any[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

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
  const [isInvitation, setIsInvitation] = useState(false)
  const [music, setMusic] = useState('')
  const [cover, setCover] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [description, setDescription] = useState('')
  const [perks, setPerks] = useState('')

  useEffect(() => {
    async function loadDashboard() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        window.location.href = '/login'
        return
      }

      setEmail(user.email ?? null)
      setUserId(user.id)

      const { data } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true })

      setEvents(data || [])
      setLoading(false)
    }

    loadDashboard()
  }, [])

  async function refreshEvents() {
    if (!userId) return

    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true })

    setEvents(data || [])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      window.location.href = '/login'
      return
    }

    let imageUrl = ''

    if (cover) {
      const fileName = `${Date.now()}-${cover.name}`

      const { error: uploadError } = await supabase.storage
        .from('events')
        .upload(fileName, cover)

      if (uploadError) {
        setMessage(`Error subiendo imagen: ${uploadError.message}`)
        setSaving(false)
        return
      }

      const { data } = supabase.storage.from('events').getPublicUrl(fileName)
      imageUrl = data.publicUrl
    }

    const eventData = {
      title,
      slug: generateSlug(title, date),
      venue,
      area: area === 'Otra' ? customArea || null : area || null,
      address: address || null,
      maps_url: mapsUrl || null,
      date,
      start_time: startTime,
      end_time: endTime,
      type,
      music: music ? [music] : [],
      audience: '25-35',
      price_from: isInvitation ? 0 : priceFrom ? parseFloat(priceFrom) : 0,
      cover: imageUrl,
      featured: false,
      description,
      perks: perks ? perks.split(',').map((p) => p.trim()) : [],
      status: 'pending',
      published: false,
      user_id: user.id,
    }

    const { error } = await supabase.from('events').insert(eventData)

    if (error) {
      setMessage(`Error al crear evento: ${error.message}`)
      setSaving(false)
      return
    }

    setMessage('Evento enviado correctamente. Queda pendiente de revisión.')

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
    setIsInvitation(false)
    setMusic('')
    setCover(null)
    setPreviewUrl('')
    setDescription('')
    setPerks('')

    await refreshEvents()
    setSaving(false)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="container-page py-10">
          <p className="text-slate-400">Cargando panel...</p>
        </div>
      </main>
    )
  }

  const approvedEvents = events.filter((event) => event.status === 'approved')
  const pendingEvents = events.filter((event) => event.status === 'pending')

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="container-page py-10">
        <section className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-500">
            Tardea Partners
          </p>

          <h1 className="mt-2 text-4xl font-bold tracking-tight md:text-5xl">
            Panel de sala
          </h1>

          <p className="mt-3 max-w-2xl text-slate-400">
            Crea eventos, revisa su estado y gestiona tus propuestas.
          </p>
        </section>

        <section className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="card p-6">
            <p className="text-sm text-slate-400">Usuario conectado</p>
            <p className="mt-2 break-all font-semibold">{email}</p>
          </div>

          <div className="card p-6">
            <p className="text-sm text-slate-400">Eventos publicados</p>
            <p className="mt-2 text-4xl font-bold">{approvedEvents.length}</p>
          </div>

          <div className="card p-6">
            <p className="text-sm text-slate-400">Eventos pendientes</p>
            <p className="mt-2 text-4xl font-bold">{pendingEvents.length}</p>
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <form onSubmit={handleSubmit} className="card space-y-6 p-6">
            <div>
              <h2 className="text-2xl font-bold">Crear evento</h2>
              <p className="mt-2 text-sm text-slate-400">
                El evento se enviará como pendiente para revisión.
              </p>
            </div>

            <input className="input" placeholder="Nombre del evento" value={title} onChange={(e) => setTitle(e.target.value)} required />

            <select className="select" value={type} onChange={(e) => setType(e.target.value)} required>
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

            <select className="select" value={area} onChange={(e) => setArea(e.target.value)} required>
              <option value="">Zona</option>
              <option>Centro</option>
              <option>Salamanca</option>
              <option>Retiro</option>
              <option value="Otra">Otra</option>
            </select>

            {area === 'Otra' && (
              <input className="input" placeholder="Zona personalizada" value={customArea} onChange={(e) => setCustomArea(e.target.value)} required />
            )}

            <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} required />
            <input type="time" className="input" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
            <input type="time" className="input" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />

            <div className="space-y-3">
              <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-slate-100">
                <input
                  type="checkbox"
                  checked={isInvitation}
                  onChange={(e) => {
                    setIsInvitation(e.target.checked)
                    if (e.target.checked) setPriceFrom('')
                  }}
                />
                Entrada con invitación
              </label>

              {!isInvitation && (
                <input
                  className="input"
                  type="number"
                  min="0"
                  placeholder="Precio desde (€)"
                  value={priceFrom}
                  onChange={(e) => setPriceFrom(e.target.value)}
                />
              )}
            </div>

            <input className="input" placeholder="Lugar" value={venue} onChange={(e) => setVenue(e.target.value)} required />
            <input className="input" placeholder="Dirección" value={address} onChange={(e) => setAddress(e.target.value)} required />
            <input className="input" placeholder="Link de Google Maps" value={mapsUrl} onChange={(e) => setMapsUrl(e.target.value)} />

            <textarea className="input min-h-32" placeholder="Descripción" value={description} onChange={(e) => setDescription(e.target.value)} required />

            <input className="input" placeholder="Extras separados por comas" value={perks} onChange={(e) => setPerks(e.target.value)} />

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

            <button className="btn-primary w-full" type="submit" disabled={saving}>
              {saving ? 'Enviando...' : 'Enviar evento a revisión'}
            </button>

            {message && <p className="text-sm text-brand-500">{message}</p>}
          </form>

          <section className="card p-6">
            <h2 className="text-2xl font-bold">Mis eventos</h2>
            <p className="mt-2 text-sm text-slate-400">
              Aquí verás los eventos enviados y su estado.
            </p>

            {events.length === 0 && (
              <p className="mt-6 text-slate-400">No tienes eventos todavía.</p>
            )}

            <div className="mt-6 space-y-4">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <h3 className="font-semibold">{event.title}</h3>

                    <p className="mt-1 text-sm text-slate-400">
                      {event.date ? new Date(event.date).toLocaleDateString('es-ES') : 'Sin fecha'}
                    </p>

                    <span
                      className={`mt-2 inline-block rounded-full px-3 py-1 text-xs ${
                        event.status === 'approved'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-yellow-500/20 text-yellow-300'
                      }`}
                    >
                      {event.status === 'approved' ? 'Publicado' : 'Pendiente'}
                    </span>
                  </div>

                  <a
                    href={`/eventos/${event.slug}`}
                    className="text-sm font-medium text-brand-500 hover:underline"
                  >
                    Vista previa
                  </a>
                </div>
              ))}
            </div>
          </section>
        </section>
      </div>
    </main>
  )
}
