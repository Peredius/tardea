export type EventItem = {
  slug: string;
  title: string;
  venue: string;
  area: string;
  address: string;
  date: string;
  startTime: string;
  endTime: string;
  type: 'Tardeo' | 'Brunch' | 'Rooftop' | 'Afterwork' | 'Fiesta temática';
  music: ('Reggaetón' | 'House' | 'Pop' | 'Indie' | 'Flamenco' | 'Techno')[];
  audience: '18-25' | '25-35' | '30+' | 'Mixto';
  priceFrom: number;
  cover: string;
  featured?: boolean;
  description: string;
  perks: string[];
};

export const areas = ['Salamanca', 'Chamberí', 'Malasaña', 'La Latina', 'Centro', 'Chamartín'];
export const eventTypes = ['Todos', 'Tardeo', 'Brunch', 'Rooftop', 'Fitness Party', 'Afterwork', 'Fiesta temática'];
export const musicTypes = ['Todas', 'Reggaetón', 'House', 'Pop', 'Indie', 'Flamenco', 'Techno'];
export const audienceTypes = ['Todas', '18-25', '25-35', '30+', 'Mixto'];
export const priceRanges = ['Todos', 'Gratis', '0-15€', '15-30€', '30€+'];

export const events: EventItem[] = [
  {
    slug: 'rooftop-sunset-sessions',
    title: 'Rooftop Sunset Sessions',
    venue: 'Azotea Cibeles Sky',
    area: 'Centro',
    address: 'Calle de Alcalá, 42',
    date: '2026-05-02',
    startTime: '17:00',
    endTime: '23:00',
    type: 'Rooftop',
    music: ['House', 'Pop'],
    audience: '25-35',
    priceFrom: 18,
    cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
    featured: true,
    description: 'Un tardeo premium con vistas al centro de Madrid, DJs residentes, cócteles de autor y ambiente elegante para empezar el fin de semana arriba.',
    perks: ['Vistas rooftop', 'Cóctel incluido', 'Acceso prioritario']
  },
  {
    slug: 'brunch-beats-castellana',
    title: 'Brunch & Beats Castellana',
    venue: 'The Patio Club',
    area: 'Chamartín',
    address: 'Paseo de la Castellana, 118',
    date: '2026-05-03',
    startTime: '13:30',
    endTime: '20:00',
    type: 'Brunch',
    music: ['House', 'Indie'],
    audience: '30+',
    priceFrom: 25,
    cover: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1200&q=80',
    featured: true,
    description: 'La mezcla perfecta entre brunch social y sesión musical suave para alargar la tarde con público adulto y un formato muy cuidado.',
    perks: ['Menú brunch', 'Terraza', 'DJ set en directo']
  },
  {
    slug: 'reggaeton-golden-hour',
    title: 'Reggaetón Golden Hour',
    venue: 'La Chula Club',
    area: 'Salamanca',
    address: 'Calle de Goya, 79',
    date: '2026-05-01',
    startTime: '18:00',
    endTime: '00:00',
    type: 'Tardeo',
    music: ['Reggaetón', 'Pop'],
    audience: '18-25',
    priceFrom: 12,
    cover: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80',
    description: 'Hits comerciales, reggaetón clásico y ambiente joven en una de las zonas más activas para el tardeo de Madrid.',
    perks: ['Consumición', 'Animación', 'Zona VIP opcional']
  },
  {
    slug: 'afterwork-nuevos-ministerios',
    title: 'Afterwork Nuevos Ministerios',
    venue: 'Distrito 41',
    area: 'Chamberí',
    address: 'Calle de Raimundo Fernández Villaverde, 41',
    date: '2026-04-30',
    startTime: '19:00',
    endTime: '23:30',
    type: 'Afterwork',
    music: ['House', 'Pop'],
    audience: '25-35',
    priceFrom: 0,
    cover: 'https://images.unsplash.com/photo-1496024840928-4c417adf211d?auto=format&fit=crop&w=1200&q=80',
    description: 'Plan ideal para salir de la oficina y conectar con gente en un formato más relajado, con entrada gratis hasta completar aforo.',
    perks: ['Entrada gratis', 'Networking', 'Happy hour']
  },
  {
    slug: 'vermut-indie-latina',
    title: 'Vermut Indie La Latina',
    venue: 'La Verbena Social Club',
    area: 'La Latina',
    address: 'Calle de la Cava Baja, 24',
    date: '2026-05-10',
    startTime: '16:00',
    endTime: '22:00',
    type: 'Tardeo',
    music: ['Indie', 'Pop'],
    audience: 'Mixto',
    priceFrom: 10,
    cover: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80',
    description: 'Un plan con sabor madrileño, copas al sol, hits indie y público variado para quienes prefieren un tardeo menos mainstream.',
    perks: ['Zona exterior', 'Tapeo', 'Ambiente mixto']
  },
  {
    slug: 'flamenco-terrace-sundays',
    title: 'Flamenco Terrace Sundays',
    venue: 'Terraza del Sur',
    area: 'Malasaña',
    address: 'Calle del Pez, 12',
    date: '2026-05-17',
    startTime: '15:30',
    endTime: '21:30',
    type: 'Fiesta temática',
    music: ['Flamenco', 'Pop'],
    audience: '30+',
    priceFrom: 20,
    cover: 'https://images.unsplash.com/photo-1507874457470-272b3c8d8ee2?auto=format&fit=crop&w=1200&q=80',
    description: 'Domingos de terraceo con fusión flamenca, formato sofisticado y un público que busca un plan con personalidad.',
    perks: ['Show en vivo', 'Mesa reservada', 'Cócteles especiales']
 },
  {
  slug: 'riu-360-rooftop-madrid',
  title: '360º Rooftop Bar RIU Madrid',
  venue: 'Hotel RIU Plaza España',
  area: 'Centro',
  address: 'Calle Gran Vía, 84',
  date: '2026-05-24',
  startTime: '17:00',
  endTime: '23:00',
  type: 'Rooftop',
  music: ['House', 'Pop'],
  audience: '25-35',
  priceFrom: 10,
  cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
  featured: true,
  description: 'Rooftop con vistas panorámicas de Madrid, ambiente de tarde, copas y una de las mejores puestas de sol de la ciudad.',
  perks: ['Vistas 360º', 'Atardecer', 'Copas', 'Música']
}
  };

export function getEventBySlug(slug: string) {
  return events.find((event) => event.slug === slug);
}

export function getFeaturedEvents() {
  return events.filter((event) => event.featured);
}
