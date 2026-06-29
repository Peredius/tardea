import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Faltan variables NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

type ScoutSource = {
  source_name: string
  source_url: string
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
}

const provisionalCovers: Record<string, string> = {
  brunch: '/scout-covers/brunch.svg',
  rooftop: '/scout-covers/rooftop.svg',
  electronica: '/scout-covers/electronica.svg',
  electrónica: '/scout-covers/electronica.svg',
  flamenquito: '/scout-covers/flamenquito.svg',
  tardeo: '/scout-covers/tardeo.svg',
}

function slugify(text: string, date: string) {
  const clean = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return `${clean}-${date}`
}

function getMeta(html: string, property: string) {
  const regex = new RegExp(
    `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["'][^>]*>`,
    'i'
  )

  return html.match(regex)?.[1]?.trim() || ''
}

function cleanTitle(title: string) {
  return title
    .replace(/\s*\|\s*(Fourvenues|Xceed|Fever|Eventbrite).*$/i, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function provisionalCoverFor(source: ScoutSource) {
  const musicKey = source.music?.[0]?.toLowerCase() || ''
  const typeKey = source.type?.toLowerCase() || ''
  return provisionalCovers[musicKey] || provisionalCovers[typeKey] || provisionalCovers.tardeo
}

async function fetchMetadata(source: ScoutSource) {
  try {
    const response = await fetch(source.source_url, {
      headers: {
        'user-agent': 'Mozilla/5.0 TardeaScout/1.0 (+https://tardea.com)',
      },
    })

    if (!response.ok) return {}

    const html = await response.text()
    return {
      title: cleanTitle(getMeta(html, 'og:title') || getMeta(html, 'twitter:title')),
      description: getMeta(html, 'og:description') || getMeta(html, 'description'),
    }
  } catch {
    return {}
  }
}

async function main() {
  const sourcesPath = resolve(process.cwd(), 'scripts/scout-sources.json')
  const sources = JSON.parse(readFileSync(sourcesPath, 'utf8')) as ScoutSource[]

  for (const source of sources) {
    const metadata = await fetchMetadata(source)
    const title = source.title || metadata.title || 'Evento pendiente de revisar'
    const date = source.date || new Date().toISOString().split('T')[0]
    const type = source.type || 'Tardeo'
    const music = source.music?.length ? source.music : ['Comercial']

    const event = {
      title,
      slug: slugify(title, date),
      venue: source.venue || 'Pendiente de revisar',
      area: source.area || 'Madrid',
      address: source.address || 'Pendiente de revisar',
      maps_url: source.maps_url || null,
      date,
      start_time: source.start_time || '18:00',
      end_time: source.end_time || '23:00',
      type,
      music,
      audience: source.audience || 'Mixto',
      price_from: source.price_from ?? 0,
      cover: provisionalCoverFor({ ...source, type, music }),
      reel_url: null,
      featured: false,
      description:
        metadata.description ||
        `Evento encontrado por TARDEA Scout en ${source.source_name}. Pendiente de revision editorial.`,
      perks: [type, source.area || 'Madrid', ...music].filter(Boolean),
      status: 'pending',
      published: false,
      source_name: source.source_name,
      source_url: source.source_url,
      external_id: source.external_id || source.source_url,
      imported_by_agent: true,
      image_status: 'provisional',
      needs_review: true,
    }

    const { error } = await supabase.from('events').upsert(event, {
      onConflict: 'slug',
    })

    if (error) {
      console.error(`Error importando ${title}: ${error.message}`)
    } else {
      console.log(`Scout guardo para revision: ${title}`)
    }
  }
}

main()
