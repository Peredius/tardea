import type { Metadata } from 'next'
import { supabase } from '@/lib/supabase'

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
  published: boolean
  status: string
}

async function getEvent(slug: string) {
  const { data } = await supabase
    .from('events')
    .select(
      'slug, title, venue, area, date, start_time, end_time, description, cover, address, price_from, source_url, published, status'
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

  const eventJsonLd = event
    ? {
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: event.title,
        description: event.description || undefined,
        image: event.cover ? [event.cover] : undefined,
        startDate: `${event.date}T${event.start_time || '17:00:00'}+02:00`,
        endDate: event.end_time ? `${event.date}T${event.end_time}+02:00` : undefined,
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        eventStatus: 'https://schema.org/EventScheduled',
        location: {
          '@type': 'Place',
          name: event.venue || event.area || 'Madrid',
          address: {
            '@type': 'PostalAddress',
            streetAddress: event.address || undefined,
            addressLocality: 'Madrid',
            addressCountry: 'ES',
          },
        },
        offers: event.source_url
          ? {
              '@type': 'Offer',
              url: event.source_url,
              price: event.price_from ?? undefined,
              priceCurrency: 'EUR',
              availability: 'https://schema.org/InStock',
            }
          : undefined,
        url: `https://www.tardea.com/eventos/${event.slug}`,
      }
    : null

  return (
    <>
      {eventJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }}
        />
      )}
      {children}
    </>
  )
}
