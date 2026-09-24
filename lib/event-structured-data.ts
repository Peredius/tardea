import { getEventPerformers } from './event-performers'

export type StructuredEvent = {
  slug: string
  title: string
  venue: string | null
  area: string | null
  address: string | null
  date: string
  start_time: string | null
  end_time: string | null
  description: string | null
  cover: string | null
  price_from: number | null
  source_url: string | null
  perks?: string[] | null
}

export type EventOrganizer = {
  name: string
  website_url: string | null
}

function nextDay(date: string) {
  const day = new Date(`${date}T12:00:00Z`)
  day.setUTCDate(day.getUTCDate() + 1)
  return day.toISOString().slice(0, 10)
}

function localDateTime(date: string, time: string) {
  // Google accepts local event time without an offset and derives the zone from the venue.
  return `${date}T${time.slice(0, 8)}`
}

function ticketPage(url: string | null) {
  if (!url) return false
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' && /\/(?:events?|eventos|tickets?)\/[^/]+/i.test(parsed.pathname)
  } catch {
    return false
  }
}

function organizerUrl(url: string | null) {
  if (!url || ticketPage(url)) return undefined
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:' || /(^|\.)google\.[^/]+$/i.test(parsed.hostname)) return undefined
    return url
  } catch {
    return undefined
  }
}

export function eventStructuredData(event: StructuredEvent, organizer: EventOrganizer | null) {
  const endDate = event.end_time && event.start_time && event.end_time < event.start_time
    ? nextDay(event.date)
    : event.date
  const hasTicketOffer = ticketPage(event.source_url) && event.price_from !== null && event.price_from > 0
  const performers = getEventPerformers(event.perks)

  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: event.description || undefined,
    image: event.cover ? [event.cover] : undefined,
    startDate: event.start_time ? localDateTime(event.date, event.start_time) : event.date,
    endDate: event.end_time ? localDateTime(endDate, event.end_time) : undefined,
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
    organizer: organizer?.name
      ? {
          '@type': 'Organization',
          name: organizer.name,
          url: organizerUrl(organizer.website_url),
        }
      : undefined,
    ...(performers.length > 0
      ? { performer: performers.map((performer) => ({ '@type': performer.type, name: performer.name })) }
      : {}),
    offers: hasTicketOffer
      ? {
          '@type': 'Offer',
          url: event.source_url,
          price: event.price_from,
          priceCurrency: 'EUR',
        }
      : undefined,
    url: `https://www.tardea.com/eventos/${event.slug}`,
  }
}
