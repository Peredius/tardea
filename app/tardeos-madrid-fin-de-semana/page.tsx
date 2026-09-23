import type { Metadata } from 'next'
import { Footer } from '@/components/Footer'
import { Navbar } from '@/components/Navbar'
import { WeekendAgenda, type WeekendEvent } from '@/components/WeekendAgenda'
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

async function getWeekendEvents(friday: string, sunday: string) {
  const { data } = await supabase
    .from('events')
    .select(
      'id, slug, title, venue, area, address, maps_url, date, start_time, end_time, type, music, audience, price_from, cover'
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
        <div className="container-page py-8 md:py-10">
          <p className="text-sm font-semibold uppercase text-brand-500">Viernes, sábado y domingo</p>
          <h1 className="mt-2 max-w-5xl text-3xl font-bold text-white md:text-4xl">
            Tardeos en Madrid este fin de semana
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-300">
            Planes publicados del {formatLongDate(friday)} al {formatLongDate(sunday)}, con horarios,
            zonas, música, ambiente y precios para comparar antes de elegir.
          </p>
        </div>
      </section>

      <WeekendAgenda events={events} friday={friday} sunday={sunday} />

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
