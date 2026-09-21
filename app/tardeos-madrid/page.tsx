import type { Metadata } from 'next'
import Link from 'next/link'
import { CalendarDays, Clock3, Euro, MapPin, Music4 } from 'lucide-react'
import { Footer } from '@/components/Footer'
import { Navbar } from '@/components/Navbar'
import { optimizedCoverUrl } from '@/lib/images'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Tardeos en Madrid: próximos eventos, fechas y entradas',
  description:
    'Descubre tardeos en Madrid por fecha, zona, música, edad y precio. Consulta próximos eventos, horarios, ubicaciones y enlaces oficiales de entradas.',
  alternates: {
    canonical: '/tardeos-madrid',
  },
  openGraph: {
    title: 'Tardeos en Madrid: próximos eventos, fechas y entradas | TARDEA',
    description:
      'Agenda actualizada de tardeos en Madrid con horarios, zonas, música, precios y entradas.',
    url: '/tardeos-madrid',
    type: 'website',
    images: ['/logotardeaweb.png'],
  },
}

type TardeoEvent = {
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
  description: string | null
  event_profile_id: string | null
}

const fallbackCover =
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=76'

const faqs = [
  {
    question: '¿Dónde encontrar tardeos en Madrid?',
    answer:
      'En TARDEA puedes consultar tardeos en distintas zonas de Madrid y abrir cada ficha para ver el local, la dirección y el enlace de ubicación.',
  },
  {
    question: '¿Cómo saber qué tardeos hay este fin de semana?',
    answer:
      'La agenda muestra las próximas fechas publicadas. También puedes usar el calendario de TARDEA para seleccionar uno o varios días concretos.',
  },
  {
    question: '¿Hay tardeos gratis en Madrid?',
    answer:
      'Algunos eventos tienen entrada gratuita y otros requieren entrada. El precio disponible aparece en cada ficha y debe confirmarse en el enlace oficial del evento.',
  },
  {
    question: '¿Puedo filtrar por música, edad o zona?',
    answer:
      'Sí. El buscador de TARDEA permite combinar filtros de tipo de evento, música, ambiente de edad, precio y zona de Madrid.',
  },
]

function normalizePlanName(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\b\d{1,2}\s*(de\s*)?(ene|enero|feb|febrero|mar|marzo|abr|abril|may|mayo|jun|junio|jul|julio|ago|agosto|sep|septiembre|oct|octubre|nov|noviembre|dic|diciembre)\b/g, '')
    .replace(/\b\d{1,2}[/-]\d{1,2}([/-]\d{2,4})?\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function eventKey(event: TardeoEvent) {
  return event.event_profile_id || `${normalizePlanName(event.title)}:${normalizePlanName(event.venue || '')}`
}

function formatDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

function formatPrice(value: number | null) {
  if (value === 0) return 'Gratis'
  if (typeof value === 'number') return `Desde ${value} €`
  return 'Consultar precio'
}

async function getUpcomingTardeos() {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Madrid' })
  const { data } = await supabase
    .from('events')
    .select(
      'id, slug, title, venue, area, date, start_time, end_time, type, music, audience, price_from, cover, description, event_profile_id'
    )
    .eq('published', true)
    .eq('status', 'approved')
    .gte('date', today)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true })
    .limit(500)

  const uniqueEvents = new Map<string, TardeoEvent>()
  ;((data || []) as TardeoEvent[]).forEach((event) => {
    const key = eventKey(event)
    if (!uniqueEvents.has(key)) uniqueEvents.set(key, event)
  })

  return Array.from(uniqueEvents.values()).slice(0, 18)
}

export default async function TardeosMadridPage() {
  const events = await getUpcomingTardeos()
  const pageUrl = 'https://www.tardea.com/tardeos-madrid'

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Próximos tardeos en Madrid',
    itemListElement: events.map((event, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: event.title,
      url: `https://www.tardea.com/eventos/${event.slug}`,
    })),
  }

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <Navbar />

      <section className="border-b border-white/10 bg-slate-900/55">
        <div className="container-page py-12 md:py-16">
          <p className="text-sm font-semibold uppercase text-brand-500">Agenda de Madrid</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-bold text-white md:text-6xl">
            Tardeos en Madrid
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300 md:text-lg">
            Encuentra próximos eventos de tarde en Madrid y compara fechas, zonas, música,
            ambiente y precio antes de elegir tu plan.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/tardeos-madrid-fin-de-semana" className="btn-primary">
              Ver este fin de semana
            </Link>
            <Link href="/#eventos" className="btn-primary">
              Buscar por fecha y filtros
            </Link>
            <Link href="#proximos-tardeos" className="btn-secondary">
              Ver próximos tardeos
            </Link>
          </div>
        </div>
      </section>

      <section id="proximos-tardeos" className="container-page scroll-mt-24 py-12 md:py-16">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-brand-500">Próximas fechas</p>
            <h2 className="mt-2 text-3xl font-bold text-white">Tardeos destacados en Madrid</h2>
          </div>
          <p className="text-sm text-slate-400">Información y entradas en cada ficha</p>
        </div>

        {events.length > 0 ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
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
                      <CalendarDays className="h-4 w-4 shrink-0 text-brand-500" />
                      <span className="capitalize">{formatDate(event.date)}</span>
                    </p>
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
                    Ver fecha, ubicación y entradas →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-lg border border-white/10 bg-slate-900 p-8">
            <p className="text-slate-300">
              Estamos actualizando la agenda. Mientras tanto, utiliza el buscador para consultar
              las fechas disponibles.
            </p>
          </div>
        )}
      </section>

      <section className="border-y border-white/10 bg-slate-900/45">
        <div className="container-page grid gap-10 py-12 md:grid-cols-2 md:py-16">
          <div>
            <h2 className="text-3xl font-bold text-white">Cómo elegir tu tardeo</h2>
            <p className="mt-4 leading-7 text-slate-300">
              No todos los planes de tarde tienen el mismo ambiente. Antes de comprar una entrada,
              revisa la música, la edad habitual del público, el horario, la zona y el precio que
              aparecen en la ficha.
            </p>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white">Zonas y estilos</h2>
            <p className="mt-4 leading-7 text-slate-300">
              La agenda incluye planes en Centro, Salamanca, Chamberí, Retiro, Moncloa, Tetuán y
              otras zonas. Puedes encontrar reguetón, música comercial, pop, remember, electrónica
              y propuestas para diferentes edades.
            </p>
          </div>
        </div>
      </section>

      <section className="container-page py-12 md:py-16">
        <h2 className="text-3xl font-bold text-white">Preguntas sobre los tardeos en Madrid</h2>
        <div className="mt-7 divide-y divide-white/10 border-y border-white/10">
          {faqs.map((faq) => (
            <details key={faq.question} className="group py-5">
              <summary className="cursor-pointer list-none pr-8 text-lg font-semibold text-white">
                {faq.question}
              </summary>
              <p className="mt-3 max-w-4xl leading-7 text-slate-400">{faq.answer}</p>
            </details>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link href="/" className="btn-primary">
            Abrir el buscador de TARDEA
          </Link>
          <a href={pageUrl} className="text-sm text-slate-500">
            Agenda de tardeos en Madrid
          </a>
        </div>
      </section>

      <Footer />
    </main>
  )
}
