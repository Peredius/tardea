'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import Link from 'next/link'
import {
  Clock3,
  Euro,
  ChevronDown,
  List,
  LocateFixed,
  Map as MapIcon,
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

const madridBounds = {
  north: 40.53,
  south: 40.31,
  west: -3.84,
  east: -3.55,
}

const areaCoordinates: Record<string, { lat: number; lng: number }> = {
  Madrid: { lat: 40.4168, lng: -3.7038 },
  Centro: { lat: 40.4168, lng: -3.7038 },
  Salamanca: { lat: 40.427, lng: -3.679 },
  'Gran Via': { lat: 40.42, lng: -3.705 },
  'Gran Vía': { lat: 40.42, lng: -3.705 },
  Ponzano: { lat: 40.441, lng: -3.699 },
  Retiro: { lat: 40.414, lng: -3.676 },
  Chamberí: { lat: 40.434, lng: -3.704 },
  Chamberi: { lat: 40.434, lng: -3.704 },
  Malasaña: { lat: 40.426, lng: -3.704 },
  Malasana: { lat: 40.426, lng: -3.704 },
  'La Latina': { lat: 40.411, lng: -3.708 },
  Chamartín: { lat: 40.462, lng: -3.676 },
  Tetuán: { lat: 40.459, lng: -3.699 },
  Tetuan: { lat: 40.459, lng: -3.699 },
  Alcorcón: { lat: 40.3468, lng: -3.8278 },
  Alcorcon: { lat: 40.3468, lng: -3.8278 },
  Móstoles: { lat: 40.3223, lng: -3.8649 },
  Mostoles: { lat: 40.3223, lng: -3.8649 },
  Carabanchel: { lat: 40.382, lng: -3.744 },
  Moncloa: { lat: 40.435, lng: -3.719 },
  'Fuencarral-El Pardo': { lat: 40.498, lng: -3.709 },
}

const priorityAreas = [
  'Madrid',
  'Centro',
  'Salamanca',
  'Malasaña',
  'Malasana',
  'Retiro',
  'Chamberí',
  'Chamberi',
  'Gran Vía',
  'Gran Via',
  'Ponzano',
  'La Latina',
  'Carabanchel',
  'Chamartín',
]

function normalizeAreaKey(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

const priorityAreaKeys = priorityAreas.map(normalizeAreaKey)

function displayAreaName(value: string) {
  const normalized = normalizeAreaKey(value)
  if (normalized === 'chamartin') return 'Chamartín'
  return value
}

function sortAreas(values: string[]) {
  return values.slice().sort((first, second) => {
    const firstIndex = priorityAreaKeys.indexOf(normalizeAreaKey(first))
    const secondIndex = priorityAreaKeys.indexOf(normalizeAreaKey(second))
    const firstRank = firstIndex === -1 ? priorityAreaKeys.length : firstIndex
    const secondRank = secondIndex === -1 ? priorityAreaKeys.length : secondIndex

    if (firstRank !== secondRank) return firstRank - secondRank
    return first.localeCompare(second, 'es')
  })
}

function coordinateToMapPosition(lat: number, lng: number) {
  const x = ((lng - madridBounds.west) / (madridBounds.east - madridBounds.west)) * 100
  const y = ((madridBounds.north - lat) / (madridBounds.north - madridBounds.south)) * 100

  return {
    left: `${Math.min(94, Math.max(6, x))}%`,
    top: `${Math.min(92, Math.max(8, y))}%`,
  }
}

function getEventCoordinates(event: any) {
  if (typeof event.latitude === 'number' && typeof event.longitude === 'number') {
    return { lat: event.latitude, lng: event.longitude }
  }

  return areaCoordinates[event.area] || areaCoordinates.Madrid
}

function googleMapsSearchUrl(event: any) {
  if (event.mapsUrl) return event.mapsUrl
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    [event.venue, event.address, event.area, 'Madrid'].filter(Boolean).join(', ')
  )}`
}

function googleMapsRouteUrl(event: any, userLocation: { lat: number; lng: number } | null) {
  const destination = [event.venue, event.address, event.area, 'Madrid'].filter(Boolean).join(', ')
  const params = new URLSearchParams({
    api: '1',
    destination,
    travelmode: 'walking',
  })

  if (userLocation) {
    params.set('origin', `${userLocation.lat},${userLocation.lng}`)
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`
}

export function Filters() {
  const carouselRef = useRef<HTMLDivElement | null>(null)
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
  const [activeEventSlug, setActiveEventSlug] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationStatus, setLocationStatus] = useState('')

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
        mapsUrl: event.maps_url,
        latitude: event.latitude,
        longitude: event.longitude,
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
    () => ['Todas', ...sortAreas(Array.from(new Set(dbEvents.map((event) => displayAreaName(event.area)).filter(Boolean))))],
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
      if (area !== 'Todas' && displayAreaName(event.area) !== area) return false

      return true
    })
  }, [area, audience, selectedDates, music, price, type, dbEvents])

  useEffect(() => {
    setActiveEventSlug(filtered[0]?.slug || '')
  }, [filtered])

  function updateActiveEventFromScroll() {
    const carousel = carouselRef.current
    if (!carousel) return

    const carouselBox = carousel.getBoundingClientRect()
    const center = carouselBox.left + carouselBox.width / 2
    const cards = Array.from(
      carousel.querySelectorAll<HTMLElement>('[data-event-card]')
    )

    const closest = cards.reduce<{ slug: string; distance: number } | null>(
      (best, card) => {
        const box = card.getBoundingClientRect()
        const cardCenter = box.left + box.width / 2
        const distance = Math.abs(center - cardCenter)
        const slug = card.dataset.slug || ''

        if (!best || distance < best.distance) return { slug, distance }
        return best
      },
      null
    )

    if (closest?.slug) setActiveEventSlug(closest.slug)
  }

  function openActiveEventOnTap(
    slug: string,
    event: MouseEvent<HTMLElement>
  ) {
    if (window.innerWidth >= 640) return

    const target = event.target as HTMLElement
    if (target.closest('a, button, input, select, textarea')) return

    if (activeEventSlug === slug) {
      window.location.href = `/eventos/${slug}`
    }
  }

  function requestUserLocation() {
    if (!navigator.geolocation) {
      setLocationStatus('Tu navegador no permite ubicarte.')
      return
    }

    setLocationStatus('Buscando tu ubicacion...')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
        setLocationStatus('Ubicacion activada')
      },
      () => {
        setLocationStatus('No se pudo activar tu ubicacion')
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  return (
    <section id="eventos" className="container-page scroll-mt-24 py-6 md:scroll-mt-20">
      <div className="card p-5">
        <button
          type="button"
          onClick={() => setFiltersOpen((current) => !current)}
          className="flex w-full items-center justify-between gap-4 md:hidden"
          aria-expanded={filtersOpen}
        >
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-brand-500">
            <SlidersHorizontal className="h-4 w-4" />
            Filtros de eventos
          </span>

          <span className="inline-flex items-center gap-3">
            {selectedDates.length > 0 && (
              <span className="text-sm font-semibold text-white">
                {filtered.length} encontrados
              </span>
            )}
            <ChevronDown
              className={`h-5 w-5 text-slate-400 transition ${
                filtersOpen ? 'rotate-180' : ''
              }`}
            />
          </span>
        </button>

        <div
          className={`mt-5 grid gap-4 md:mt-0 md:grid md:grid-cols-2 xl:grid-cols-5 ${
            filtersOpen ? 'grid' : 'hidden'
          }`}
        >
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

        <div className="mt-5 hidden items-center justify-between md:flex">
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
        <>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex w-fit rounded-full border border-white/10 bg-slate-900/80 p-1">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition ${
                viewMode === 'list'
                  ? 'bg-brand-500 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="h-4 w-4" />
              Lista
            </button>
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition ${
                viewMode === 'map'
                  ? 'bg-brand-500 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MapIcon className="h-4 w-4" />
              Mapa
            </button>
          </div>

          {viewMode === 'map' && (
            <button
              type="button"
              onClick={requestUserLocation}
              className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-200 transition hover:border-brand-500/60 hover:text-white"
            >
              <LocateFixed className="h-4 w-4" />
              Ver mi ubicacion
            </button>
          )}
        </div>

        {viewMode === 'map' ? (
          <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="relative min-h-[440px] overflow-hidden rounded-[28px] border border-white/10 bg-slate-900 shadow-2xl shadow-black/30">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_25%,rgba(255,46,99,0.2),transparent_20%),radial-gradient(circle_at_80%_30%,rgba(56,189,248,0.12),transparent_18%),linear-gradient(135deg,rgba(15,23,42,0.95),rgba(2,6,23,0.98))]" />
              <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:42px_42px]" />
              <div className="absolute left-[12%] right-[8%] top-[48%] h-1 rotate-[-8deg] rounded-full bg-white/10" />
              <div className="absolute bottom-[18%] left-[24%] right-[14%] h-1 rotate-[13deg] rounded-full bg-white/10" />
              <div className="absolute bottom-[10%] top-[8%] left-[48%] w-1 rotate-[7deg] rounded-full bg-white/10" />

              <div className="absolute left-4 top-4 rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 backdrop-blur">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-400">Mapa Tardea</p>
                <p className="mt-1 text-xs text-slate-400">
                  {filtered.length} evento{filtered.length === 1 ? '' : 's'} filtrado{filtered.length === 1 ? '' : 's'}
                </p>
              </div>

              {userLocation && (
                <div
                  className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
                  style={coordinateToMapPosition(userLocation.lat, userLocation.lng)}
                  title="Tu ubicacion"
                >
                  <span className="absolute -inset-3 rounded-full bg-sky-400/20" />
                  <span className="relative flex h-4 w-4 rounded-full border-2 border-white bg-sky-400 shadow-lg shadow-sky-500/40" />
                </div>
              )}

              {filtered.map((event, index) => {
                const coordinates = getEventCoordinates(event)
                const position = coordinateToMapPosition(coordinates.lat, coordinates.lng)
                const isActive = activeEventSlug === event.slug

                return (
                  <button
                    key={event.slug}
                    type="button"
                    onClick={() => setActiveEventSlug(event.slug)}
                    className="absolute z-10 -translate-x-1/2 -translate-y-full"
                    style={position}
                    aria-label={event.title}
                  >
                    <span className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-black shadow-lg transition ${
                      isActive
                        ? 'scale-125 border-white bg-brand-500 text-white shadow-brand-500/40'
                        : 'border-brand-300/60 bg-brand-500/85 text-white hover:scale-110'
                    }`}>
                      {index + 1}
                    </span>
                    <span className="mx-auto block h-2 w-2 rotate-45 bg-brand-500" />
                  </button>
                )
              })}

              {locationStatus && (
                <p className="absolute bottom-4 left-4 rounded-full border border-white/10 bg-slate-950/80 px-4 py-2 text-xs font-semibold text-slate-300">
                  {locationStatus}
                </p>
              )}
            </div>

            <div className="space-y-2">
              {filtered.map((event, index) => {
                const isActive = activeEventSlug === event.slug

                return (
                  <article
                    key={event.slug}
                    className={`rounded-2xl border p-3 transition ${
                      isActive
                        ? 'border-brand-500/60 bg-brand-500/10'
                        : 'border-white/10 bg-slate-900/70 hover:border-white/20'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveEventSlug(event.slug)}
                      className="flex w-full gap-3 text-left"
                    >
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-500 text-xs font-black text-white">
                        {index + 1}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold text-white">{event.title}</span>
                        <span className="mt-1 block truncate text-xs text-slate-400">
                          {event.venue} · {event.area} · {event.startTime?.slice(0, 5)}
                        </span>
                      </span>
                    </button>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link href={`/eventos/${event.slug}`} className="rounded-full bg-brand-500 px-3 py-1.5 text-xs font-bold text-white">
                        Ver evento
                      </Link>
                      <a
                        href={googleMapsRouteUrl(event, userLocation)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-bold text-slate-200 hover:border-brand-500/60"
                      >
                        Ruta
                      </a>
                      <a
                        href={googleMapsSearchUrl(event)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-bold text-slate-400 hover:border-brand-500/60 hover:text-white"
                      >
                        Google Maps
                      </a>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        ) : (
        <div
          ref={carouselRef}
          onScroll={updateActiveEventFromScroll}
          className="-mx-5 mt-8 flex snap-x snap-mandatory gap-2 overflow-x-auto px-5 pb-3 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 xl:grid-cols-4 [&::-webkit-scrollbar]:hidden"
        >
          {filtered.map((event) => {
            const today = new Date().toISOString().split('T')[0]
            const isPastEvent = event.date < today

            return (
              <article
                key={event.slug}
                data-event-card
                data-slug={event.slug}
                onClick={(clickEvent) => openActiveEventOnTap(event.slug, clickEvent)}
                className={`group relative flex aspect-[9/16] snap-center overflow-hidden rounded-3xl border border-white/10 bg-slate-900 transition duration-300 sm:card sm:aspect-auto sm:h-full sm:min-h-0 sm:min-w-0 sm:scale-100 sm:flex-col ${
                  activeEventSlug === event.slug
                    ? 'min-w-[56vw] scale-100'
                    : 'min-w-[50vw] scale-[0.94] opacity-80'
                }`}
              >
                <Link
                  href={`/eventos/${event.slug}`}
                  aria-label={`Ver ${event.title}`}
                  className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105 sm:relative sm:h-44 sm:min-h-0 sm:w-full sm:shrink-0"
                  style={{
                    backgroundImage: `url(${
                      !isPastEvent && event.cover
                        ? event.cover
                      : 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80'
                    })`,
                  }}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/55 to-transparent sm:hidden" />

                <div className="relative z-10 flex min-w-0 flex-1 flex-col justify-end p-4 sm:justify-start">
                  <div className="mb-2 flex flex-wrap gap-1.5 sm:mb-3 sm:gap-2">
                    <span className="badge">{event.type}</span>
                    <span className="badge hidden sm:inline-flex">{event.area}</span>
                    <span className="badge hidden sm:inline-flex">
                      Desde{' '}
                      {event.priceFrom === 0 ? 'gratis' : `${event.priceFrom}€`}
                    </span>

                    {isPastEvent && <span className="badge">Evento pasado</span>}
                  </div>

                  <h3 className="line-clamp-2 text-base font-semibold leading-tight text-white sm:text-lg">
                    {event.title}
                  </h3>

                  <p className="mt-2 line-clamp-2 text-xs text-slate-200 sm:text-sm sm:text-slate-300">
                    {event.venue} ·{' '}
                    {new Date(event.date).toLocaleDateString('es-ES')} ·{' '}
                    {event.startTime?.slice(0, 5)} -{' '}
                    {event.endTime?.slice(0, 5)}
                  </p>

                  <div className="mt-3 hidden flex-wrap gap-1.5 sm:mt-5 sm:flex sm:gap-2">
                    {event.music.slice(0, 2).map((item) => (
                      <span key={item} className="badge">
                        {item}
                      </span>
                    ))}
                  </div>

                  <div className="mt-3 flex gap-2 sm:mt-auto sm:gap-3 sm:pt-4">
                    <Link href={`/eventos/${event.slug}`} className="text-sm font-semibold text-brand-500 hover:underline">
                      Ver evento →
                    </Link>

                    {!isPastEvent && (
                      <a href="#newsletter" className="hidden text-sm font-semibold text-slate-400 hover:text-white sm:inline-flex">
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
        </>
      )}
    </section>
  )
}
