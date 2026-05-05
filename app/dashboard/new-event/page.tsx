'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

export default function NewEventPage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const [form, setForm] = useState({
    title: '',
    venue: '',
    area: '',
    address: '',
    date: '',
    start_time: '',
    end_time: '',
    type: '',
    audience: '',
    price_from: '',
    cover: '',
    description: '',
    music: '',
    perks: '',
  })

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

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

    const slug = `${slugify(form.title)}-${Date.now()}`

    const { error } = await supabase.from('events').insert({
      title: form.title,
      slug,
      venue: form.venue,
      area: form.area,
      address: form.address,
      date: form.date,
      start_time: form.start_time,
      end_time: form.end_time,
      type: form.type,
      audience: form.audience,
      price_from: Number(form.price_from || 0),
      cover: form.cover,
      description: form.description,
      music: form.music
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      perks: form.perks
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      status: 'pending',
      user_id: user.id,
    })

    if (error) {
      setMessage(`Error: ${error.message}`)
    } else {
      setMessage('Evento enviado para revisión')
      setForm({
        title: '',
        venue: '',
        area: '',
        address: '',
        date: '',
        start_time: '',
        end_time: '',
        type: '',
        audience: '',
        price_from: '',
        cover: '',
        description: '',
        music: '',
        perks: '',
      })
    }

    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="container-page py-10">
        <a href="/dashboard" className="text-sm text-slate-400 hover:text-white">
          ← Volver al panel
        </a>

        <section className="card mt-8 max-w-3xl p-6 md:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-500">
            Tardea Partners
          </p>

          <h1 className="mt-2 text-4xl font-bold">Crear evento</h1>

          <p className="mt-3 text-slate-400">
            Completa los datos del evento. Se enviará como pendiente para revisión.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <input
              className="input"
              placeholder="Título del evento"
              value={form.title}
              onChange={(e) => updateField('title', e.target.value)}
              required
            />

            <input
              className="input"
              placeholder="Lugar / sala"
              value={form.venue}
              onChange={(e) => updateField('venue', e.target.value)}
              required
            />

            <input
              className="input"
              placeholder="Zona / ciudad"
              value={form.area}
              onChange={(e) => updateField('area', e.target.value)}
              required
            />

            <input
              className="input"
              placeholder="Dirección"
              value={form.address}
              onChange={(e) => updateField('address', e.target.value)}
              required
            />

            <div className="grid gap-4 md:grid-cols-3">
              <input
                className="input"
                type="date"
                value={form.date}
                onChange={(e) => updateField('date', e.target.value)}
                required
              />

              <input
                className="input"
                type="time"
                value={form.start_time}
                onChange={(e) => updateField('start_time', e.target.value)}
                required
              />

              <input
                className="input"
                type="time"
                value={form.end_time}
                onChange={(e) => updateField('end_time', e.target.value)}
                required
              />
            </div>

            <input
              className="input"
              placeholder="Tipo de evento"
              value={form.type}
              onChange={(e) => updateField('type', e.target.value)}
              required
            />

            <input
              className="input"
              placeholder="Público recomendado"
              value={form.audience}
              onChange={(e) => updateField('audience', e.target.value)}
            />

            <input
              className="input"
              type="number"
              placeholder="Precio desde (€)"
              value={form.price_from}
              onChange={(e) => updateField('price_from', e.target.value)}
            />

            <input
              className="input"
              placeholder="URL de imagen de portada"
              value={form.cover}
              onChange={(e) => updateField('cover', e.target.value)}
            />

            <textarea
              className="input min-h-32"
              placeholder="Descripción"
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              required
            />

            <input
              className="input"
              placeholder="Música, separada por comas"
              value={form.music}
              onChange={(e) => updateField('music', e.target.value)}
            />

            <input
              className="input"
              placeholder="Extras / perks, separados por comas"
              value={form.perks}
              onChange={(e) => updateField('perks', e.target.value)}
            />

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Enviando...' : 'Enviar evento a revisión'}
            </button>

            {message && <p className="text-sm text-slate-400">{message}</p>}
          </form>
        </section>
      </div>
    </main>
  )
}
