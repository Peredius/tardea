'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function NewEventPage() {
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

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

    const { error } = await supabase.from('events').insert({
      title,
      status: 'pending',
      user_id: user.id,
    })

    if (error) {
      setMessage('Error al crear evento')
    } else {
      setMessage('Evento enviado para revisión')
      setTitle('')
    }

    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="container-page py-10">
        <a href="/dashboard" className="text-sm text-slate-400 hover:text-white">
          ← Volver al panel
        </a>

        <section className="card mt-8 max-w-2xl p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-500">
            Tardea Partners
          </p>

          <h1 className="mt-2 text-4xl font-bold">Crear evento</h1>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <input
              className="input"
              type="text"
              placeholder="Título del evento"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Creando...' : 'Enviar evento a revisión'}
            </button>

            {message && <p className="text-sm text-slate-400">{message}</p>}
          </form>
        </section>
      </div>
    </main>
  )
}
