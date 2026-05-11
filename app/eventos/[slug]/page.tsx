'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  Euro,
  Heart,
  MapPin,
  Music4,
  Sparkles,
  Users,
} from 'lucide-react'
import { Footer } from '@/components/Footer'
import { Navbar } from '@/components/Navbar'
import { supabase } from '@/lib/supabase'

export default function EventDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const slug = params.slug as string
  const from = searchParams.get('from')
  const backHref = from === 'admin' ? '/admin' : from === 'dashboard' ? '/dashboard' : '/'
  const backLabel = from === 'admin' ? 'Volver al admin' : from === 'dashboard' ? 'Volver al panel' : 'Volver'

  const [event, setEvent] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [isFavorite, setIsFavorite] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    async function loadEvent() {
      const { data } = await supabase
        .from('events')
        .select('*')
        .eq('slug', slug)
        .single()

      setEvent(data)
      setLoading(false)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user || !data) return

      setUserId(user.id)

      const { data: favorite } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', user.id)
        .eq('event_id', data.id)
        .maybeSingle()

      if (favorite) setIsFavorite(true)
    }

    loadEvent()
  }, [slug])

  async function toggleFavorite() {
    if (!userId) {
      window.location.href = '/login?type=user'
      return
    }

    if (!event) return

    if (isFavorite) {
      await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('event_id', event.id)

      setIsFavorite(false)
    } else {
      await supabase.from('favorites').insert({
        user_id: userId,
        event_id: event.id,
      })

      setIsFavorite(true)
    }
  }

  if (loading) {
    return (
      <main>
        <Navbar />
        <section className="container-page py-16">
          <p className="text-slate-400">Cargando evento...</p>
        </section>
        <Footer />
      </main>
    )
  }

  if (!event) {
    return (
      <main>
        <Navbar />
        <section className="container-page py-16">
          <h1 className="text-3xl font-bold">Evento no encontrado</h1>
          <Link href={backHref} className="btn-secondary mt-6 inline-flex">
            Volver
          </Link>
        </section>
        <Footer />
      </main>
    )
  }

  return (
    <main>
      <Navbar />

      <section className="relative overflow-hidden border-b border-white/10">
        {event.cover && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-25"
            style={{ backgroundImage: `url(${event.cover})` }}
          />
        )}

        <div className="container-page relative py-16 md:py-24">
          <Link href={backHref} className="btn-secondary mb-8 inline-flex">
            <ArrowLeft className="mr-2 h-4 w-4" /> {backLabel}
          </Link>

          {event.status === 'pending' && (
            <div className="mb-4 rounded-xl bg-yellow-500/20 px-4 py-2 text-sm text-yellow-200">
              Evento pendiente de aprobación
            </div>
          )}

          <div className="max-w-3xl">
            <span className="badge mb-4">{event.type}</span>

            <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
              {event.title}
            </h1>

            <p className="mt-5 text-lg text-slate-300">
              {event.description}
            </p>

            <button
              onClick={toggleFavorite}
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-500 hover:underline"
            >
              <Heart
                className={`h-5 w-5 ${
                  isFavorite ? 'fill-brand-500' : ''
                }`}
              />
              {isFavorite ? 'Guardado en favoritos' : 'Guardar evento'}
            </button>
          </div>
        </div>
      </section>

      <section className="container-page grid gap-8 py-16 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-2xl font-semibold">Detalles del evento</h2>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <CalendarDays className="mb-2 h-5 w-5 text-brand-500" />
                <p className="font-medium">Fecha</p>
                <p className="text-sm text-slate-400">
                  {new Date(event.date).toLocaleDateString('es-ES')}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <Clock3 className="mb-2 h-5 w-5 text-brand-500" />
                <p className="font-medium">Horario</p>
                <p className="text-sm text-slate-400">
                  {event.start_time?.slice(0, 5)} - {event.end_time?.slice(0, 5)}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <MapPin className="mb-2 h-5 w-5 text-brand-500" />
                <p className="font-medium">Ubicación</p>
                <p className="text-sm text-slate-400">
                  {event.venue}, {event.address}
                </p>

                {event.maps_url && (
                  <a
                    href={event.maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block text-sm font-medium text-brand-500 hover:underline"
                  >
                    Ver en Google Maps →
                  </a>
                )}
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <Euro className="mb-2 h-5 w-5 text-brand-500" />
                <p className="font-medium">Precio</p>
                <p className="text-sm text-slate-400">
                  {event.price_from === 0
                    ? 'Entrada gratis o con invitación'
                    : `Desde ${event.price_from}€`}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <Music4 className="mb-2 h-5 w-5 text-brand-500" />
                <p className="font-medium">Música</p>
                <p className="text-sm text-slate-400">
                  {(event.music || []).join(', ')}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <Users className="mb-2 h-5 w-5 text-brand-500" />
                <p className="font-medium">Público</p>
                <p className="text-sm text-slate-400">{event.audience}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-2xl font-semibold">
              Qué hace especial este plan
            </h2>

            <div className="mt-5 flex flex-wrap gap-3">
              {(event.perks || []).map((perk: string) => (
                <span key={perk} className="badge">
                  <Sparkles className="mr-2 h-4 w-4" /> {perk}
                </span>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="card p-6">
            <h3 className="text-xl font-semibold">Reserva o compra entradas</h3>

            <p className="mt-3 text-sm text-slate-400">
              En producción, aquí conectaríamos Eventbrite, Fourvenues, Xceed o
              una URL directa del organizador.
            </p>

            <a href="#" className="btn-primary mt-6 w-full">
              Comprar entradas
            </a>

            <button
              onClick={toggleFavorite}
              className="btn-secondary mt-3 w-full"
            >
              {isFavorite ? '❤️ Guardado' : '🤍 Guardar en favoritos'}
            </button>
          </div>
        </aside>
      </section>

      <Footer />
    </main>
  )
}
