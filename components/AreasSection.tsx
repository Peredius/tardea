'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { BadgePercent, CalendarCheck, MapPinned, Music4, Sparkles, UsersRound } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { FavoriteButton } from '@/components/FavoriteButton'

type AreaEvent = {
  id: string
  slug: string
  title: string
  venue: string | null
  area: string | null
  date: string
  start_time: string | null
  end_time: string | null
  type: string | null
  music: string[] | null
  price_from: number | null
  cover: string | null
  event_profile_id: string | null
}

type AreaSummary = {
  name: string
  count: number
  nextEvent: AreaEvent
}

const discoveryPoints = [
  {
    icon: CalendarCheck,
    title: 'Planes actualizados',
    text: 'Encuentra tardeos activos segun la fecha que elijas.',
  },
  {
    icon: Music4,
    title: 'Tardeos por música y zona',
    text: 'Filtra por ambiente, estilo musical, precio y barrio.',
  },
  {
    icon: BadgePercent,
    title: 'Ofertas para usuarios registrados',
    text: 'Preparamos ventajas para que recibas planes que encajen contigo.',
  },
]

const userRecommendationIdeas = [
  'Rooftops y planes con vistas',
  'Tardeos comerciales',
  'Brunch y planes de domingo',
]

const areaAliases: Record<string, string> = {
  madrid: 'Madrid',
  centro: 'Centro',
  salamanca: 'Salamanca',
  malasana: 'Malasaña',
  retiro: 'Retiro',
  chamberi: 'Chamberí',
  'gran via': 'Gran Vía',
  ponzano: 'Ponzano',
  'la latina': 'La Latina',
  carabanchel: 'Carabanchel',
  chamartin: 'Chamartín',
  tetuan: 'Tetuán',
  usera: 'Usera',
  moncloa: 'Moncloa',
  'moncloa aravaca': 'Moncloa-Aravaca',
  arganzuela: 'Arganzuela',
  chueca: 'Chueca',
  huertas: 'Huertas',
  justicia: 'Justicia',
  lavapies: 'Lavapiés',
  vallecas: 'Vallecas',
  'ciudad lineal': 'Ciudad Lineal',
  'fuencarral el pardo': 'Fuencarral-El Pardo',
  fuencarral: 'Fuencarral',
  alcorcon: 'Alcorcón',
  mostoles: 'Móstoles',
  getafe: 'Getafe',
  leganes: 'Leganés',
  alcobendas: 'Alcobendas',
  'san sebastian de los reyes': 'San Sebastián de los Reyes',
  pozuelo: 'Pozuelo',
  majadahonda: 'Majadahonda',
  boadilla: 'Boadilla',
  fuenlabrada: 'Fuenlabrada',
}

const priorityAreas = [
  'Madrid',
  'Centro',
  'Salamanca',
  'Malasaña',
  'Retiro',
  'Chamberí',
  'Gran Vía',
  'Ponzano',
  'La Latina',
  'Carabanchel',
  'Chamartín',
  'Tetuán',
  'Usera',
  'Moncloa',
  'Arganzuela',
  'Chueca',
  'Huertas',
  'Lavapiés',
  'Fuencarral-El Pardo',
  'Alcorcón',
  'Móstoles',
  'Getafe',
  'Leganés',
  'Alcobendas',
]

function normalizeKey(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

const outsideMadridAreaKeys = new Set(
  [
    'Alcorcón',
    'Alcorcon',
    'Móstoles',
    'Mostoles',
    'Getafe',
    'Leganés',
    'Leganes',
    'Alcobendas',
    'San Sebastián de los Reyes',
    'San Sebastian de los Reyes',
    'Pozuelo',
    'Majadahonda',
    'Boadilla',
    'Boadilla del Monte',
    'Fuenlabrada',
  ].map(normalizeKey)
)

function displayAreaName(value?: string | null) {
  if (!value) return 'Madrid'
  const key = normalizeKey(value)
  return areaAliases[key] || value.trim()
}

function isMadridCapitalArea(value?: string | null) {
  const areaName = displayAreaName(value)
  return !outsideMadridAreaKeys.has(normalizeKey(areaName))
}

function matchesAreaSelection(eventArea: string | null | undefined, selectedArea: string) {
  if (selectedArea === 'Madrid') return isMadridCapitalArea(eventArea)
  return displayAreaName(eventArea) === selectedArea
}

function areaRank(area: string) {
  const index = priorityAreas.findIndex(
    (priorityArea) => normalizeKey(priorityArea) === normalizeKey(area)
  )

  return index === -1 ? priorityAreas.length : index
}

function formatShortDate(date: string) {
  return new Date(date).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
  })
}

function normalizePlanText(value?: string | null) {
  return normalizeKey(value || '')
    .replace(
      /\b\d{1,2}\s*(de\s*)?(ene|enero|feb|febrero|mar|marzo|abr|abril|may|mayo|jun|junio|jul|julio|ago|agosto|sep|septiembre|oct|octubre|nov|noviembre|dic|diciembre)\b/g,
      ' '
    )
    .replace(/\b\d{1,2}[/-]\d{1,2}([/-]\d{2,4})?\b/g, ' ')
    .replace(/\b20\d{2}\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function getPlanKey(event: AreaEvent) {
  if (event.event_profile_id) return `profile:${event.event_profile_id}`

  const title = normalizePlanText(event.title)
  const venue = normalizePlanText(event.venue)
  const type = normalizePlanText(event.type)

  return [type, title, venue].filter(Boolean).join('__') || event.slug
}

function compareByDate(first: AreaEvent, second: AreaEvent) {
  if (first.date !== second.date) return first.date.localeCompare(second.date)
  return (first.start_time || '').localeCompare(second.start_time || '')
}

export function AreasSection() {
  const [events, setEvents] = useState<AreaEvent[]>([])
  const [selectedArea, setSelectedArea] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAreaEvents() {
      const today = new Date().toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('events')
        .select('id, slug, title, venue, area, date, start_time, end_time, type, music, price_from, cover, event_profile_id')
        .eq('published', true)
        .eq('status', 'approved')
        .gte('date', today)
        .order('date', { ascending: true })
        .limit(500)

      if (error) {
        console.error(error)
        return
      }

      setEvents(data || [])
    }

    fetchAreaEvents()
  }, [])

  const areaSummaries = useMemo(() => {
    const groups = new Map<string, AreaSummary>()

    events.forEach((event) => {
      const areaName = displayAreaName(event.area)
      const current = groups.get(areaName)

      if (!current) {
        groups.set(areaName, {
          name: areaName,
          count: 1,
          nextEvent: event,
        })
        return
      }

      current.count += 1
      if (event.date < current.nextEvent.date) {
        current.nextEvent = event
      }
    })

    const madridCapitalEvents = events.filter((event) => isMadridCapitalArea(event.area)).sort(compareByDate)
    if (madridCapitalEvents.length > 0) {
      groups.set('Madrid', {
        name: 'Madrid',
        count: madridCapitalEvents.length,
        nextEvent: madridCapitalEvents[0],
      })
    }

    return Array.from(groups.values()).sort((first, second) => {
      const rankDiff = areaRank(first.name) - areaRank(second.name)
      if (rankDiff !== 0) return rankDiff
      return first.name.localeCompare(second.name, 'es')
    })
  }, [events])

  const activeArea = useMemo(
    () => areaSummaries.find((area) => area.name === selectedArea) || null,
    [areaSummaries, selectedArea]
  )

  const activeAreaEvents = useMemo(() => {
    if (!selectedArea) return []

    const groupedEvents = new Map<string, AreaEvent>()

    events
      .filter((event) => matchesAreaSelection(event.area, selectedArea))
      .sort(compareByDate)
      .forEach((event) => {
        const key = getPlanKey(event)
        if (!groupedEvents.has(key)) {
          groupedEvents.set(key, event)
        }
      })

    return Array.from(groupedEvents.values())
      .slice(0, 8)
  }, [events, selectedArea])

  return (
    <section id="zonas" className="container-page py-12">
      <div className="card p-6 md:p-8">
        <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-500">
              Zonas
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">
              Zonas de Madrid con eventos
            </h2>

            <p className="mt-3 max-w-xl text-sm text-slate-400">
              Pulsa una zona y verás los planes más próximos, agrupados para que
              no se repita el mismo evento con varias fechas.
            </p>
          </div>

          <div>
            <div className="flex flex-wrap gap-2">
              {areaSummaries.map((area) => (
                <button
                  key={area.name}
                  type="button"
                  onClick={() => setSelectedArea(area.name)}
                  className={`badge transition ${
                    selectedArea === area.name
                      ? 'bg-brand-500 text-white'
                      : 'hover:border-brand-500/60 hover:bg-brand-500/15 hover:text-white'
                  }`}
                >
                  {area.name}
                </button>
              ))}
            </div>

            {!activeArea && (
              <p className="mt-6 rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-400">
                Selecciona una zona para ver su próximo evento.
              </p>
            )}
          </div>
        </div>
      </div>

      {activeArea && (
        <div className="mt-8">
          <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-500">
                Eventos por zona
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-white">
                Próximos eventos en {activeArea.name}
              </h2>
            </div>
            <p className="text-sm font-semibold text-slate-300">
              {activeAreaEvents.length} plan{activeAreaEvents.length === 1 ? '' : 'es'} con
              próxima fecha
            </p>
          </div>

          <div className="-mx-4 flex snap-x snap-proximity items-center gap-1.5 overflow-x-auto px-[24vw] pb-6 pt-3 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 sm:pt-0 xl:grid-cols-4 [&::-webkit-scrollbar]:hidden">
            {activeAreaEvents.map((event) => (
              <article
                key={event.slug}
                className="group relative flex aspect-[9/16] min-w-[48vw] snap-center overflow-hidden rounded-[1.35rem] border border-white/10 bg-slate-900 transition duration-300 ease-out hover:border-brand-500/40 sm:card sm:aspect-auto sm:min-w-0 sm:flex-col sm:rounded-3xl"
              >
                <Link
                  href={`/eventos/${event.slug}`}
                  aria-label={`Ver ${event.title}`}
                  className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105 sm:relative sm:h-44 sm:min-h-0 sm:w-full sm:shrink-0"
                  style={{
                    backgroundImage: `url(${
                      event.cover ||
                      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80'
                    })`,
                  }}
                />

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/55 to-transparent sm:hidden" />
                <FavoriteButton
                  eventId={event.id}
                  eventProfileId={event.event_profile_id}
                  className="absolute right-3 top-3 z-20"
                />

                <div className="relative z-10 flex min-w-0 flex-1 flex-col justify-end p-4 sm:justify-start">
                  <div className="mb-2 flex flex-wrap gap-1.5 sm:mb-3 sm:gap-2">
                    {event.type && <span className="badge">{event.type}</span>}
                    <span className="badge">{activeArea.name}</span>
                    <span className="badge">
                      Desde {event.price_from === 0 ? 'gratis' : `${event.price_from || 0}€`}
                    </span>
                  </div>

                  <h3 className="line-clamp-2 text-base font-semibold leading-tight text-white sm:text-lg">
                    {event.title}
                  </h3>

                  <p className="mt-2 line-clamp-2 text-xs text-slate-200 sm:text-sm sm:text-slate-300">
                    {event.venue} · {new Date(event.date).toLocaleDateString('es-ES')} ·{' '}
                    {event.start_time?.slice(0, 5)}
                    {event.end_time ? ` - ${event.end_time.slice(0, 5)}` : ''}
                  </p>

                  <div className="mt-3 hidden flex-wrap gap-1.5 sm:mt-5 sm:flex sm:gap-2">
                    {(event.music || []).slice(0, 2).map((item) => (
                      <span key={item} className="badge">
                        {item}
                      </span>
                    ))}
                  </div>

                  <Link
                    href={`/eventos/${event.slug}`}
                    className="mt-3 text-sm font-semibold text-brand-500 hover:underline sm:mt-auto sm:pt-4"
                  >
                    Ver evento →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <div className="card p-6 md:p-8">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-500/15 text-brand-500">
            <MapPinned className="h-5 w-5" />
          </div>

          <h2 className="mt-5 text-2xl font-bold tracking-tight text-white">
            Encuentra tu tardeo ideal
          </h2>

          <p className="mt-3 max-w-2xl text-sm text-slate-400">
            Elige fecha, zona, música y presupuesto para descubrir planes de
            tardeo en Madrid.
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {discoveryPoints.map((item) => {
              const Icon = item.icon

              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/10 bg-slate-900/60 p-4"
                >
                  <Icon className="h-5 w-5 text-brand-500" />
                  <h3 className="mt-3 font-semibold text-white">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-400">{item.text}</p>
                </div>
              )
            })}
          </div>
        </div>

        <div className="card p-6 md:p-8">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 text-brand-500">
              <UsersRound className="h-5 w-5" />
            </span>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Próximamente
            </p>
          </div>

          <h2 className="mt-5 text-2xl font-bold tracking-tight text-white">
            Planes recomendados por usuarios
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-slate-400">
            Más adelante podremos mostrar reseñas y selecciones de usuarios para
            descubrir tardeos con criterio real.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {userRecommendationIdeas.map((idea) => (
              <span
                key={idea}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/60 px-3 py-2 text-xs font-medium text-slate-300"
              >
                <Sparkles className="h-3.5 w-3.5 text-brand-500" />
                {idea}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
