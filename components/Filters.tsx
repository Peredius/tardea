'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Clock3,
  Euro,
  MapPin,
  Music4,
  SlidersHorizontal,
  Users,
} from 'lucide-react'
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
  const [selectedDates, setSelectedDates] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const storedDates = localStorage.getItem('selectedDates')
      if (storedDates) {
        try {
          return JSON.parse(storedDates)
        } catch {
          return []
        }
      }

      const storedDate = localStorage.getItem('selectedDate')
      return storedDate ? [storedDate] : []
    }

    return []
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
    function handleSelectedDateChanged() {
      const storedDates = localStorage.getItem('selectedDates')

      if (storedDates) {
        try {
          setSelectedDates(JSON.parse(storedDates))
          return
        } catch {
          setSelectedDates([])
          return
        }
      }

      const storedDate = localStorage.getItem('selectedDate')
      setSelectedDates(storedDate ? [storedDate] : [])
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
    if (selectedDates.length === 0) return []

    return dbEvents.filter((event) => {
      if (!selectedDates.includes(event.date)) return false
      if (type !== 'Todos' && event.type !== type) return false
      if (music !== 'Todas' && !event.music.includes(music as never)) {
        return false
      }
      if (audience !== 'Todas' && event.audience !== audience) return false
      if (!matchesPrice(price, event.priceFrom)) return false
      if (area !== 'Todas' && event.area !== area) return false

      return true
    })
  }, [area, audience, selectedDates, music, price, type, dbEvents])

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
          <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-brand-500">
            <SlidersHorizontal className="h-4 w-4" />
            Filtrador de eventos
          </h2>

          {selectedDates.length > 0 && (
            <p className="text-sm font-semibold text-white">
              {filtered.length} eventos encontrados
            </p>
          )}
        </div>
      </div>

      {selectedDates.length === 0 ? (
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
        <div className="-mx-5 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-3 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 xl:grid-cols-4 [&::-webkit-scrollbar]:hidden">
          {filtered.map((event) => {
            const today = new Date().toISOString().split('T')[0]
            const isPastEvent = event.date < today

            return (
              <article
                key={event.slug}
                className="card flex h-full min-h-[170px] min-w-[84vw] snap-start overflow-hidden sm:min-w-0 sm:flex-col"
              >
                <div
                  className="min-h-full w-[38%] shrink-0 bg-cover bg-center sm:h-56 sm:min-h-0 sm:w-full"
                  style={{
                    backgroundImage: `url(${
                      !isPastEvent && event.cover
                        ? event.cover
                        : 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80'
                    })`,
                  }}
                />

                <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-6">
                  <div className="mb-2 flex flex-wrap gap-1.5 sm:mb-3 sm:gap-2">
                    <span className="badge">{event.type}</span>
                    <span className="badge hidden sm:inline-flex">{event.area}</span>
                    <span className="badge hidden sm:inline-flex">
                      Desde{' '}
                      {event.priceFrom === 0 ? 'gratis' : `${event.priceFrom}€`}
                    </span>

                    {isPastEvent && <span className="badge">Evento pasado</span>}
                  </div>

                  <h3 className="line-clamp-2 text-base font-semibold leading-tight text-white sm:text-2xl">
                    {event.title}
                  </h3>

                  <p className="mt-2 line-clamp-2 text-xs text-slate-300 sm:text-sm">
                    {event.venue} ·{' '}
                    {new Date(event.date).toLocaleDateString('es-ES')} ·{' '}
                    {event.startTime?.slice(0, 5)} -{' '}
                    {event.endTime?.slice(0, 5)}
                  </p>

                  <p className="mt-4 hidden line-clamp-3 text-sm text-slate-400 sm:block">
                    {event.description}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1.5 sm:mt-5 sm:gap-2">
                    {event.music.slice(0, 2).map((item) => (
                      <span key={item} className="badge">
                        {item}
                      </span>
                    ))}
                  </div>

                  <div className="mt-auto flex gap-2 pt-4 sm:gap-3 sm:pt-6">
                    <Link href={`/eventos/${event.slug}`} className="btn-primary px-3 py-2 text-xs sm:px-5 sm:py-3 sm:text-sm">
                      Ver evento
                    </Link>

                    {!isPastEvent && (
                      <a href="#newsletter" className="btn-secondary hidden px-3 py-2 text-xs sm:inline-flex sm:px-5 sm:py-3 sm:text-sm">
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
