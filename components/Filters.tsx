'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Clock3, Euro, MapPin, Music4, Users } from 'lucide-react'
import {
  audienceTypes,
  eventTypes,
  events,
  musicTypes,
  priceRanges,
} from '@/lib/data'
import { supabase } from '@/lib/supabase'

function matchesPrice(range: string, price: number) {
  if (range === 'Todos') return true
  if (range === 'Gratis') return price === 0
  if (range === '0-15€') return price > 0 && price <= 15
  if (range === '15-30€') return price > 15 && price <= 30
  if (range === '30€+') return price > 30
  return true
}

export function Filters() {
  const [date, setDate] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('selectedDate') || ''
    }

    return ''
  })

  const [type, setType] = useState('Todos')
  const [music, setMusic] = useState('Todas')
  const [audience, setAudience] = useState('Todas')
  const [price, setPrice] = useState('Todos')
  const [area, setArea] = useState('Todas')
  const [dbEvents, setDbEvents] = useState(events)

  useEffect(() => {
    async function fetchEvents() {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('published', true)
        .eq('status', 'approved')
        .order('date', { ascending: true })

      if (error) {
        console.error(error)
        return
      }

      const mappedEvents = data.map((event) => ({
        slug: event.slug,
        title: event.title,
        venue: event.venue,
        area: event.area,
        address: event.address,
        date: event.date,
        startTime: event.start_time,
        endTime: event.end_time,
        type: event.type,
        music: event.music || [],
        audience: event.audience,
        priceFrom: event.price_from,
        cover: event.cover,
        featured: event.featured,
        description: event.description,
        perks: event.perks || [],
      }))

      setDbEvents(mappedEvents)
    }

    fetchEvents()
  }, [])

  useEffect(() => {
    if (date) {
      localStorage.setItem('selectedDate', date)
    }
  }, [date])

  useEffect(() => {
    function handleSelectedDateChanged() {
      setDate(localStorage.getItem('selectedDate') || '')
    }

    window.addEventListener('selectedDateChanged', handleSelectedDateChanged)

    return () => {
      window.removeEventListener(
        'selectedDateChanged',
        handleSelectedDateChanged
      )
    }
  }, [])

  const areas = useMemo(
    () => ['Todas', ...new Set(dbEvents.map((event) => event.area))],
    [dbEvents]
  )

  const filtered = useMemo(() => {
    if (!date) return []

    return dbEvents.filter((event) => {
      if (event.date !== date) return false
      if (type !== 'Todos' && event.type !== type) return false
      if (music !== 'Todas' && !event.music.includes(music as never)) {
        return false
      }
      if (audience !== 'Todas' && event.audience !== audience) return false
      if (!matchesPrice(price, event.priceFrom)) return false
      if (area !== 'Todas' && event.area !== area) return false

      return true
    })
  }, [area, audience, date, music, price, type, dbEvents])

  return (
    <section id="eventos" className="container-page py-6">
      <div className="card p-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <label className="space-y-2 text-sm">
            <span className="inline-flex items-center gap-2 text-slate-300">
              <Clock3 className="h-4 w-4" /> Tipo
            </span>

            <select
              className="select"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              {eventTypes.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm">
            <span className="inline-flex items-center gap-2 text-slate-300">
              <Music4 className="h-4 w-4" /> Música
            </span>

            <select
              className="select"
              value={music}
              onChange={(e) => setMusic(e.target.value)}
            >
              {musicTypes.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm">
            <span className="inline-flex items-center gap-2 text-slate-300">
              <Users className="h-4 w-4" /> Edad
            </span>

            <select
              className="select"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
            >
              {audienceTypes.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm">
            <span className="inline-flex items-center gap-2 text-slate-300">
              <Euro className="h-4 w-4" /> Precio
            </span>

            <select
              className="select"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            >
              {priceRanges.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm">
            <span className="inline-flex items-center gap-2 text-slate-300">
              <MapPin className="h-4 w-4" /> Zona
            </span>

            <select
              className="select"
              value={area}
              onChange={(e) => setArea(e.target.value)}
            >
              {areas.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-brand-500">
            Filtrador de eventos
          </h2>

          {date && (
            <p className="text-sm font-semibold text-white">
              {filtered.length} eventos encontrados
            </p>
          )}
        </div>
      </div>

      {!date ? (
        <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
          <h3 className="text-2xl font-semibold text-white">
            Elige una fecha
          </h3>

          <p className="mt-3 text-slate-400">
            Descubre los mejores tardeos, brunchs, rooftop y afterworks de
            Madrid.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {filtered.map((event) => {
            const today = new Date().toISOString().split('T')[0]
            const isPastEvent = event.date < today

            return (
              <article
                key={event.slug}
                className="card flex h-full flex-col overflow-hidden"
              >
                {!isPastEvent && event.cover && (
                  <div
                    className="h-56 bg-cover bg-center"
                    style={{ backgroundImage: `url(${event.cover})` }}
                  />
                )}

                <div className="flex flex-1 flex-col p-6">
                  <div className="mb-3 flex flex-wrap gap-2">
                    <span className="badge">{event.type}</span>
                    <span className="badge">{event.area}</span>
                    <span className="badge">
                      Desde{' '}
                      {event.priceFrom === 0 ? 'gratis' : `${event.priceFrom}€`}
                    </span>

                    {isPastEvent && <span className="badge">Evento pasado</span>}
                  </div>

                  <h3 className="text-2xl font-semibold text-white">
                    {event.title}
                  </h3>

                  <p className="mt-2 text-sm text-slate-300">
                    {event.venue} ·{' '}
                    {new Date(event.date).toLocaleDateString('es-ES')} ·{' '}
                    {event.startTime?.slice(0, 5)} -{' '}
                    {event.endTime?.slice(0, 5)}
                  </p>

                  <p className="mt-4 line-clamp-3 text-sm text-slate-400">
                    {event.description}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {event.music.map((item) => (
                      <span key={item} className="badge">
                        {item}
                      </span>
                    ))}
                  </div>

                  <div className="mt-auto flex gap-3 pt-6">
                    <Link href={`/eventos/${event.slug}`} className="btn-primary">
                      Ver evento
                    </Link>

                    {!isPastEvent && (
                      <a href="#newsletter" className="btn-secondary">
                        Recibir planes
                      </a>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}