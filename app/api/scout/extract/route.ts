import { NextResponse } from 'next/server'
import { checkRateLimit, requireAdmin } from '@/lib/server-security'

type ExtractedEvent = {
  sourceUrl?: string
  cover?: string
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

type SearchResult = {
  title: string
  link: string
  snippet: string
}

const serperApiKey = process.env.SERPER_API_KEY

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
  ene: '01',
  feb: '02',
  mar: '03',
  abr: '04',
  may: '05',
  jun: '06',
  jul: '07',
  ago: '08',
  sep: '09',
  sept: '09',
  oct: '10',
  nov: '11',
  dic: '12',
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

function decodeHtml(value: string) {
  return stripHtml(value)
    .replace(/&deg;/g, 'º')
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
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

function inferSpanishDateWithYear(text: string) {
  const match = text.toLowerCase().match(/\b(0?\d|[12]\d|3[01])\s*(?:de\s*)?(ene|enero|feb|febrero|mar|marzo|abr|abril|may|mayo|jun|junio|jul|julio|ago|agosto|sep|sept|septiembre|setiembre|oct|octubre|nov|noviembre|dic|diciembre)(?:\s*(?:de\s*)?(20\d{2}))?\b/)
  if (!match) return ''

  const today = new Date()
  const month = SPANISH_MONTHS[match[2]]
  const explicitYear = match[3]
  let year = explicitYear ? Number(explicitYear) : today.getFullYear()
  const date = `${year}-${month}-${match[1].padStart(2, '0')}`
  const parsed = new Date(`${date}T12:00:00`)

  if (!explicitYear) {
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    if (parsed < thirtyDaysAgo) year += 1
  }

  return `${year}-${month}-${match[1].padStart(2, '0')}`
}

function extractTimes(text: string) {
  const times = [...text.matchAll(/\b([01]?\d|2[0-3])[:.](\d{2})\b/g)]
    .map((match) => `${match[1].padStart(2, '0')}:${match[2]}`)

  return {
    startTime: times[0] || '',
    endTime: times[1] || '',
  }
}

function cleanEventTitle(value: string) {
  return value
    .replace(/\b(?:lunes|martes|miercoles|miércoles|jueves|viernes|sabado|sábado|domingo|lun|mar|mie|mié|jue|vie|sab|sáb|dom)[,.\s]*/gi, ' ')
    .replace(/\b\d{1,2}\s*(?:de\s*)?(?:ene|enero|feb|febrero|mar|marzo|abr|abril|may|mayo|jun|junio|jul|julio|ago|agosto|sep|sept|septiembre|setiembre|oct|octubre|nov|noviembre|dic|diciembre)(?:\s*(?:de\s*)?20\d{2})?\b/gi, ' ')
    .replace(/\b([01]?\d|2[0-3])[:.]\d{2}\b/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^[·:|–—-]+|[·:|–—-]+$/g, '')
    .trim()
}

function absoluteUrl(href: string, baseUrl: string) {
  try {
    return new URL(href, baseUrl).toString()
  } catch {
    return baseUrl
  }
}

function normalizeEventKey(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\b(?:opening|closing|entradas|listas|vips|vip|tickets?|sabado|sab|saturday|sat)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractLinktreeEvents(html: string, baseUrl: string, fallback: ExtractedEvent) {
  if (!/linktr\.ee/i.test(baseUrl)) return []

  const linkMatches = [
    ...html.matchAll(/<a\b(?=[^>]*data-testid=["']LinkClickTriggerLink["'])[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi),
    ...html.matchAll(/<a\b[^>]*href=["']([^"']*fourvenues\.com[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi),
  ]

  const candidates = linkMatches
    .map((match) => {
      const href = absoluteUrl(decodeHtml(match[1]), baseUrl)
      const label = decodeHtml(match[2])
      const date = inferDate(label) || inferSpanishDateWithYear(label)
      const { startTime, endTime } = extractTimes(label)
      const title = cleanEventTitle(label).replace(/\s+\|\s*.*$/g, '').trim() || fallback.title

      if (!date || !title || title.length < 4) return null

      return {
        ...fallback,
        sourceUrl: href,
        title,
        description: fallback.description || 'Evento encontrado desde Linktree. Revisa fecha, cartel y enlace antes de publicarlo.',
        date,
        startTime: startTime || fallback.startTime || '18:00',
        endTime: endTime || fallback.endTime || '23:00',
        type: inferType(`${title} ${label}`),
        music: inferMusic(`${title} ${label}`),
        venue: /samsara/i.test(href) ? 'Samsara' : fallback.venue,
        sourceName: 'Linktree',
        confidence: 'medium' as const,
      }
    })
    .filter(Boolean) as ExtractedEvent[]

  const unique = new Map<string, ExtractedEvent>()
  candidates.forEach((event) => {
    const key = `${normalizeEventKey(event.title)}__${event.date}__${event.sourceUrl || ''}`
    if (!unique.has(key)) unique.set(key, event)
  })

  return Array.from(unique.values()).sort((a, b) => a.date.localeCompare(b.date))
}

function extractLinkedEvents(html: string, baseUrl: string, fallback: ExtractedEvent) {
  const anchorMatches = [...html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)]
  const candidates = anchorMatches
    .map((match) => {
      const href = absoluteUrl(match[1], baseUrl)
      const label = decodeHtml(match[2])
      const date = inferDate(label) || inferSpanishDateWithYear(label)
      const { startTime, endTime } = extractTimes(label)
      const title = cleanEventTitle(label) || fallback.title

      if (!date || !title || title.length < 4) return null

      return {
        ...fallback,
        sourceUrl: href,
        title,
        date,
        startTime: startTime || fallback.startTime,
        endTime: endTime || fallback.endTime,
      }
    })
    .filter(Boolean) as ExtractedEvent[]

  const unique = new Map<string, ExtractedEvent>()
  candidates.forEach((event) => {
    const key = `${normalizeEventKey(event.title)}__${event.date}__${event.sourceUrl || ''}`
    if (!unique.has(key)) unique.set(key, event)
  })

  return Array.from(unique.values())
}

function extractRitaReservationEvents(html: string, baseUrl: string, fallback: ExtractedEvent) {
  if (!/ritalabailaora\.com/i.test(baseUrl)) return []

  const eventParts = html.split('https://ritalabailaora.com/evento/').slice(1)
  const candidates = eventParts
    .map((part) => {
      const slug = part.split('/')[0] || ''
      if (!slug) return null

      const sourceUrl = `https://ritalabailaora.com/evento/${slug}/`
      const textSlug = slug
        .replace(/(\d{1,2})de/g, '$1 de ')
        .replace(/([a-záéíóúñ])(\d{1,2})/gi, '$1 $2')
        .replace(/[-_]+/g, ' ')
      const date = inferSpanishDateWithYear(textSlug)
      if (!date) return null

      const srcIndex = part.indexOf('src="')
      const cover = srcIndex >= 0 ? part.slice(srcIndex + 5).split('"')[0] : ''

      return {
        ...fallback,
        sourceUrl,
        cover,
        title: fallback.title || 'Experiencia Rita la Bailaora',
        description: fallback.description || 'Fecha encontrada en la pagina oficial de reservas de Rita la Bailaora.',
        date,
        startTime: fallback.startTime || '18:00',
        endTime: fallback.endTime || '23:00',
        type: 'Tardeo',
        music: fallback.music || 'Comercial, Pop, Flamenquito, Reguetón',
        venue: fallback.venue || 'Rita la Bailaora',
        area: fallback.area || 'Fuencarral-El Pardo',
        priceFrom: fallback.priceFrom || '12',
        mapsUrl: fallback.mapsUrl || 'https://www.google.com/maps/search/?api=1&query=Pista%20del%20Cristo%20de%20El%20Pardo%203%20Madrid',
        sourceName: 'Rita la Bailaora',
        confidence: 'high' as const,
      }
    })
    .filter(Boolean) as ExtractedEvent[]

  const unique = new Map<string, ExtractedEvent>()
  candidates.forEach((event) => {
    const key = `${event.date}__${event.sourceUrl || ''}`
    if (!unique.has(key)) unique.set(key, event)
  })

  return Array.from(unique.values()).sort((a, b) => a.date.localeCompare(b.date))
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
    ['Show en directo', ['directo', 'live', 'concierto', 'musica en vivo', 'música en vivo', 'banda', 'actuacion', 'actuación']],
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

function inferVenue(text: string, url = '') {
  const lower = `${text} ${url}`.toLowerCase()
  const venues = [
    ['Autocine Madrid', ['autocine madrid', 'autocine']],
    ['Shoko Madrid', ['shoko madrid', 'shoko']],
    ['Florida Park', ['florida park', 'florida parque']],
    ['Samsara', ['samsara']],
    ['Fitz', ['fitz']],
    ['La Palm Tropic', ['la palm tropic', 'palm tropic']],
  ]

  const match = venues.find(([, keywords]) => (keywords as string[]).some((keyword) => lower.includes(keyword)))
  return match ? String(match[0]) : ''
}

function inferAreaFromVenue(venue: string, text: string) {
  const lower = `${venue} ${text}`.toLowerCase()
  if (lower.includes('shoko')) return 'Centro'
  if (lower.includes('autocine')) return 'Chamartín'
  if (lower.includes('florida park') || lower.includes('retiro')) return 'Retiro'
  if (lower.includes('fitz') || lower.includes('moncloa')) return 'Madrid'
  return 'Madrid'
}

function mapsUrlForVenue(venue: string) {
  if (!venue) return ''
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${venue} Madrid`)}`
}

function sourceNameFromUrl(url: string) {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '')
    return hostname.split('.')[0]
  } catch {
    return 'Fuente externa'
  }
}

async function searchSerper(query: string): Promise<SearchResult[]> {
  if (!serperApiKey) return []

  const response = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: {
      'X-API-KEY': serperApiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ q: query, gl: 'es', hl: 'es', num: 10 }),
  })

  if (!response.ok) return []

  const data = await response.json()
  return (data.organic || []).map((item: any) => ({
    title: item.title || '',
    link: item.link || '',
    snippet: item.snippet || '',
  }))
}

async function fallbackEventsFromSearch(url: URL) {
  const basePath = `${url.origin}${url.pathname}`.replace(/\/$/, '')
  const sourceTitle = titleFromUrl(url.toString()) || url.pathname.split('/').filter(Boolean).pop() || 'evento'
  const sourceName = sourceNameFromUrl(url.toString())
  const queries = [
    `site:${basePath}`,
    `"${sourceTitle}" entradas`,
    `"${sourceTitle}" fourvenues`,
  ]
  const results = (await Promise.all(queries.map(searchSerper))).flat()
  const seen = new Set<string>()
  const events: ExtractedEvent[] = []

  for (const result of results) {
    if (!result.link || seen.has(result.link)) continue
    seen.add(result.link)

    const text = `${result.title} ${result.snippet}`

    const date = inferDate(text) || inferSpanishDateWithYear(text)
    const { startTime, endTime } = extractTimes(text)
    const title = cleanEventTitle(result.title.replace(/\|\s*.*$/g, '')) || sourceTitle
    const venue = inferVenue(text, result.link)
    const area = inferAreaFromVenue(venue, text)

    if (!date || !title) continue

    events.push({
      sourceUrl: result.link,
      title,
      description: result.snippet || 'Evento importado desde resultados publicos. Revisa la informacion antes de publicarlo.',
      date,
      startTime: startTime || '18:00',
      endTime: endTime || '23:00',
      type: inferType(text),
      music: inferMusic(text),
      venue,
      area,
      priceFrom: inferPrice(text) || '0',
      mapsUrl: mapsUrlForVenue(venue),
      sourceName,
      confidence: 'medium',
    })
  }

  const unique = new Map<string, ExtractedEvent>()
  events.forEach((event) => {
    const key = `${normalizeEventKey(event.title)}__${normalizeEventKey(event.venue)}__${event.date}__${event.sourceUrl || ''}`
    if (!unique.has(key)) unique.set(key, event)
  })

  return Array.from(unique.values()).sort((a, b) => a.date.localeCompare(b.date))
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
  const rateLimit = checkRateLimit(request, 'scout-extract', 20, 60_000)
  if (!rateLimit.ok) {
    return NextResponse.json({ error: 'Demasiados intentos. Prueba de nuevo en un minuto.' }, { status: 429 })
  }

  const admin = await requireAdmin(request)
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: 401 })
  }

  try {
    const { url } = await request.json()

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Pega primero un enlace valido' }, { status: 400 })
    }

    const parsedUrl = new URL(url)
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return NextResponse.json({ error: 'El enlace debe ser http o https' }, { status: 400 })
    }

    const blockedHosts = ['localhost', '127.0.0.1', '0.0.0.0']
    if (blockedHosts.includes(parsedUrl.hostname)) {
      return NextResponse.json({ error: 'Ese enlace no esta permitido' }, { status: 400 })
    }

    const response = await fetch(parsedUrl.toString(), {
      headers: {
        'accept-language': 'es-ES,es;q=0.9,en;q=0.7',
        'user-agent': 'Mozilla/5.0 TARDEA-Admin-Extractor/1.0',
      },
      next: { revalidate: 0 },
    })

    if (!response.ok) {
      const fallbackEvents = await fallbackEventsFromSearch(parsedUrl)
      if (fallbackEvents.length > 0) {
        const firstEvent = fallbackEvents[0]
        return NextResponse.json({
          ...firstEvent,
          sourceUrl: parsedUrl.toString(),
          sourceName: sourceNameFromUrl(parsedUrl.toString()),
          description: firstEvent.description || 'Eventos encontrados por busqueda publica porque la tiquetera bloqueo la lectura directa.',
          events: fallbackEvents,
          confidence: 'medium',
        })
      }

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
      sourceUrl: parsedUrl.toString(),
      cover: metaContent(html, 'og:image') || metaContent(html, 'twitter:image'),
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
    const linktreeEvents = extractLinktreeEvents(html, parsedUrl.toString(), data)
    const ritaEvents = extractRitaReservationEvents(html, parsedUrl.toString(), data)
    const linkedEvents = extractLinkedEvents(html, parsedUrl.toString(), data)
    const events = linktreeEvents.length > 0 ? linktreeEvents : ritaEvents.length > 0 ? ritaEvents : linkedEvents

    return NextResponse.json({
      ...data,
      events: events.length > 1 ? events : [],
    })
  } catch (error) {
    console.error('Scout extract error', error)
    return NextResponse.json({ error: 'No se pudo extraer informacion del enlace' }, { status: 400 })
  }
}
