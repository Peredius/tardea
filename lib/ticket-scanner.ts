type SupabaseClientLike = {
  from: (table: string) => any
}

type EventProfile = {
  id: string
  user_id: string | null
  name: string | null
  slug: string | null
  venue_name: string | null
  address: string | null
  municipality: string | null
  province: string | null
  type: string | null
  music: string[] | string | null
  audience: string | null
  description: string | null
  source_url: string | null
  website_url: string | null
}

type ExistingEvent = {
  id: string
  event_profile_id: string | null
  date: string | null
  source_url: string | null
  title: string | null
  venue?: string | null
  area?: string | null
  address?: string | null
  maps_url?: string | null
  price_from?: number | null
  cover?: string | null
}

type FoundTicketEvent = {
  title: string
  date: string
  startTime: string
  endTime: string
  sourceUrl: string
  cover?: string
  description?: string
  priceFrom?: number
  venue?: string
  address?: string
}

type CreatedTicketEvent = {
  id: string
  title: string
  date: string
  sourceUrl: string
}

export type TicketScannerProfileResult = {
  profileId: string
  profileName: string
  checkedUrls: string[]
  found: number
  added: CreatedTicketEvent[]
  skipped: number
  error?: string
}

export type TicketScannerResult = {
  checkedProfiles: number
  checkedUrls: number
  addedCount: number
  results: TicketScannerProfileResult[]
}

const ADMIN_USER_ID = '11085f92-ef44-4cc2-be56-c18801a57680'

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
    .replace(/&#039;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

function todayMadridIso() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())

  const year = parts.find((part) => part.type === 'year')?.value || ''
  const month = parts.find((part) => part.type === 'month')?.value || ''
  const day = parts.find((part) => part.type === 'day')?.value || ''
  return `${year}-${month}-${day}`
}

function isUpcomingDate(date: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && date >= todayMadridIso()
}

function normalizeTime(value: string, fallback = '18:00') {
  const iso = value.match(/T(\d{2}:\d{2})/)
  if (iso?.[1]) return iso[1]
  const plain = value.match(/\b([01]?\d|2[0-3])[:.](\d{2})\b/)
  if (plain) return `${plain[1].padStart(2, '0')}:${plain[2]}`
  return fallback
}

function inferSpanishDate(text: string) {
  const normalized = stripHtml(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  const iso = normalized.match(/\b(20\d{2})[-/](\d{1,2})[-/](\d{1,2})\b/)
  if (iso) return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`

  const spanish = normalized.match(/\b(\d{1,2})\s*(?:de\s*)?([a-z]+)\s*(?:de\s*)?(20\d{2})\b/)
  if (!spanish) return ''

  const month = SPANISH_MONTHS[spanish[2]]
  if (!month) return ''

  return `${spanish[3]}-${month}-${spanish[1].padStart(2, '0')}`
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
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

function jsonLdEvents(html: string) {
  const events: any[] = []
  const scripts = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]

  function collect(value: any) {
    if (!value) return
    if (Array.isArray(value)) {
      value.forEach(collect)
      return
    }
    if (value['@graph']) collect(value['@graph'])
    const types = Array.isArray(value['@type']) ? value['@type'] : [value['@type']]
    if (types.some((type) => String(type).toLowerCase() === 'event')) events.push(value)
  }

  scripts.forEach((script) => {
    try {
      collect(JSON.parse(script[1].trim()))
    } catch {
      // Ignore malformed JSON-LD and keep using link/date fallbacks.
    }
  })

  return events
}

function eventFromJsonLd(event: any, sourceUrl: string): FoundTicketEvent | null {
  const date = String(event.startDate || '').slice(0, 10)
  if (!isUpcomingDate(date)) return null

  const offer = event.offers || {}
  const image = Array.isArray(event.image) ? event.image[0] : event.image
  const location = event.location || {}
  const address = location.address?.streetAddress
    ? [location.address.streetAddress, location.address.addressLocality, location.address.addressRegion].filter(Boolean).join(', ')
    : ''

  return {
    title: stripHtml(String(event.name || 'Tardeo')),
    date,
    startTime: normalizeTime(String(event.startDate || ''), '18:00'),
    endTime: normalizeTime(String(event.endDate || ''), '23:00'),
    sourceUrl: String(event.url || sourceUrl),
    cover: image ? String(image) : undefined,
    description: stripHtml(String(event.description || '')),
    priceFrom: Number(offer.lowPrice || offer.price || 0) || 0,
    venue: location.name ? stripHtml(String(location.name)) : undefined,
    address: address || undefined,
  }
}

function extractLinks(html: string, baseUrl: string) {
  return [...html.matchAll(/href=["']([^"']+)["']/gi)]
    .map((match) => {
      try {
        return new URL(match[1], baseUrl).toString()
      } catch {
        return ''
      }
    })
    .filter(Boolean)
}

function candidateEventLinks(html: string, baseUrl: string) {
  const base = new URL(baseUrl)
  const links = extractLinks(html, baseUrl).filter((link) => {
    try {
      const url = new URL(link)
      if (url.hostname !== base.hostname) return false
      return /\/event|\/events|\/evento|occurrence=/i.test(url.pathname + url.search)
    } catch {
      return false
    }
  })

  return Array.from(new Set(links)).slice(0, 30)
}

function fallbackEventFromUrl(url: string, profile: EventProfile): FoundTicketEvent | null {
  const decoded = decodeURIComponent(url)
  const date = inferSpanishDate(decoded)
  if (!isUpcomingDate(date)) return null

  return {
    title: profile.name || 'Tardeo',
    date,
    startTime: '18:00',
    endTime: '23:00',
    sourceUrl: url,
  }
}

async function fetchHtml(url: string) {
  const response = await fetch(url, {
    redirect: 'follow',
    headers: {
      'user-agent': 'Mozilla/5.0 TardeaBot/1.0 (+https://tardea.com)',
      accept: 'text/html,application/xhtml+xml',
    },
  })
  const html = await response.text()
  return { finalUrl: response.url, html, ok: response.ok }
}

async function extractEventsFromUrl(url: string, profile: EventProfile): Promise<FoundTicketEvent[]> {
  const { finalUrl, html } = await fetchHtml(url)
  const text = stripHtml(html)

  const jsonEvents = jsonLdEvents(html)
    .map((event) => eventFromJsonLd(event, finalUrl))
    .filter(Boolean) as FoundTicketEvent[]

  const linkEvents = candidateEventLinks(html, finalUrl)
    .map((link) => fallbackEventFromUrl(link, profile))
    .filter(Boolean) as FoundTicketEvent[]

  const calendarEvents = [...text.matchAll(/Eventos para\s+(\d{1,2}\s+\w+)[\s\S]{0,240}?(RITA(?:'|&#8217;|’)?S MIRADOR|TARDEO|FASCINADO|INDEPENDANCE|RITA LA BAILAORA)[\s\S]{0,120}?(?:Riyadh|Rubicon|Madrid|Bailaora)/gi)]
    .map((match) => {
      const date = inferSpanishDate(`${match[1]} 2026`)
      if (!isUpcomingDate(date)) return null
      return {
        title: profile.name || stripHtml(match[2]),
        date,
        startTime: normalizeTime(match[0], '20:00'),
        endTime: /mirador/i.test(match[0]) ? '00:00' : '23:00',
        sourceUrl: finalUrl,
        cover: metaContent(html, 'og:image') || undefined,
      }
    })
    .filter(Boolean) as FoundTicketEvent[]

  if (jsonEvents.length || linkEvents.length || calendarEvents.length) {
    const unique = new Map<string, FoundTicketEvent>()
    ;[...jsonEvents, ...linkEvents, ...calendarEvents].forEach((event) => {
      const key = `${event.date}__${event.sourceUrl}`
      if (!unique.has(key)) unique.set(key, event)
    })
    return Array.from(unique.values()).filter((event) => isUpcomingDate(event.date))
  }

  const fallback = fallbackEventFromUrl(finalUrl, profile)
  return fallback ? [fallback] : []
}

function profileSources(profile: EventProfile, events: ExistingEvent[]) {
  const urls = [
    profile.source_url,
    profile.website_url,
    ...events.map((event) => event.source_url),
  ]
    .filter((url): url is string => Boolean(url && /^https?:\/\//i.test(url)))
    .filter((url) => /whan\.es|fourvenues\.com|entradium\.com|ritas\.es|ritalabailaora\.com|independanceclub\.com/i.test(url))

  const normalized = urls.map((url) => {
    try {
      const parsed = new URL(url)
      parsed.hash = ''
      return parsed.toString()
    } catch {
      return url
    }
  })

  return Array.from(new Set(normalized)).slice(0, 8)
}

function hasExistingDate(existingEvents: ExistingEvent[], found: FoundTicketEvent) {
  return existingEvents.some((event) => event.date === found.date)
}

function eventPayload(profile: EventProfile, found: FoundTicketEvent, existingEvents: ExistingEvent[]) {
  const referenceEvent =
    existingEvents.find((event) => event.date && event.date >= todayMadridIso()) ||
    existingEvents.find((event) => event.area || event.address || event.cover)
  const title = profile.name || found.title || 'Tardeo'
  const venue = profile.venue_name || found.venue || referenceEvent?.venue || title
  const description =
    found.description ||
    profile.description ||
    `Nueva fecha encontrada automaticamente desde la tiquetera de ${title}.`

  return {
    user_id: profile.user_id || ADMIN_USER_ID,
    event_profile_id: profile.id,
    title,
    slug: `${slugify(profile.slug || title)}-${found.date}`,
    type: profile.type || 'Tardeo',
    venue,
    area: referenceEvent?.area || '',
    address: profile.address || found.address || referenceEvent?.address || '',
    maps_url: referenceEvent?.maps_url || '',
    date: found.date,
    start_time: found.startTime,
    end_time: found.endTime,
    music: Array.isArray(profile.music)
      ? profile.music
      : typeof profile.music === 'string'
        ? profile.music.split(',').map((item) => item.trim()).filter(Boolean)
        : ['Comercial'],
    audience: profile.audience || 'Todos',
    price_from: found.priceFrom ?? referenceEvent?.price_from ?? 0,
    cover: found.cover || referenceEvent?.cover || null,
    image_status: found.cover || referenceEvent?.cover ? 'source' : 'pending_cover',
    description,
    perks: ['Fecha encontrada automaticamente', 'Revision de tiquetera'],
    source_url: found.sourceUrl,
    source_name: new URL(found.sourceUrl).hostname.replace(/^www\./, ''),
    website_url: found.sourceUrl,
    status: 'approved',
    published: true,
    profile_reviewed: true,
    needs_review: false,
    imported_by_agent: true,
    external_id: `ticket-scanner:${profile.id}:${found.date}`,
  }
}

async function loadProfiles(serviceClient: SupabaseClientLike) {
  const { data, error } = await serviceClient
    .from('promoter_event_profiles')
    .select('id,user_id,name,slug,venue_name,address,municipality,province,type,music,audience,description,source_url,website_url')
    .eq('is_active', true)
    .order('updated_at', { ascending: false })
    .limit(80)

  if (error) throw error
  return (data || []) as EventProfile[]
}

async function loadExistingEvents(serviceClient: SupabaseClientLike, profileIds: string[]) {
  if (profileIds.length === 0) return [] as ExistingEvent[]
  const { data, error } = await serviceClient
    .from('events')
    .select('id,event_profile_id,date,source_url,title,venue,area,address,maps_url,price_from,cover')
    .in('event_profile_id', profileIds)

  if (error) throw error
  return (data || []) as ExistingEvent[]
}

export async function runTicketScanner(serviceClient: SupabaseClientLike): Promise<TicketScannerResult> {
  const profiles = await loadProfiles(serviceClient)
  const existingEvents = await loadExistingEvents(serviceClient, profiles.map((profile) => profile.id))
  const eventsByProfile = new Map<string, ExistingEvent[]>()

  existingEvents.forEach((event) => {
    if (!event.event_profile_id) return
    eventsByProfile.set(event.event_profile_id, [...(eventsByProfile.get(event.event_profile_id) || []), event])
  })

  const results: TicketScannerProfileResult[] = []

  for (const profile of profiles) {
    const profileEvents = eventsByProfile.get(profile.id) || []
    const sources = profileSources(profile, profileEvents)
    if (sources.length === 0) continue

    const result: TicketScannerProfileResult = {
      profileId: profile.id,
      profileName: profile.name || profile.venue_name || 'Ficha sin nombre',
      checkedUrls: sources,
      found: 0,
      added: [],
      skipped: 0,
    }

    try {
      const foundEvents: FoundTicketEvent[] = []
      for (const source of sources) {
        const extracted = await extractEventsFromUrl(source, profile)
        foundEvents.push(...extracted)
      }

      const unique = new Map<string, FoundTicketEvent>()
      foundEvents.forEach((event) => {
        const key = `${event.date}__${event.sourceUrl}`
        if (!unique.has(key)) unique.set(key, event)
      })

      result.found = unique.size

      for (const found of unique.values()) {
        const currentProfileEvents = eventsByProfile.get(profile.id) || []

        if (hasExistingDate([...currentProfileEvents, ...result.added.map((event) => ({ id: event.id, event_profile_id: profile.id, date: event.date, source_url: event.sourceUrl, title: event.title }))], found)) {
          result.skipped += 1
          continue
        }

        const { data, error } = await serviceClient
          .from('events')
          .insert(eventPayload(profile, found, currentProfileEvents))
          .select('id,title,date,source_url')
          .single()

        if (error) throw error
        result.added.push({
          id: data.id,
          title: data.title,
          date: data.date,
          sourceUrl: data.source_url,
        })
      }
    } catch (error: any) {
      result.error = error?.message || 'No se pudo revisar esta ficha.'
    }

    results.push(result)
  }

  return {
    checkedProfiles: results.length,
    checkedUrls: results.reduce((sum, result) => sum + result.checkedUrls.length, 0),
    addedCount: results.reduce((sum, result) => sum + result.added.length, 0),
    results,
  }
}
