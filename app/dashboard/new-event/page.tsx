'use client'

import { useState } from 'react'
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

export default function NewEventPage() {
  const [title, setTitle] = useState('')
  const [venue, setVenue] = useState('')
  const [area, setArea] = useState('')
  const [customArea, setCustomArea] = useState('')
  const [date, setDate] = useState('')
  const [type, setType] = useState('')
  const [address, setAddress] = useState('')
  const [startTime, setStartTime] = useState('17:00')
  const [endTime, setEndTime] = useState('23:00')
  const [priceFrom, setPriceFrom] = useState('')
  const [music, setMusic] = useState('')
  const [cover, setCover] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [message, setMessage] = useState('')
  const [description, setDescription] = useState('')
  const [perks, setPerks] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
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
        setLoading(false)
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
      status: 'pending',
      published: false,
      user_id: user.id,
    }

    const { error } = await supabase.from('events').insert(eventData)

    if (error) {
      setMessage(`Error al crear evento: ${error.message}`)
      setLoading(false)
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
    setStartTime('17:00')
    setEndTime('23:00')
    setPriceFrom('')
    setMusic('')
    setCover(null)
    setPreviewUrl('')
    setDescription('')
    setPerks('')
    setLoading(false)
  }

  return (
    <main className="container-page py-16">
      <Link href="/dashboard" className="btn-secondary mb-8 inline-flex">
        ← Volver al panel
      </Link>

      <h1 className="text-4xl font-bold">Crear evento</h1>
      <p className="mt-3 text-slate-400">
        Envía un evento para que el equipo de Tardea lo revise antes de publicarlo.
      </p>

      <form onSubmit={handleSubmit} className="card mt-8 max-w-2xl space-y-6 p-6">
        <input
          className="input"
          placeholder="Nombre del evento"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

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
          <input
            className="input"
            placeholder="Zona personalizada"
            value={customArea}
            onChange={(e) => setCustomArea(e.target.value)}
            required
          />
        )}

        <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} required />
        <input type="time" className="input" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
        <input type="time" className="input" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />

        <input className="input" placeholder="Precio (€)" value={priceFrom} onChange={(e) => setPriceFrom(e.target.value)} />
        <input className="input" placeholder="Lugar" value={venue} onChange={(e) => setVenue(e.target.value)} required />
        <input className="input" placeholder="Dirección" value={address} onChange={(e) => setAddress(e.target.value)} required />

        <textarea
          className="input min-h-32"
          placeholder="Descripción"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />

        <input
          className="input"
          placeholder="Extras separados por comas"
          value={perks}
          onChange={(e) => setPerks(e.target.value)}
        />

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
          <img
            src={previewUrl}
            alt="Preview del evento"
            className="h-56 w-full rounded-xl object-cover"
          />
        )}

        <button className="btn-primary w-full" type="submit" disabled={loading}>
          {loading ? 'Enviando...' : 'Enviar evento a revisión'}
        </button>

        {message && <p className="text-sm text-brand-500">{message}</p>}
      </form>
    </main>
  )
}
