'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { BadgePercent, CalendarCheck, MapPinned, MapPin, Music4 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type AreaEvent = {
  id: string
  slug: string
  title: string
  venue: string | null
  area: string | null
  date: string
  start_time: string | null
  type: string | null
  music: string[] | null
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

function displayAreaName(value?: string | null) {
  if (!value) return 'Madrid'
  const key = normalizeKey(value)
  return areaAliases[key] || value.trim()
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

function profileHref(event: AreaEvent) {
  return event.event_profile_id
    ? `/eventos/grupo/${event.event_profile_id}`
    : `/eventos/${event.slug}`
}

export function AreasSection() {
  const [events, setEvents] = useState<AreaEvent[]>([])
  const [selectedArea, setSelectedArea] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAreaEvents() {
      const today = new Date().toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('events')
        .select('id, slug, title, venue, area, date, start_time, type, music, event_profile_id')
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

  return (
    <section id="zonas" className="container-page py-12">
      <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <div className="card p-6 md:p-8">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-500/15 text-brand-500">
            <MapPinned className="h-5 w-5" />
          </div>

          <h2 className="mt-5 text-3xl font-bold tracking-tight text-white">
            Encuentra tu tardeo ideal
          </h2>

          <p className="mt-3 max-w-2xl text-slate-400">
            Elige fecha, zona, música y presupuesto para descubrir planes de
            tardeo en Madrid.
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
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

        <div className="card flex flex-col justify-between p-6 md:p-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-500">
              Zonas
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">
              Zonas de Madrid con eventos
            </h2>

            <p className="mt-3 text-sm text-slate-400">
              Pulsa una zona para ver el evento más próximo que tenemos activo.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
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

            {activeArea ? (
              <div className="mt-6 rounded-2xl border border-brand-500/30 bg-slate-950/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-400">
                  Próximo en {activeArea.name}
                </p>
                <h3 className="mt-2 text-xl font-bold text-white">
                  {activeArea.nextEvent.title}
                </h3>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-300">
                  <span className="badge">
                    {formatShortDate(activeArea.nextEvent.date)}
                    {activeArea.nextEvent.start_time
                      ? ` · ${activeArea.nextEvent.start_time.slice(0, 5)}`
                      : ''}
                  </span>
                  {activeArea.nextEvent.type && (
                    <span className="badge">{activeArea.nextEvent.type}</span>
                  )}
                  <span className="badge">
                    {activeArea.count} evento{activeArea.count === 1 ? '' : 's'}
                  </span>
                </div>
                {activeArea.nextEvent.venue && (
                  <p className="mt-3 flex items-center gap-2 text-sm text-slate-400">
                    <MapPin className="h-4 w-4 text-brand-500" />
                    {activeArea.nextEvent.venue}
                  </p>
                )}
                <Link
                  href={profileHref(activeArea.nextEvent)}
                  className="mt-4 inline-flex rounded-full bg-brand-500 px-5 py-2 text-sm font-bold text-white transition hover:bg-brand-400"
                >
                  Ver evento
                </Link>
              </div>
            ) : (
              <p className="mt-6 rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-400">
                Selecciona una zona para ver su próximo evento.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
