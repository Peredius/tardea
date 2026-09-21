import type { Metadata } from 'next'
import Link from 'next/link'
import { CalendarDays, Clock3, Euro, MapPin, Music4 } from 'lucide-react'
import { Footer } from '@/components/Footer'
import { Navbar } from '@/components/Navbar'
import { optimizedCoverUrl } from '@/lib/images'
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

export default async function WeekendTardeosPage() {
  const { friday, sunday } = getWeekendRange()
  const events = await getWeekendEvents(friday, sunday)
  const groupedEvents = events.reduce<Record<string, WeekendEvent[]>>((groups, event) => {
    groups[event.date] = [...(groups[event.date] || []), event]
    return groups
  }, {})

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Tardeos en Madrid este fin de semana',
    itemListElement: events.map((event, index) => ({
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
        <div className="container-page py-12 md:py-16">
          <p className="text-sm font-semibold uppercase text-brand-500">Viernes, sábado y domingo</p>
          <h1 className="mt-3 max-w-5xl text-4xl font-bold text-white md:text-6xl">
            Tardeos en Madrid este fin de semana
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300 md:text-lg">
            Planes publicados del {formatLongDate(friday)} al {formatLongDate(sunday)}, con horarios,
            zonas, música, ambiente y precios para comparar antes de elegir.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="#agenda-fin-de-semana" className="btn-primary">
              Ver la agenda
            </Link>
            <Link href="/tardeos-madrid" className="btn-secondary">
              Ver todos los tardeos
            </Link>
          </div>
        </div>
      </section>

      <section id="agenda-fin-de-semana" className="container-page scroll-mt-24 py-12 md:py-16">
        {events.length > 0 ? (
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

                <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {dateEvents.map((event) => (
                    <article
                      key={event.id}
                      className="overflow-hidden rounded-lg border border-white/10 bg-slate-900"
                    >
                      <Link
                        href={`/eventos/${event.slug}`}
                        aria-label={`Ver ${event.title}`}
                        className="block aspect-[16/10] bg-cover bg-center"
                        style={{
                          backgroundImage: `url(${optimizedCoverUrl(event.cover || fallbackCover, {
                            width: 720,
                            quality: 72,
                          })})`,
                        }}
                      />
                      <div className="p-5">
                        <div className="flex flex-wrap gap-2">
                          {event.type && <span className="badge">{event.type}</span>}
                          {event.area && <span className="badge">{event.area}</span>}
                          {event.audience && <span className="badge">{event.audience}</span>}
                        </div>
                        <h3 className="mt-4 text-xl font-bold text-white">
                          <Link href={`/eventos/${event.slug}`} className="hover:text-brand-500">
                            {event.title}
                          </Link>
                        </h3>
                        <div className="mt-4 space-y-2 text-sm text-slate-300">
                          <p className="flex items-center gap-2">
                            <Clock3 className="h-4 w-4 shrink-0 text-brand-500" />
                            {event.start_time?.slice(0, 5) || 'Horario por confirmar'}
                            {event.end_time ? ` - ${event.end_time.slice(0, 5)}` : ''}
                          </p>
                          <p className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 shrink-0 text-brand-500" />
                            {event.venue || event.area || 'Madrid'}
                          </p>
                          <p className="flex items-center gap-2">
                            <Euro className="h-4 w-4 shrink-0 text-brand-500" />
                            {formatPrice(event.price_from)}
                          </p>
                        </div>
                        {(event.music || []).length > 0 && (
                          <p className="mt-4 flex items-start gap-2 text-sm text-slate-400">
                            <Music4 className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                            {(event.music || []).slice(0, 3).join(' · ')}
                          </p>
                        )}
                        <Link
                          href={`/eventos/${event.slug}`}
                          className="mt-5 inline-flex font-semibold text-brand-500 hover:underline"
                        >
                          Ver ubicación y entradas →
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
            <h2 className="text-2xl font-bold text-white">Agenda en actualización</h2>
            <p className="mt-3 max-w-2xl leading-7 text-slate-400">
              Todavía no hay eventos publicados para estas fechas. Consulta la agenda completa o
              vuelve pronto para ver las nuevas incorporaciones.
            </p>
            <Link href="/tardeos-madrid" className="btn-primary mt-6">
              Consultar todos los tardeos
            </Link>
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
