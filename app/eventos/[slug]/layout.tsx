import type { Metadata } from 'next'
import { supabase } from '@/lib/supabase'
import { eventStructuredData } from '@/lib/event-structured-data'

type EventSeoData = {
  slug: string
  title: string
  venue: string | null
  area: string | null
  date: string
  start_time: string | null
  end_time: string | null
  description: string | null
  cover: string | null
  address: string | null
  price_from: number | null
  source_url: string | null
  perks: string[] | null
  event_profile_id: string | null
  published: boolean
  status: string
}

async function getEvent(slug: string) {
  const { data } = await supabase
    .from('events')
    .select(
      'slug, title, venue, area, date, start_time, end_time, description, cover, address, price_from, source_url, perks, event_profile_id, published, status'
    )
    .eq('slug', slug)
    .eq('published', true)
    .eq('status', 'approved')
    .maybeSingle()

  return data as EventSeoData | null
}

function eventDescription(event: EventSeoData) {
  const date = new Date(`${event.date}T12:00:00`).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const details = [event.venue, event.area, date].filter(Boolean).join(' · ')
  const description = event.description?.trim() || `Consulta horario, precio y entradas para ${event.title}.`

  return `${description} ${details}`.slice(0, 160)
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const event = await getEvent(params.slug)

  if (!event) {
    return {
      title: 'Evento no encontrado',
      robots: { index: false, follow: false },
    }
  }

  const title = `${event.title}${event.venue ? ` en ${event.venue}` : ''}`
  const canonical = `/eventos/${event.slug}`
  const description = eventDescription(event)

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${title} | TARDEA`,
      description,
      url: canonical,
      type: 'website',
      images: event.cover ? [{ url: event.cover, alt: event.title }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | TARDEA`,
      description,
      images: event.cover ? [event.cover] : undefined,
    },
  }
}

export default async function EventLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { slug: string }
}) {
  const event = await getEvent(params.slug)
  const { data: organizer } = event?.event_profile_id
    ? await supabase
        .from('promoter_event_profiles')
        .select('name, website_url')
        .eq('id', event.event_profile_id)
        .maybeSingle()
    : { data: null }
  const eventJsonLd = event ? eventStructuredData(event, organizer) : null

  return (
    <>
      {eventJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd).replace(/</g, '\\u003c') }}
        />
      )}
      {children}
    </>
  )
}
