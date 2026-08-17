import { createClient } from '@supabase/supabase-js'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const sourcesArg = args.find((arg) => arg.startsWith('--sources='))
const limitArg = args.find((arg) => arg.startsWith('--limit='))
const platformFilter = args.find((arg) => arg.startsWith('--platform='))?.split('=')[1]?.toLowerCase()
const typeFilter = args.find((arg) => arg.startsWith('--type='))?.split('=')[1]?.toLowerCase()
const cityFilter = args.find((arg) => arg.startsWith('--city='))?.split('=')[1]?.toLowerCase()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!dryRun && (!supabaseUrl || !serviceRoleKey)) {
  throw new Error('Faltan variables NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
}

const supabase = supabaseUrl && serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey) : null

type ScoutSourceType = 'ticketing' | 'instagram' | 'website' | 'manual'

type ScoutSource = {
  source_name: string
  source_type?: ScoutSourceType
  source_url: string
  platform?: string
  city?: string
  province?: string
  municipality?: string
  title?: string
  venue?: string
  area?: string
  address?: string
  maps_url?: string
  date?: string
  start_time?: string
  end_time?: string
  type?: string
  music?: string[]
  audience?: string
  price_from?: number
  external_id?: string
  notes?: string
}

type ScoutConfig = {
  defaults: {
    city: string
    province: string
    municipality: string
    area: string
    audience: string
    start_time: string
    end_time: string
    price_from: number
  }
  allowed_types: string[]
  allowed_music: string[]
  cover_by_type: Record<string, string>
  cover_by_music: Record<string, string>
  type_keywords: Record<string, string[]>
  music_keywords: Record<string, string[]>
}

const defaultConfig: ScoutConfig = {
  defaults: {
    city: 'Madrid',
    province: 'Madrid',
    municipality: 'Madrid',
    area: 'Madrid',
    audience: 'Mixto',
    start_time: '18:00',
    end_time: '23:00',
    price_from: 0,
  },
  allowed_types: ['Tardeo', 'Rooftop', 'Brunch', 'Afterwork'],
  allowed_music: ['Comercial', 'Indie', 'Electronica', 'Flamenquito', 'Pop', 'Remember'],
  cover_by_type: {
    Tardeo: '/scout-covers/tardeo.svg',
    Rooftop: '/scout-covers/rooftop.svg',
    Brunch: '/scout-covers/brunch.svg',
    Afterwork: '/scout-covers/tardeo.svg',
  },
  cover_by_music: {
    Electronica: '/scout-covers/electronica.svg',
    Flamenquito: '/scout-covers/flamenquito.svg',
  },
  type_keywords: {
    Brunch: ['brunch', 'desayuno', 'rooftop brunch'],
    Rooftop: ['rooftop', 'terraza', 'azotea'],
    Afterwork: ['afterwork', 'jueves', 'after work'],
    Tardeo: ['tardeo', 'tardear', 'fiesta tarde'],
  },
  music_keywords: {
    Electronica: ['electronica', 'electrónica', 'techno', 'house', 'dj set'],
    Flamenquito: ['flamenquito', 'rumba', 'flamenco', 'sevillanas'],
    Indie: ['indie', 'alternativo'],
    Remember: ['remember', '90s', '2000', 'clasicos', 'clásicos'],
    Pop: ['pop'],
    Comercial: ['comercial', 'hits', 'reggaeton', 'urbano'],
  },
}

function loadJson<T>(path: string, fallback?: T): T {
  if (!existsSync(path)) {
    if (fallback) return fallback
    throw new Error(`No existe el archivo ${path}`)
  }

  return JSON.parse(readFileSync(path, 'utf8')) as T
}

function normalizeText(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function slugify(text: string) {
  return normalizeText(text)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function shortHash(text: string) {
  return createHash('sha1').update(text).digest('hex').slice(0, 7)
}

function cleanTitle(title: string) {
  return title
    .replace(/\s*\|\s*(Fourvenues|Xceed|Fever|Eventbrite).*$/i, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function getMeta(html: string, property: string) {
  const regex = new RegExp(
    `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["'][^>]*>`,
    'i'
  )

  return html.match(regex)?.[1]?.trim() || ''
}

async function fetchMetadata(source: ScoutSource) {
  if (!source.source_url.startsWith('http')) return {}

  try {
    const response = await fetch(source.source_url, {
      headers: {
        'user-agent': 'Mozilla/5.0 TardeaScout/2.0 (+https://tardea.com)',
      },
    })

    if (!response.ok) return {}

    const html = await response.text()
    return {
      title: cleanTitle(getMeta(html, 'og:title') || getMeta(html, 'twitter:title')),
    }
  } catch {
    return {}
  }
}

function inferFromKeywords(value: string, rules: Record<string, string[]>, fallback: string) {
  const normalized = normalizeText(value)
  const match = Object.entries(rules).find(([, keywords]) =>
    keywords.some((keyword) => normalized.includes(normalizeText(keyword)))
  )

  return match?.[0] || fallback
}

function normalizeMusic(source: ScoutSource, title: string, config: ScoutConfig) {
  const explicit = source.music?.filter((music) => config.allowed_music.includes(music)) || []
  const inferred = inferFromKeywords(`${title} ${source.notes || ''}`, config.music_keywords, 'Comercial')
  return Array.from(new Set(explicit.length ? explicit : [inferred]))
}

function provisionalCoverFor(type: string, music: string[], config: ScoutConfig) {
  const musicCover = music.map((item) => config.cover_by_music[item]).find(Boolean)
  return musicCover || config.cover_by_type[type] || config.cover_by_type.Tardeo || '/scout-covers/tardeo.svg'
}

function validateSource(source: ScoutSource, title: string) {
  const errors: string[] = []

  if (!source.source_url) errors.push('falta source_url')
  if (!title) errors.push('falta titulo')
  if (!source.date) errors.push('falta fecha')
  if (source.date && !/^\d{4}-\d{2}-\d{2}$/.test(source.date)) errors.push('fecha debe ir como YYYY-MM-DD')

  return errors
}

function buildDescription(source: ScoutSource, sourceType: ScoutSourceType) {
  const origin = [source.source_name, source.platform].filter(Boolean).join(' / ')
  const note = source.notes ? ` Nota interna: ${source.notes}` : ''

  return `Evento detectado por TARDEA Scout en ${origin || 'fuente externa'}. Pendiente de revision editorial, imagen definitiva y posible reclamacion del promotor.${note}`
}

async function main() {
  const configPath = resolve(process.cwd(), 'scripts/scout-config.json')
  const sourcesPath = resolve(process.cwd(), sourcesArg?.split('=')[1] || 'scripts/scout-sources.json')
  const config = loadJson<ScoutConfig>(configPath, defaultConfig)
  const allSources = loadJson<ScoutSource[]>(sourcesPath)
  const limit = limitArg ? Number(limitArg.split('=')[1]) : undefined

  const sources = allSources
    .filter((source) => !platformFilter || (source.platform || source.source_name).toLowerCase() === platformFilter)
    .filter((source) => !typeFilter || source.type?.toLowerCase() === typeFilter)
    .filter((source) => !cityFilter || (source.city || config.defaults.city).toLowerCase() === cityFilter)
    .slice(0, limit)

  const report = {
    read: sources.length,
    ready: 0,
    imported: 0,
    skipped: 0,
    byType: new Map<string, number>(),
    byPlatform: new Map<string, number>(),
    errors: [] as string[],
  }

  for (const source of sources) {
    const sourceType = source.source_type || 'ticketing'
    const metadata = await fetchMetadata(source)
    const title = cleanTitle(source.title || metadata.title || '')
    const errors = validateSource(source, title)

    if (errors.length) {
      report.skipped += 1
      report.errors.push(`${source.source_url || 'sin url'}: ${errors.join(', ')}`)
      continue
    }

    const type = source.type && config.allowed_types.includes(source.type)
      ? source.type
      : inferFromKeywords(`${title} ${source.notes || ''}`, config.type_keywords, 'Tardeo')
    const music = normalizeMusic(source, title, config)
    const area = source.area || source.municipality || source.city || config.defaults.area
    const city = source.city || config.defaults.city
    const province = source.province || config.defaults.province
    const platform = source.platform || source.source_name
    const externalId = source.external_id || shortHash(source.source_url)

    const event = {
      title,
      slug: `${slugify(title)}-${source.date}-${shortHash(source.source_url)}`,
      venue: source.venue || 'Pendiente de revisar',
      area,
      address: source.address || `${city}, ${province}`,
      maps_url: source.maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(source.venue || `${city} ${province}`)}`,
      date: source.date,
      start_time: source.start_time || config.defaults.start_time,
      end_time: source.end_time || config.defaults.end_time,
      type,
      music,
      audience: source.audience || config.defaults.audience,
      price_from: source.price_from ?? config.defaults.price_from,
      cover: provisionalCoverFor(type, music, config),
      reel_url: null,
      featured: false,
      description: buildDescription(source, sourceType),
      perks: [type, area, city, platform, ...music].filter(Boolean),
      status: 'pending',
      published: false,
      source_name: `${source.source_name}${sourceType ? ` (${sourceType})` : ''}`,
      source_url: source.source_url,
      external_id: externalId,
      imported_by_agent: true,
      image_status: 'provisional',
      needs_review: true,
    }

    report.ready += 1
    report.byType.set(type, (report.byType.get(type) || 0) + 1)
    report.byPlatform.set(platform, (report.byPlatform.get(platform) || 0) + 1)

    if (dryRun) {
      console.log(`[dry-run] ${event.title} | ${event.date} | ${event.type} | ${event.area} | ${event.source_name}`)
      continue
    }

    const { error } = await supabase!.from('events').upsert(event, {
      onConflict: 'slug',
    })

    if (error) {
      report.errors.push(`${title}: ${error.message}`)
    } else {
      report.imported += 1
      console.log(`Scout guardo para revision: ${title}`)
    }
  }

  console.log('\nResumen TARDEA Scout')
  console.log(`- Leidos: ${report.read}`)
  console.log(`- Listos: ${report.ready}`)
  console.log(`- Importados: ${report.imported}`)
  console.log(`- Omitidos: ${report.skipped}`)
  console.log(`- Por tipo: ${JSON.stringify(Object.fromEntries(report.byType))}`)
  console.log(`- Por plataforma: ${JSON.stringify(Object.fromEntries(report.byPlatform))}`)

  if (report.errors.length) {
    console.log('\nAvisos')
    report.errors.forEach((error) => console.log(`- ${error}`))
  }
}

main()