import type { Metadata } from 'next'
import Link from 'next/link'
import { CalendarDays, Clock3, Euro, MapPin, Music4 } from 'lucide-react'
import { Footer } from '@/components/Footer'
import { Navbar } from '@/components/Navbar'
import { optimizedCoverUrl } from '@/lib/images'
import { audienceTypes, eventTypes, musicTypes, priceRanges } from '@/lib/data'
import { canonicalizeMusicList, normalizeMusicKey } from '@/lib/music'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Tardeos en Madrid este fin de semana: viernes, sábado y domingo',
  description:
    'Consulta los tardeos en Madrid de este fin de semana. Planes de viernes a domingo con horarios, zonas, música, precios y entradas oficiales.',
  alternates: {
    canonical: '/tardeos-madrid-fin-de-semana',
  },
  openGraph: {
    title: 'Tardeos en Madrid este fin de semana | TARDEA',
    description:
      'Agenda de tardeos en Madrid para viernes, sábado y domingo con fechas, horarios y entradas.',
    url: '/tardeos-madrid-fin-de-semana',
    type: 'website',
    images: ['/logotardeaweb.png'],
  },
}

type WeekendEvent = {
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
  audience: string | null
  price_from: number | null
  cover: string | null
}

type WeekendFilters = {
  day?: string
  type?: string
  music?: string
  audience?: string
  price?: string
  area?: string
}

const fallbackCover =
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=76'

function dateInMadrid() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Madrid' })
}

function addDays(value: string, days: number) {
  const date = new Date(`${value}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function getWeekendRange() {
  const today = dateInMadrid()
  const day = new Date(`${today}T12:00:00Z`).getUTCDay()
  const offsetToFriday = day === 6 ? -1 : day === 0 ? -2 : 5 - day
  const friday = addDays(today, offsetToFriday)

  return {
    friday,
    sunday: addDays(friday, 2),
  }
}

function formatLongDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function formatPrice(value: number | null) {
  if (value === 0) return 'Gratis'
  if (typeof value === 'number') return `Desde ${value} €`
  return 'Consultar precio'
}

function matchesPrice(range: string, price: number | null) {
  if (!range || range === 'Todos') return true
  if (price === null) return false
  if (range === 'Gratis') return price === 0
  if (range === '0-15€') return price > 0 && price <= 15
  if (range === '15-30€') return price > 15 && price <= 30
  if (range === '30€+') return price > 30
  return true
}

function filterValue(value: string | string[] | undefined) {
  return typeof value === 'string' ? value : ''
}

async function getWeekendEvents(friday: string, sunday: string) {
  const { data } = await supabase
    .from('events')
    .select(
      'id, slug, title, venue, area, date, start_time, end_time, type, music, audience, price_from, cover'
    )
    .eq('published', true)
    .eq('status', 'approved')
    .gte('date', friday)
    .lte('date', sunday)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true })
    .limit(250)

  return (data || []) as WeekendEvent[]
}

export default async function WeekendTardeosPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>
}) {
  const { friday, sunday } = getWeekendRange()
  const events = await getWeekendEvents(friday, sunday)
  const days = [friday, addDays(friday, 1), sunday]
  const areas = Array.from(new Set(events.map((event) => event.area).filter((area): area is string => Boolean(area))))
    .sort((first, second) => first.localeCompare(second, 'es'))
  const selected: Required<WeekendFilters> = {
    day: days.includes(filterValue(searchParams?.day)) ? filterValue(searchParams?.day) : '',
    type: eventTypes.includes(filterValue(searchParams?.type)) ? filterValue(searchParams?.type) : '',
    music: musicTypes.includes(filterValue(searchParams?.music)) ? filterValue(searchParams?.music) : '',
    audience: audienceTypes.includes(filterValue(searchParams?.audience)) ? filterValue(searchParams?.audience) : '',
    price: priceRanges.includes(filterValue(searchParams?.price)) ? filterValue(searchParams?.price) : '',
    area: areas.includes(filterValue(searchParams?.area)) ? filterValue(searchParams?.area) : '',
  }
  const hasActiveFilters = Object.values(selected).some(Boolean)
  const filteredEvents = events.filter((event) =>
    (!selected.day || event.date === selected.day) &&
    (!selected.type || selected.type === 'Todos' || event.type === selected.type) &&
    (!selected.music || selected.music === 'Todas' || canonicalizeMusicList(event.music).some((item) =>
      normalizeMusicKey(item) === normalizeMusicKey(selected.music))) &&
    (!selected.audience || selected.audience === 'Todas' || event.audience === selected.audience) &&
    matchesPrice(selected.price, event.price_from) &&
    (!selected.area || event.area === selected.area)
  )
  const groupedEvents = filteredEvents.reduce<Record<string, WeekendEvent[]>>((groups, event) => {
    groups[event.date] = [...(groups[event.date] || []), event]
    return groups
  }, {})

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Tardeos en Madrid este fin de semana',
    itemListElement: filteredEvents.map((event, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: event.title,
      url: `https://www.tardea.com/eventos/${event.slug}`,
    })),
  }

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <Navbar />

      <section className="border-b border-white/10 bg-slate-900/55">
        <div className="container-page py-8 md:py-10">
          <p className="text-sm font-semibold uppercase text-brand-500">Viernes, sábado y domingo</p>
          <h1 className="mt-2 max-w-5xl text-3xl font-bold text-white md:text-4xl">
            Tardeos en Madrid este fin de semana
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-300">
            Planes publicados del {formatLongDate(friday)} al {formatLongDate(sunday)}, con horarios,
            zonas, música, ambiente y precios para comparar antes de elegir.
          </p>
          <form action="/tardeos-madrid-fin-de-semana#agenda-fin-de-semana" className="mt-5">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
              <label className="min-w-0 text-sm text-slate-300">
                Día
                <select name="day" defaultValue={selected.day} className="select mt-1 w-full">
                  <option value="">Todos</option>
                  {days.map((day) => <option key={day} value={day}>{formatLongDate(day)}</option>)}
                </select>
              </label>
              <label className="min-w-0 text-sm text-slate-300">
                Tipo
                <select name="type" defaultValue={selected.type} className="select mt-1 w-full">
                  {eventTypes.map((type) => <option key={type} value={type === 'Todos' ? '' : type}>{type}</option>)}
                </select>
              </label>
              <label className="min-w-0 text-sm text-slate-300">
                Música
                <select name="music" defaultValue={selected.music} className="select mt-1 w-full">
                  {musicTypes.map((music) => <option key={music} value={music === 'Todas' ? '' : music}>{music}</option>)}
                </select>
              </label>
              <label className="min-w-0 text-sm text-slate-300">
                Edad
                <select name="audience" defaultValue={selected.audience} className="select mt-1 w-full">
                  {audienceTypes.map((audience) => <option key={audience} value={audience === 'Todas' ? '' : audience}>{audience}</option>)}
                </select>
              </label>
              <label className="min-w-0 text-sm text-slate-300">
                Precio
                <select name="price" defaultValue={selected.price} className="select mt-1 w-full">
                  {priceRanges.map((price) => <option key={price} value={price === 'Todos' ? '' : price}>{price}</option>)}
                </select>
              </label>
              <label className="min-w-0 text-sm text-slate-300">
                Zona
                <select name="area" defaultValue={selected.area} className="select mt-1 w-full">
                  <option value="">Todas</option>
                  {areas.map((area) => <option key={area} value={area}>{area}</option>)}
                </select>
              </label>
            </div>
            <div className="mt-4 flex items-center gap-4">
              <button type="submit" className="btn-primary">Filtrar</button>
              {hasActiveFilters && <Link href="/tardeos-madrid-fin-de-semana" className="text-sm text-slate-300 hover:text-white">Limpiar</Link>}
            </div>
          </form>
        </div>
      </section>

      <section id="agenda-fin-de-semana" className="container-page scroll-mt-24 py-12 md:py-16">
        {filteredEvents.length > 0 ? (
          <div className="space-y-14">
            {Object.entries(groupedEvents).map(([date, dateEvents]) => (
              <section key={date} aria-labelledby={`fecha-${date}`}>
                <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                  <CalendarDays className="h-6 w-6 text-brand-500" />
                  <h2 id={`fecha-${date}`} className="text-2xl font-bold capitalize text-white md:text-3xl">
                    {formatLongDate(date)}
                  </h2>
                  <span className="ml-auto text-sm text-slate-500">
                    {dateEvents.length} evento{dateEvents.length === 1 ? '' : 's'}
                  </span>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {dateEvents.map((event) => (
                    <article
                      key={event.id}
                      className="overflow-hidden rounded-lg border border-white/10 bg-slate-900"
                    >
                      <Link
                        href={`/eventos/${event.slug}`}
                        aria-label={`Ver ${event.title}`}
                        className="block aspect-[4/3] bg-cover bg-center"
                        style={{
                          backgroundImage: `url(${optimizedCoverUrl(event.cover || fallbackCover, {
                            width: 480,
                            quality: 72,
                          })})`,
                        }}
                      />
                      <div className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {event.type && <span className="badge max-w-full truncate !px-2 !py-0.5 !text-[10px]">{event.type}</span>}
                          {event.area && <span className="badge max-w-full truncate !px-2 !py-0.5 !text-[10px]">{event.area}</span>}
                          {event.audience && <span className="badge max-w-full truncate !px-2 !py-0.5 !text-[10px]">{event.audience}</span>}
                        </div>
                        <h3 className="mt-2 min-h-10 break-words text-sm font-bold leading-5 text-white">
                          <Link href={`/eventos/${event.slug}`} className="hover:text-brand-500">
                            {event.title}
                          </Link>
                        </h3>
                        <div className="mt-2 space-y-1 text-xs text-slate-300">
                          <p className="flex items-center gap-1.5">
                            <Clock3 className="h-3.5 w-3.5 shrink-0 text-brand-500" />
                            {event.start_time?.slice(0, 5) || 'Horario por confirmar'}
                            {event.end_time ? ` - ${event.end_time.slice(0, 5)}` : ''}
                          </p>
                          <p className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 shrink-0 text-brand-500" />
                            <span className="truncate" title={event.venue || event.area || 'Madrid'}>
                              {event.venue || event.area || 'Madrid'}
                            </span>
                          </p>
                          <p className="flex items-center gap-1.5">
                            <Euro className="h-3.5 w-3.5 shrink-0 text-brand-500" />
                            {formatPrice(event.price_from)}
                          </p>
                        </div>
                        {(event.music || []).length > 0 && (
                          <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                            <Music4 className="h-3.5 w-3.5 shrink-0 text-brand-500" />
                            <span className="truncate" title={(event.music || []).slice(0, 3).join(' · ')}>
                              {(event.music || []).slice(0, 3).join(' · ')}
                            </span>
                          </p>
                        )}
                        <Link
                          href={`/eventos/${event.slug}`}
                          className="mt-3 inline-flex text-xs font-semibold text-brand-500 hover:underline"
                        >
                          Ver ficha →
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-white/10 bg-slate-900 p-8 md:p-10">
            <h2 className="text-2xl font-bold text-white">
              {events.length > 0 ? 'No hay eventos con estos filtros' : 'Agenda en actualización'}
            </h2>
            <p className="mt-3 max-w-2xl leading-7 text-slate-400">
              {events.length > 0
                ? 'Prueba con otros filtros para ver más planes de este fin de semana.'
                : 'Todavía no hay eventos publicados para estas fechas. Vuelve pronto para ver las nuevas incorporaciones.'}
            </p>
            {events.length > 0 && <Link href="/tardeos-madrid-fin-de-semana" className="btn-primary mt-6">Limpiar filtros</Link>}
          </div>
        )}
      </section>

      <section className="border-y border-white/10 bg-slate-900/45">
        <div className="container-page grid gap-8 py-12 md:grid-cols-2 md:py-16">
          <div>
            <h2 className="text-2xl font-bold text-white">Planes de viernes a domingo</h2>
            <p className="mt-4 leading-7 text-slate-300">
              Esta selección se actualiza con las fechas publicadas en TARDEA y agrupa los eventos
              por día para que puedas comparar rápidamente el fin de semana completo.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Comprueba siempre la ficha</h2>
            <p className="mt-4 leading-7 text-slate-300">
              Abre cada evento para revisar su información y acceder al enlace oficial de entradas.
              Los horarios, precios y disponibilidad pueden ser modificados por el organizador.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
