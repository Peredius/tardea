'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { CalendarDays, MapPinned, MapPin, Music4 } from 'lucide-react'
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
  alcala: 'Alcalá de Henares',
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

    return Array.from(groups.values())
      .sort((first, second) => {
        const rankDiff = areaRank(first.name) - areaRank(second.name)
        if (rankDiff !== 0) return rankDiff
        return first.name.localeCompare(second.name, 'es')
      })
      .slice(0, 18)
  }, [events])

  if (areaSummaries.length === 0) return null

  return (
    <section id="zonas" className="container-page py-12">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-500">
            Zonas
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-white">
            Tardeos por zona en Madrid
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-slate-400">
            Entra por barrio y revisa el evento más próximo que tenemos activo en cada zona.
          </p>
        </div>

        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
          <MapPinned className="h-4 w-4 text-brand-500" />
          {areaSummaries.length} zonas con eventos
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {areaSummaries.map((area) => {
          const event = area.nextEvent
          const music = Array.isArray(event.music) ? event.music.slice(0, 2).join(', ') : ''

          return (
            <Link
              key={area.name}
              href={profileHref(event)}
              className="group rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-brand-500/60 hover:bg-brand-500/10"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-bold text-white">{area.name}</h3>
                  <p className="mt-1 text-xs font-semibold text-brand-300">
                    {area.count} evento{area.count === 1 ? '' : 's'}
                  </p>
                </div>
                <span className="rounded-full bg-brand-500/15 px-3 py-1 text-xs font-bold text-brand-200">
                  Ver
                </span>
              </div>

              <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/45 p-3">
                <p className="line-clamp-1 text-sm font-bold text-white">
                  {event.title}
                </p>
                <p className="mt-2 flex items-center gap-2 text-xs text-slate-300">
                  <CalendarDays className="h-3.5 w-3.5 text-brand-500" />
                  {formatShortDate(event.date)}
                  {event.start_time ? ` · ${event.start_time.slice(0, 5)}` : ''}
                </p>
                {event.venue && (
                  <p className="mt-2 flex items-center gap-2 truncate text-xs text-slate-400">
                    <MapPin className="h-3.5 w-3.5 text-brand-500" />
                    {event.venue}
                  </p>
                )}
                {music && (
                  <p className="mt-2 flex items-center gap-2 truncate text-xs text-slate-400">
                    <Music4 className="h-3.5 w-3.5 text-brand-500" />
                    {music}
                  </p>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
