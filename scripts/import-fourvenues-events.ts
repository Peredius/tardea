import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Faltan variables NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

type SourceEvent = {
  url: string
  venue: string
  area: string
  address: string
  maps_url: string
  type: string
  music: string[]
  audience: string
  price_from: number
  featured?: boolean
  fallbackTitle: string
  fallbackDate: string
  fallbackStartTime: string
  fallbackEndTime: string
}

const sources: SourceEvent[] = [
  {
    url: 'https://site.fourvenues.com/es/yatengoplan/events/yatengobrunch-rooftop-16-05-2026-L1VC',
    venue: 'Yatengoplan',
    area: 'Madrid',
    address: 'Madrid, España',
    maps_url: 'https://www.google.com/maps/search/?api=1&query=Yatengoplan%20Madrid',
    type: 'Brunch',
    music: ['Comercial'],
    audience: '+24',
    price_from: 0,
    featured: true,
    fallbackTitle: 'YATENGOBRUNCH: ROOFTOP',
    fallbackDate: '2026-05-16',
    fallbackStartTime: '15:00',
    fallbackEndTime: '23:00',
  },
  {
    url: 'https://site.fourvenues.com/es/discotecas-madrid/events/B8EG',
    venue: 'Marabú',
    area: 'Ponzano',
    address: 'Calle de Ponzano, 37, 28003 Madrid, España',
    maps_url: 'https://www.google.com/maps/search/?api=1&query=Calle%20de%20Ponzano%2037%20Madrid',
    type: 'Afterwork',
    music: ['Comercial'],
    audience: '+23',
    price_from: 15,
    featured: true,
    fallbackTitle: 'TARDEO JUEVES MARABÚ',
    fallbackDate: '2026-05-28',
    fallbackStartTime: '20:00',
    fallbackEndTime: '05:30',
  },
  {
    url: 'https://site.fourvenues.com/es/discotecas-madrid/events/7QK1',
    venue: 'La Vuelta',
    area: 'Chamartín',
    address: 'Calle de María de Molina, 41, Chamartín, 28006 Madrid, España',
    maps_url: 'https://www.google.com/maps/search/?api=1&query=Calle%20de%20Maria%20de%20Molina%2041%20Madrid',
    type: 'Tardeo',
    music: ['Comercial'],
    audience: '+18',
    price_from: 0,
    featured: true,
    fallbackTitle: 'LA VUELTA-TARDEO',
    fallbackDate: '2026-05-22',
    fallbackStartTime: '18:00',
    fallbackEndTime: '01:30',
  },
  {
    url: 'https://site.fourvenues.com/es/sala-b/events/tardeo-canon--sala-b--23-05-2026-6SCN',
    venue: 'Sala B Madrid',
    area: 'Chamberí',
    address: 'Calle de Trafalgar, 6, 28010 Madrid, España',
    maps_url: 'https://www.google.com/maps/search/?api=1&query=Calle%20de%20Trafalgar%206%20Madrid',
    type: 'Tardeo',
    music: ['Comercial'],
    audience: '+27',
    price_from: 18,
    fallbackTitle: 'TARDEO CAÑÓN | Sala B',
    fallbackDate: '2026-05-23',
    fallbackStartTime: '18:00',
    fallbackEndTime: '23:00',
  },
  {
    url: 'https://site.fourvenues.com/es/hi-music-events/events/pompa-tardeo-club---florida-park-02-05-2026-T2CP',
    venue: 'Florida Park',
    area: 'Retiro',
    address: 'Paseo de Panamá, 28009 Madrid, España',
    maps_url: 'https://www.google.com/maps/search/?api=1&query=Florida%20Park%20Madrid',
    type: 'Tardeo',
    music: ['Comercial'],
    audience: '+25',
    price_from: 0,
    featured: true,
    fallbackTitle: 'POMPÄ Tardeo Club - Florida Park',
    fallbackDate: '2026-05-02',
    fallbackStartTime: '18:00',
    fallbackEndTime: '23:30',
  },
  {
    url: 'https://site.fourvenues.com/es/discotecas-madrid/events/tardeo-mix-02-05-2026-11IZ',
    venue: 'Samsara',
    area: 'Centro',
    address: 'C. de la Cruz, 7, 28012 Madrid, España',
    maps_url: 'https://www.google.com/maps/search/?api=1&query=Calle%20de%20la%20Cruz%207%20Madrid',
    type: 'Tardeo',
    music: ['Comercial'],
    audience: '+18',
    price_from: 0,
    fallbackTitle: 'TARDEO MIX',
    fallbackDate: '2026-05-02',
    fallbackStartTime: '18:00',
    fallbackEndTime: '23:00',
  },
  {
    url: 'https://site.fourvenues.com/en/voy/events/tardeo-mix-09-05-2026-5FY4',
    venue: 'Samsara',
    area: 'Centro',
    address: 'C. de la Cruz, 7, 28012 Madrid, España',
    maps_url: 'https://www.google.com/maps/search/?api=1&query=Calle%20de%20la%20Cruz%207%20Madrid',
    type: 'Tardeo',
    music: ['Comercial'],
    audience: '+18',
    price_from: 0,
    fallbackTitle: 'TARDEO MIX',
    fallbackDate: '2026-05-09',
    fallbackStartTime: '18:00',
    fallbackEndTime: '23:00',
  },
  {
    url: 'https://site.fourvenues.com/es/xiringuito-madrid/events/tardeo-xiringuito-01-05-2026-3HA8',
    venue: 'Xiringuito Madrid',
    area: 'Alcorcón',
    address: 'Calle Oslo 53, Centro Comercial X, local 061, 28922 Madrid, España',
    maps_url: 'https://www.google.com/maps/search/?api=1&query=Calle%20Oslo%2053%20Alcorcon',
    type: 'Tardeo',
    music: ['Comercial'],
    audience: '+18',
    price_from: 0,
    fallbackTitle: 'TARDEO XIRINGUITO',
    fallbackDate: '2026-05-01',
    fallbackStartTime: '19:00',
    fallbackEndTime: '02:00',
  },
  {
    url: 'https://site.fourvenues.com/es/xiringuito-madrid/events/tardeo-chuoos-09-05-2026-L70G',
    venue: 'Xiringuito Madrid',
    area: 'Alcorcón',
    address: 'Calle Oslo 53, Centro Comercial X, local 061, 28922 Madrid, España',
    maps_url: 'https://www.google.com/maps/search/?api=1&query=Calle%20Oslo%2053%20Alcorcon',
    type: 'Tardeo',
    music: ['Comercial'],
    audience: '+18',
    price_from: 0,
    fallbackTitle: 'TARDEO CHUOOS',
    fallbackDate: '2026-05-09',
    fallbackStartTime: '19:00',
    fallbackEndTime: '02:00',
  },
  {
    url: 'https://site.fourvenues.com/es/discotecas-madrid/events/orygen-x-el-tardeo-electronico-02-05-2026-IFIZ',
    venue: 'Orygen',
    area: 'Tetuán',
    address: 'C. de Rosario Pino, 14, 28020 Madrid, España',
    maps_url: 'https://www.google.com/maps/search/?api=1&query=Calle%20Rosario%20Pino%2014%20Madrid',
    type: 'Tardeo',
    music: ['Electrónica'],
    audience: '+18',
    price_from: 0,
    fallbackTitle: 'ORYGEN x EL TARDEO ELECTRÓNICO',
    fallbackDate: '2026-05-02',
    fallbackStartTime: '17:30',
    fallbackEndTime: '23:00',
  },
  {
    url: 'https://site.fourvenues.com/es/discotecas-madrid/events/after-party-tardeo-electronico-02-05-2026-0YZZ',
    venue: 'Madrid',
    area: 'Salamanca',
    address: 'Calle de Juan Bravo, 35, Salamanca, 28006 Madrid, España',
    maps_url: 'https://www.google.com/maps/search/?api=1&query=Calle%20Juan%20Bravo%2035%20Madrid',
    type: 'Tardeo',
    music: ['Electrónica'],
    audience: '+18',
    price_from: 0,
    fallbackTitle: 'AFTER PARTY TARDEO ELECTRÓNICO',
    fallbackDate: '2026-05-02',
    fallbackStartTime: '00:00',
    fallbackEndTime: '06:00',
  },
  {
    url: 'https://site.fourvenues.com/es/discotecas-madrid/events/experiencia-rita-la-bailaora-09-05-2026-MKX9',
    venue: 'Rita la Bailaora',
    area: 'Fuencarral-El Pardo',
    address: 'Pista del Cristo de El Pardo, 3, Fuencarral-El Pardo, 28048 Madrid, España',
    maps_url: 'https://www.google.com/maps/search/?api=1&query=Pista%20del%20Cristo%20de%20El%20Pardo%203%20Madrid',
    type: 'Tardeo',
    music: ['Comercial'],
    audience: '+18',
    price_from: 12,
    featured: true,
    fallbackTitle: 'Experiencia Rita la Bailaora',
    fallbackDate: '2026-05-09',
    fallbackStartTime: '18:00',
    fallbackEndTime: '01:00',
  },
  {
    url: 'https://site.fourvenues.com/es/discotecas-madrid/events/ZR4A',
    venue: 'Rita la Bailaora',
    area: 'Fuencarral-El Pardo',
    address: 'Pista del Cristo de El Pardo, 3, Fuencarral-El Pardo, 28048 Madrid, España',
    maps_url: 'https://www.google.com/maps/search/?api=1&query=Pista%20del%20Cristo%20de%20El%20Pardo%203%20Madrid',
    type: 'Tardeo',
    music: ['Comercial'],
    audience: '+18',
    price_from: 0,
    fallbackTitle: 'Domingueo Rita la Bailaora',
    fallbackDate: '2026-05-17',
    fallbackStartTime: '13:00',
    fallbackEndTime: '23:00',
  },
  {
    url: 'https://site.fourvenues.com/es/fiestas-legendarias-madrid/events/tardeo-rumbeo-actuacion-david-de-paloma-09-05-2026-V5BV',
    venue: 'La Cartuja',
    area: 'Centro',
    address: 'Calle de la Cruz, 10, 28012 Madrid, España',
    maps_url: 'https://www.google.com/maps/search/?api=1&query=Calle%20de%20la%20Cruz%2010%20Madrid',
    type: 'Tardeo',
    music: ['Flamenquito', 'Comercial'],
    audience: '+18',
    price_from: 0,
    fallbackTitle: 'TARDEO RUMBEO ACTUACIÓN DAVID DE PALOMA',
    fallbackDate: '2026-05-09',
    fallbackStartTime: '18:00',
    fallbackEndTime: '23:00',
  },
  {
    url: 'https://site.fourvenues.com/es/discotecas-madrid/events/tardear--la-mejor-fiesta-de-espana-09-05-2026-MRPY',
    venue: 'Houdinni Madrid',
    area: 'Madrid',
    address: 'Madrid, España',
    maps_url: 'https://www.google.com/maps/search/?api=1&query=Houdinni%20Madrid',
    type: 'Tardeo',
    music: ['Comercial'],
    audience: '+18',
    price_from: 0,
    featured: true,
    fallbackTitle: 'TardeAR® ~ La mejor fiesta de España',
    fallbackDate: '2026-05-09',
    fallbackStartTime: '18:00',
    fallbackEndTime: '23:00',
  },
]

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

  const match = html.match(regex)
  return match?.[1]?.trim() || ''
}

function getTitleFromHtml(html: string) {
  const ogTitle = getMeta(html, 'og:title')
  if (ogTitle) return ogTitle.replace(/\s*\|\s*Fourvenues.*$/i, '').trim()

  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i)
  return titleMatch?.[1]?.replace(/\s*\|\s*Fourvenues.*$/i, '').trim() || ''
}

function getDateFromUrl(url: string) {
  const match = url.match(/(\d{2})-(\d{2})-(\d{4})/)
  if (!match) return ''

  const [, day, month, year] = match
  return `${year}-${month}-${day}`
}

async function fetchFourvenues(source: SourceEvent) {
  const response = await fetch(source.url, {
    headers: {
      'user-agent': 'Mozilla/5.0 TardeaBot/1.0',
    },
  })

  const html = await response.text()

  const scrapedTitle = getTitleFromHtml(html)

const title =
  scrapedTitle && !scrapedTitle.toLowerCase().includes('hang on a sec')
    ? scrapedTitle
    : source.fallbackTitle
  const description =
    getMeta(html, 'description') ||
    getMeta(html, 'og:description') ||
    `Evento en ${source.venue}`

  const cover = getMeta(html, 'og:image') || ''
  const date = getDateFromUrl(source.url) || source.fallbackDate

  return {
    title,
    slug: slugify(title, date),
    venue: source.venue,
    area: source.area,
    address: source.address,
    maps_url: source.maps_url,
    date,
    start_time: source.fallbackStartTime,
    end_time: source.fallbackEndTime,
    type: source.type,
    music: source.music,
    audience: source.audience,
    price_from: source.price_from,
    cover,
    featured: source.featured || false,
    description,
    perks: [source.type, source.area, ...source.music],
    status: 'approved',
    published: true,
    source_url: source.url,
  }
}

async function main() {
  for (const source of sources) {
    try {
      const event = await fetchFourvenues(source)

      const { error } = await supabase
        .from('events')
        .upsert(event, { onConflict: 'slug' })

      if (error) {
        console.error(`Error importando ${event.title}:`, error.message)
      } else {
        console.log(`Importado: ${event.title}`)
      }
    } catch (error) {
      console.error(`Error leyendo ${source.url}:`, error)
    }
  }
}

main()
