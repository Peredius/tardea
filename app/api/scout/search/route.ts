import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

type ScoutPlatform = {
  platform: string
  priority: number
  source_type: string
  search_patterns: string[]
  best_for: string[]
}

type SearchResult = {
  title: string
  link: string
  snippet?: string
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const serperApiKey = process.env.SERPER_API_KEY

const typeKeywords: Record<string, string[]> = {
  Brunch: ['brunch', 'desayuno'],
  Rooftop: ['rooftop', 'terraza', 'azotea'],
  Afterwork: ['afterwork', 'after work', 'networking'],
  'Fitness Party': ['fitness', 'running', 'yoga', 'wellness'],
  Tardeo: ['tardeo', 'tardear', 'fiesta tarde', 'club', 'party'],
}

const typeSearchTerms: Record<string, string[]> = {
  Tardeo: ['tardeo', 'fiesta tarde', 'tardear'],
  Rooftop: ['rooftop', 'terraza', 'azotea'],
  Brunch: ['brunch'],
  Afterwork: ['afterwork', 'after work'],
  'Fitness Party': ['fitness party', 'wellness party', 'running club'],
}

const musicKeywords: Record<string, string[]> = {
  Electronica: ['electronica', 'electrónica', 'techno', 'house', 'dj set'],
  Flamenquito: ['flamenquito', 'flamenco', 'rumba', 'sevillanas'],
  Indie: ['indie', 'alternativo'],
  Remember: ['remember', '90s', '2000', 'clasicos', 'clásicos'],
  Pop: ['pop'],
  Comercial: ['comercial', 'hits', 'reggaeton', 'urbano', 'tardeo'],
}

const spanishMonths: Record<string, string> = {
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

const monthNames = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
]

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function slugify(text: string) {
  return normalize(text)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function shortHash(text: string) {
  return createHash('sha1').update(text).digest('hex').slice(0, 8)
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
    .replace(/\s+/g, ' ')
    .trim()
}

function cleanTitle(title: string) {
  return stripHtml(title)
    .replace(/\s*\|\s*(Fourvenues|Xceed|Fever|Eventbrite|Entradium|Ticketmaster|See Tickets).*$/i, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function canSearch(pattern: string) {
  return !pattern.includes('hashtags:') && !pattern.includes('[web sala]') && !pattern.includes('[nombre')
}

function readPlatforms() {
  const path = resolve(process.cwd(), 'scripts/scout-platforms.json')
  return JSON.parse(readFileSync(path, 'utf8')) as ScoutPlatform[]
}

function inferFromKeywords(text: string, rules: Record<string, string[]>, fallback: string) {
  const normalized = normalize(text)
  const match = Object.entries(rules).find(([, keywords]) =>
    keywords.some((keyword) => normalized.includes(normalize(keyword)))
  )

  return match?.[0] || fallback
}

function inferType(platform: ScoutPlatform, text: string) {
  const inferred = inferFromKeywords(text, typeKeywords, '')
  if (inferred) return inferred
  if (platform.best_for.includes('Brunch')) return 'Brunch'
  if (platform.best_for.includes('Rooftop')) return 'Rooftop'
  return 'Tardeo'
}

function platformMatchesType(platform: ScoutPlatform, type: string) {
  if (!type || type === 'Todos') return true
  const text = `${platform.best_for.join(' ')} ${platform.search_patterns.join(' ')}`
  return normalize(text).includes(normalize(type)) || typeSearchTerms[type]?.some((term) => normalize(text).includes(normalize(term)))
}

function patternMatchesType(pattern: string, type: string) {
  if (!type || type === 'Todos') return true
  return typeSearchTerms[type]?.some((term) => normalize(pattern).includes(normalize(term))) || false
}

function inferMusic(text: string) {
  return [inferFromKeywords(text, musicKeywords, 'Comercial')]
}

function inferPrice(text: string) {
  if (/\bgratis\b|\bfree\b/i.test(text)) return 0
  const match = text.match(/(?:desde\s*)?(\d{1,3})(?:[,.]\d{1,2})?\s?(?:EUR|€)/i)
  return match?.[1] ? Number(match[1]) : 0
}

function normalizeDate(value: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

function inferDate(text: string) {
  const iso = text.match(/\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b/)
  if (iso) return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`

  const numeric = text.match(/\b(\d{1,2})[/-](\d{1,2})(?:[/-](20\d{2}|\d{2}))?\b/)
  if (numeric) {
    const year = numeric[3] ? (numeric[3].length === 2 ? `20${numeric[3]}` : numeric[3]) : new Date().getFullYear().toString()
    return `${year}-${numeric[2].padStart(2, '0')}-${numeric[1].padStart(2, '0')}`
  }

  const written = normalize(text).match(/\b(\d{1,2})\s+(?:de\s+)?(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)(?:\s+(?:de\s+)?(20\d{2}))?\b/)
  if (written) {
    const year = written[3] || new Date().getFullYear().toString()
    return `${year}-${spanishMonths[written[2]]}-${written[1].padStart(2, '0')}`
  }

  return ''
}

function normalizeTime(value: string) {
  const match = value.match(/\b([01]?\d|2[0-3])[:.](\d{2})\b/)
  return match ? `${match[1].padStart(2, '0')}:${match[2]}` : ''
}

function isBetween(date: string, startDate: string, endDate: string) {
  return date >= startDate && date <= endDate
}

async function searchSerper(query: string, limitPerQuery: number): Promise<SearchResult[]> {
  const response = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: {
      'X-API-KEY': serperApiKey!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ q: query, gl: 'es', hl: 'es', num: limitPerQuery }),
  })

  if (!response.ok) throw new Error(`Serper respondio ${response.status}`)

  const data = await response.json()
  return (data.organic || []).map((item: any) => ({
    title: item.title || '',
    link: item.link || '',
    snippet: item.snippet || '',
  }))
}

function datesBetween(startDate: string, endDate: string) {
  const dates: Date[] = []
  const current = new Date(`${startDate}T12:00:00`)
  const end = new Date(`${endDate}T12:00:00`)

  while (current <= end) {
    dates.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }

  return dates
}

function buildSearchQueries(platforms: ScoutPlatform[], startDate: string, endDate: string, eventType: string) {
  const dates = datesBetween(startDate, endDate)
  const monthLabels = Array.from(
    new Set(dates.map((date) => `${monthNames[date.getMonth()]} ${date.getFullYear()}`))
  )
  const dayLabels = dates.flatMap((date) => {
    const day = date.getDate()
    const month = monthNames[date.getMonth()]
    const year = date.getFullYear()

    return [`"${day} ${month}"`, `"${day} de ${month}"`, `"${day} ${month} ${year}"`]
  })
  const typeTerms = eventType === 'Todos'
    ? ['tardeo', 'brunch', 'rooftop', 'afterwork']
    : typeSearchTerms[eventType] || [eventType]
  const queries: { platform: ScoutPlatform; query: string }[] = []

  platforms.forEach((platform) => {
    platform.search_patterns
      .filter(canSearch)
      .filter((pattern) => patternMatchesType(pattern, eventType))
      .forEach((pattern) => {
        monthLabels.forEach((monthLabel) => {
          queries.push({ platform, query: `${pattern} entradas Madrid ${monthLabel}` })
          queries.push({ platform, query: `${pattern} eventos Madrid ${monthLabel}` })
        })

        typeTerms.slice(0, 2).forEach((term) => {
          monthLabels.forEach((monthLabel) => {
            queries.push({ platform, query: `${pattern} ${term} Madrid ${monthLabel}` })
          })
        })

        dayLabels.forEach((dayLabel) => {
          queries.push({ platform, query: `${pattern} ${dayLabel} Madrid entradas` })
        })
      })
  })

  const seen = new Set<string>()
  return queries.filter(({ query }) => {
    const key = normalize(query)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
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

function jsonValue(html: string, keys: string[]) {
  for (const key of keys) {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const match = html.match(new RegExp(`"${escaped}"\\s*:\\s*"([^"]+)"`, 'i'))
    if (match?.[1]) return stripHtml(match[1])
  }

  return ''
}

async function fetchDetails(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        'accept-language': 'es-ES,es;q=0.9,en;q=0.7',
        'user-agent': 'Mozilla/5.0 TARDEA-Scout/1.0',
      },
    })

    if (!response.ok) return {}

    const html = await response.text()
    const titleTag = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || ''
    const text = stripHtml(html).slice(0, 12000)

    return {
      title: cleanTitle(metaContent(html, 'og:title') || metaContent(html, 'twitter:title') || stripHtml(titleTag)),
      description: metaContent(html, 'og:description') || metaContent(html, 'description') || '',
      date: normalizeDate(jsonValue(html, ['startDate', 'eventDate', 'date'])) || inferDate(text),
      startTime: normalizeTime(jsonValue(html, ['startDate', 'startTime', 'doorTime']) || text),
      endTime: normalizeTime(jsonValue(html, ['endDate', 'endTime'])) || '',
      venue: jsonValue(html, ['venueName', 'locationName', 'placeName']),
      priceFrom: inferPrice(text),
      text,
    }
  } catch {
    return {}
  }
}

async function assertAdmin(request: Request) {
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return { error: 'Faltan claves de Supabase en el servidor' }
  }

  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return { error: 'Sesion no valida' }

  const authClient = createClient(supabaseUrl, anonKey)
  const {
    data: { user },
    error,
  } = await authClient.auth.getUser(token)

  if (error || !user) return { error: 'Sesion no valida' }

  const serviceClient = createClient(supabaseUrl, serviceRoleKey)
  const { data: profile } = await serviceClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') return { error: 'No tienes permisos de admin' }

  return { serviceClient }
}

export async function POST(request: Request) {
  const admin = await assertAdmin(request)
  if ('error' in admin) return NextResponse.json({ error: admin.error }, { status: 401 })

  if (!serperApiKey) {
    return NextResponse.json({ error: 'Falta SERPER_API_KEY en Vercel para buscar eventos automaticamente' }, { status: 400 })
  }

  try {
    const body = await request.json()
    const startDate = body.startDate
    const endDate = body.endDate
    const eventType = typeof body.eventType === 'string' ? body.eventType : 'Todos'
    const maxResults = Number(body.maxResults || 50)
    const limitPerQuery = Number(body.limitPerQuery || 4)
    const maxQueries = Number(body.maxQueries || 70)

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Selecciona una semana para buscar' }, { status: 400 })
    }

    const platforms = readPlatforms()
      .filter((platform) => platform.search_patterns.some(canSearch))
      .filter((platform) => platformMatchesType(platform, eventType))
      .sort((a, b) => a.priority - b.priority)

    const queries = buildSearchQueries(platforms, startDate, endDate, eventType).slice(0, maxQueries)

    const seen = new Set<string>()
    const events: any[] = []
    const byPlatform: Record<string, number> = {}
    let skipped = 0
    let searchesRun = 0

    for (const { platform, query } of queries) {
      if (events.length >= maxResults) break

      searchesRun += 1
      const results = await searchSerper(query, limitPerQuery)

      for (const result of results) {
        if (events.length >= maxResults) break
        if (!result.link || seen.has(result.link)) continue
        seen.add(result.link)

        const details: any = await fetchDetails(result.link)
        const text = `${result.title} ${result.snippet || ''} ${details.title || ''} ${details.description || ''} ${details.text || ''}`
        const date = details.date || inferDate(text)

        if (!date || !isBetween(date, startDate, endDate)) {
          skipped += 1
          continue
        }

        const title = cleanTitle(details.title || result.title)
        if (!title) {
          skipped += 1
          continue
        }

        const type = eventType === 'Todos' ? inferType(platform, text) : eventType
        const music = inferMusic(text)
        const eventHash = shortHash(`${result.link}-${date}`)

        events.push({
          title,
          slug: `${slugify(title)}-${date}-${eventHash}`,
          venue: details.venue || 'Pendiente de revisar',
          area: 'Madrid',
          address: 'Madrid, Madrid',
          maps_url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(details.venue || 'Madrid')}`,
          date,
          start_time: details.startTime || '18:00',
          end_time: details.endTime || '23:00',
          type,
          music,
          audience: 'Mixto',
          price_from: details.priceFrom || inferPrice(text),
          cover: music[0] === 'Electronica'
            ? '/scout-covers/electronica.svg'
            : type === 'Brunch'
              ? '/scout-covers/brunch.svg'
              : type === 'Rooftop'
                ? '/scout-covers/rooftop.svg'
                : '/scout-covers/tardeo.svg',
          reel_url: null,
          featured: false,
          description: `Evento detectado por TARDEA Scout en ${platform.platform}. Pendiente de revision editorial, imagen definitiva y posible reclamacion del promotor. Fuente: ${result.link}`,
          perks: [type, 'Madrid', platform.platform, ...music],
          status: 'pending',
          published: false,
          source_name: `${platform.platform} (${platform.source_type})`,
          source_url: result.link,
          external_id: eventHash,
          imported_by_agent: true,
          image_status: 'provisional',
          needs_review: true,
        })

        byPlatform[platform.platform] = (byPlatform[platform.platform] || 0) + 1
      }
    }

    if (events.length === 0) {
      return NextResponse.json({
        imported: 0,
        skipped,
        searchesRun,
        byPlatform,
        message: `No se encontraron eventos con fecha clara para esa semana. Busquedas realizadas: ${searchesRun}`,
      })
    }

    const { error } = await admin.serviceClient.from('events').upsert(events, { onConflict: 'slug' })

    if (error) {
      return NextResponse.json({ error: `Error guardando eventos: ${error.message}` }, { status: 400 })
    }

    return NextResponse.json({
      imported: events.length,
      skipped,
      searchesRun,
      byPlatform,
      message: `${events.length} eventos ${eventType === 'Todos' ? '' : `de ${eventType} `}reales encontrados y enviados a revision`,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudo buscar eventos' },
      { status: 400 }
    )
  }
}
