import { NextResponse } from 'next/server'

type ExtractedEvent = {
  title: string
  description: string
  date: string
  startTime: string
  endTime: string
  type: string
  music: string
  venue: string
  area: string
  priceFrom: string
  mapsUrl: string
  sourceName: string
  confidence: 'high' | 'medium' | 'low'
}

const SPANISH_MONTHS: Record<string, string> = {
  enero: '01',
  febrero: '02',
  marzo: '03',
  abril: '04',
  mayo: '05',
  junio: '06',
  julio: '07',
  agosto: '08',
  septiembre: '09',
  setiembre: '09',
  octubre: '10',
  noviembre: '11',
  diciembre: '12',
}

function stripHtml(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&aacute;/g, 'a')
    .replace(/&eacute;/g, 'e')
    .replace(/&iacute;/g, 'i')
    .replace(/&oacute;/g, 'o')
    .replace(/&uacute;/g, 'u')
    .replace(/&ntilde;/g, 'n')
    .replace(/\s+/g, ' ')
    .trim()
}

function metaContent(html: string, property: string) {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i'),
    new RegExp(`<meta[^>]+name=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${escaped}["'][^>]*>`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${escaped}["'][^>]*>`, 'i'),
  ]

  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match?.[1]) return stripHtml(match[1])
  }

  return ''
}

function titleFromUrl(url: string) {
  try {
    const parsed = new URL(url)
    const segments = parsed.pathname
      .split('/')
      .filter(Boolean)
      .map((segment) => decodeURIComponent(segment))
      .filter((segment) => !/^\d+$/.test(segment))

    const bestSegment = segments.reverse().find((segment) => /[a-zA-Z]/.test(segment)) || ''

    return bestSegment
      .replace(/\.(html|php)$/i, '')
      .replace(/[-_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
  } catch {
    return ''
  }
}

function jsonValue(html: string, keys: string[]) {
  for (const key of keys) {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const match = html.match(new RegExp(`"${escaped}"\\s*:\\s*"([^"]+)"`, 'i'))
    if (match?.[1]) return stripHtml(match[1].replace(/\\u([0-9a-f]{4})/gi, (_, code) => String.fromCharCode(parseInt(code, 16))))
  }

  return ''
}

function findJsonLdEvents(html: string) {
  const scripts = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
  const events: any[] = []

  function collect(value: any) {
    if (!value) return
    if (Array.isArray(value)) {
      value.forEach(collect)
      return
    }

    if (value['@graph']) collect(value['@graph'])

    const type = Array.isArray(value['@type']) ? value['@type'] : [value['@type']]
    if (type.some((item: string) => String(item).toLowerCase() === 'event')) {
      events.push(value)
    }
  }

  scripts.forEach((script) => {
    try {
      collect(JSON.parse(script[1].trim()))
    } catch {
      // Some ticketing pages include malformed JSON-LD. In that case we fall back to meta tags.
    }
  })

  return events
}

function normalizeDate(value: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

function normalizeTime(value: string) {
  if (!value) return ''
  const isoTime = value.match(/T(\d{2}:\d{2})/)
  if (isoTime) return isoTime[1]

  const plainTime = value.match(/\b([01]?\d|2[0-3])[:.](\d{2})\b/)
  if (plainTime) return `${plainTime[1].padStart(2, '0')}:${plainTime[2]}`

  return ''
}

function inferDate(text: string) {
  const iso = text.match(/\b(20\d{2})-(0?\d|1[0-2])-(0?\d|[12]\d|3[01])\b/)
  if (iso) return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`

  const slash = text.match(/\b(0?\d|[12]\d|3[01])[/-](0?\d|1[0-2])[/-](20\d{2})\b/)
  if (slash) return `${slash[3]}-${slash[2].padStart(2, '0')}-${slash[1].padStart(2, '0')}`

  const spanish = text.toLowerCase().match(/\b(0?\d|[12]\d|3[01])\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\s+de\s+(20\d{2})\b/)
  if (spanish) return `${spanish[3]}-${SPANISH_MONTHS[spanish[2]]}-${spanish[1].padStart(2, '0')}`

  return ''
}

function inferType(text: string) {
  const lower = text.toLowerCase()
  if (lower.includes('brunch')) return 'Brunch'
  if (lower.includes('rooftop') || lower.includes('terraza')) return 'Rooftop'
  if (lower.includes('afterwork') || lower.includes('after work')) return 'Afterwork'
  if (lower.includes('fitness')) return 'Fitness Party'
  return 'Tardeo'
}

function inferMusic(text: string) {
  const lower = text.toLowerCase()
  const styles = [
    ['Remember', ['remember', '90s', '2000']],
    ['Flamenquito', ['flamenquito', 'flamenco', 'rumba']],
    ['Electronica', ['electronica', 'electro', 'techno', 'house']],
    ['Reguetón', ['reggaeton', 'reguetón', 'regueton', 'urbano', 'urban']],
    ['Indie', ['indie']],
    ['Pop', ['pop']],
    ['Comercial', ['comercial', 'hits']],
  ]

  const found = styles
    .filter(([, keywords]) => (keywords as string[]).some((keyword) => lower.includes(keyword)))
    .map(([style]) => style)

  return found.length ? found.join(', ') : 'Comercial'
}

function inferPrice(text: string) {
  const free = /\bgratis\b|\bfree\b/i.test(text)
  if (free) return '0'

  const price = text.match(/(?:desde\s*)?(\d{1,3})(?:[,.]\d{1,2})?\s?(?:EUR|€)/i)
  return price?.[1] || ''
}

function sourceNameFromUrl(url: string) {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '')
    return hostname.split('.')[0]
  } catch {
    return 'Fuente externa'
  }
}

function eventFromJsonLd(event: any) {
  const location = Array.isArray(event.location) ? event.location[0] : event.location
  const offers = Array.isArray(event.offers) ? event.offers[0] : event.offers

  return {
    title: event.name || '',
    description: stripHtml(event.description || ''),
    date: normalizeDate(event.startDate || ''),
    startTime: normalizeTime(event.startDate || ''),
    endTime: normalizeTime(event.endDate || ''),
    venue: location?.name || '',
    area: location?.address?.addressLocality || location?.address?.addressRegion || 'Madrid',
    priceFrom: offers?.lowPrice?.toString() || offers?.price?.toString() || '',
    mapsUrl: location?.hasMap || '',
  }
}

function countUsefulFields(data: ExtractedEvent) {
  return [
    data.title,
    data.description,
    data.date,
    data.venue,
    data.priceFrom,
  ].filter(Boolean).length
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json()

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Pega primero un enlace valido' }, { status: 400 })
    }

    const parsedUrl = new URL(url)
    const response = await fetch(parsedUrl.toString(), {
      headers: {
        'accept-language': 'es-ES,es;q=0.9,en;q=0.7',
        'user-agent': 'Mozilla/5.0 TARDEA-Admin-Extractor/1.0',
      },
      next: { revalidate: 0 },
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'No se pudo leer ese enlace. Revisa que sea publico.' }, { status: 400 })
    }

    const html = await response.text()
    const jsonLdEvent = findJsonLdEvents(html)[0]
    const fromJsonLd = jsonLdEvent ? eventFromJsonLd(jsonLdEvent) : null
    const titleTag = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || ''
    const text = stripHtml(html).slice(0, 20000)
    const title = fromJsonLd?.title
      || metaContent(html, 'og:title')
      || metaContent(html, 'twitter:title')
      || jsonValue(html, ['name', 'title', 'eventName'])
      || stripHtml(titleTag)
      || titleFromUrl(parsedUrl.toString())
    const description = fromJsonLd?.description
      || metaContent(html, 'og:description')
      || metaContent(html, 'twitter:description')
      || metaContent(html, 'description')
      || jsonValue(html, ['description', 'summary'])

    const data: ExtractedEvent = {
      title,
      description: description || 'Evento importado desde enlace. Revisa y completa la informacion antes de publicarlo.',
      date: fromJsonLd?.date || normalizeDate(jsonValue(html, ['startDate', 'eventDate', 'date'])) || inferDate(`${title} ${description} ${text}`),
      startTime: fromJsonLd?.startTime || normalizeTime(jsonValue(html, ['startDate', 'startTime', 'doorTime'])) || normalizeTime(text) || '18:00',
      endTime: fromJsonLd?.endTime || '23:00',
      type: inferType(`${title} ${description} ${text.slice(0, 2000)}`),
      music: inferMusic(`${title} ${description} ${text.slice(0, 2000)}`),
      venue: fromJsonLd?.venue || jsonValue(html, ['venueName', 'locationName', 'placeName']),
      area: fromJsonLd?.area || 'Madrid',
      priceFrom: fromJsonLd?.priceFrom || inferPrice(text),
      mapsUrl: fromJsonLd?.mapsUrl || '',
      sourceName: sourceNameFromUrl(parsedUrl.toString()),
      confidence: 'low',
    }

    const usefulFields = countUsefulFields(data)
    data.confidence = usefulFields >= 4 ? 'high' : usefulFields >= 2 ? 'medium' : 'low'

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'No se pudo extraer informacion del enlace' }, { status: 400 })
  }
}
