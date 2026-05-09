import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, serviceRoleKey)

const events = [
  {
    title: 'TARDEO JUEVES MARABÚ',
    slug: 'tardeo-jueves-marabu-2026-05-28',
    venue: 'Marabú',
    area: 'Ponzano',
    address: 'Calle de Ponzano, 37, 28003 Madrid, España',
    maps_url:
      'https://www.google.com/maps/search/?api=1&query=Calle%20de%20Ponzano%2037%20Madrid',
    date: '2026-05-28',
    start_time: '20:00',
    end_time: '05:30',
    type: 'Tardeo',
    music: ['Comercial', 'Urbano'],
    audience: '+23',
    price_from: 0,
    cover: '',
    featured: false,
    description:
      'Tardeo de jueves en Marabú Madrid, en la zona de Ponzano, con barra libre soft al inicio del evento.',
    perks: ['Ponzano', 'Afterwork', 'Copas'],
    status: 'approved',
    published: true,
  },
  {
    title: 'LA VUELTA-TARDEO',
    slug: 'la-vuelta-tardeo-2026-05-22',
    venue: 'La Vuelta',
    area: 'Chamartín',
    address: 'Calle de María de Molina, 41, Chamartín, 28006 Madrid, España',
    maps_url:
      'https://www.google.com/maps/search/?api=1&query=Calle%20de%20Maria%20de%20Molina%2041%20Madrid',
    date: '2026-05-22',
    start_time: '18:00',
    end_time: '01:30',
    type: 'Tardeo',
    music: ['Directo', 'DJ'],
    audience: '+18',
    price_from: 0,
    cover: '',
    featured: true,
    description:
      'Tardeo con música en directo, artistas, DJ guest, cócteles de autor, marcas sponsor y nueva carta.',
    perks: ['Invitación', 'Música en directo', 'DJ guest'],
    status: 'approved',
    published: true,
  },
  {
    title: 'TARDEO CAÑÓN | Sala B',
    slug: 'tardeo-canon-sala-b-2026-05-23',
    venue: 'Sala B Madrid',
    area: 'Chamberí',
    address: 'Calle de Trafalgar, 6, 28010 Madrid, España',
    maps_url:
      'https://www.google.com/maps/search/?api=1&query=Calle%20de%20Trafalgar%206%20Madrid',
    date: '2026-05-23',
    start_time: '18:00',
    end_time: '23:00',
    type: 'Tardeo',
    music: ['Comercial'],
    audience: '+27',
    price_from: 18,
    cover: '',
    featured: false,
    description:
      'Tardeo en Sala B Madrid con oferta de entrada 2x18€ y fast pass.',
    perks: ['Fast pass', '2 consumiciones', '+27'],
    status: 'approved',
    published: true,
  },
  {
    title: 'MAJARETA TARDEO',
    slug: 'majareta-tardeo-2026-05-16',
    venue: 'Majareta',
    area: 'Madrid',
    address: 'Madrid, España',
    maps_url:
      'https://www.google.com/maps/search/?api=1&query=Majareta%20Tardeo%20Madrid',
    date: '2026-05-16',
    start_time: '18:00',
    end_time: '23:30',
    type: 'Tardeo',
    music: ['Flamenquito', 'Hits'],
    audience: '+18',
    price_from: 0,
    cover: '',
    featured: true,
    description:
      'Tardeo de flamenquito con Bella Da Sousa, Rubén Aldarias, Tomás Ocaña, banda en directo y DJ.',
    perks: ['Flamenquito', 'Directo', 'Catering gratuito'],
    status: 'approved',
    published: true,
  },
  {
    title: 'POMPÄ Tardeo Club - Florida Park',
    slug: 'pompa-tardeo-club-florida-park-2026-05-02',
    venue: 'Florida Park',
    area: 'Retiro',
    address: 'Paseo de la República de Panamá, 28009 Madrid, España',
    maps_url:
      'https://www.google.com/maps/search/?api=1&query=Florida%20Park%20Madrid',
    date: '2026-05-02',
    start_time: '18:00',
    end_time: '23:30',
    type: 'Tardeo',
    music: ['Comercial'],
    audience: '+25',
    price_from: 0,
    cover: '',
    featured: true,
    description:
      'POMPÄ Tardeo Club en Florida Park Retiro, sesión de tarde de 18:00 a 23:30.',
    perks: ['Florida Park', 'Retiro', '+25'],
    status: 'approved',
    published: true,
  },
]

async function main() {
  for (const event of events) {
    const { error } = await supabase
      .from('events')
      .upsert(event, { onConflict: 'slug' })

    if (error) {
      console.error(`Error importando ${event.title}:`, error.message)
    } else {
      console.log(`Importado: ${event.title}`)
    }
  }
}

main()
