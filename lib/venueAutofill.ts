export type KnownVenueDetails = {
  venue: string
  address: string
  area: string
  mapsUrl: string
}

const knownVenues: Array<KnownVenueDetails & { aliases: string[] }> = [
  {
    venue: 'Hipódromo de la Zarzuela',
    aliases: ['hipodromo', 'hipodromo de la zarzuela', 'hipódromo', 'hipódromo de la zarzuela'],
    address: 'Avenida Padre Huidobro s/n, 28023 Madrid',
    area: 'Moncloa-Aravaca',
    mapsUrl:
      'https://www.google.com/maps/search/?api=1&query=Hip%C3%B3dromo%20de%20la%20Zarzuela%20Avenida%20Padre%20Huidobro%20s%2Fn%20Madrid',
  },
  {
    venue: 'Sala But',
    aliases: ['but', 'sala but', 'ochoymedio', 'ochoymedio club', 'ochoymedio madrid'],
    address: 'Calle de Barceló, 11, 28004 Madrid',
    area: 'Centro',
    mapsUrl:
      'https://www.google.com/maps/search/?api=1&query=Sala%20But%20Calle%20de%20Barcel%C3%B3%2011%20Madrid',
  },
  {
    venue: 'Florida Park',
    aliases: ['florida', 'florida park', 'florida park retiro'],
    address: 'Paseo de la República de Panamá, 1, 28009 Madrid',
    area: 'Retiro',
    mapsUrl:
      'https://www.google.com/maps/search/?api=1&query=Florida%20Park%20Paseo%20de%20la%20Rep%C3%BAblica%20de%20Panam%C3%A1%201%20Madrid',
  },
  {
    venue: 'Teatro Magno',
    aliases: ['magno', 'teatro magno', 'teatro magno madrid'],
    address: 'Calle de Cedaceros, 7, 28014 Madrid',
    area: 'Gran Vía',
    mapsUrl:
      'https://www.google.com/maps/search/?api=1&query=Teatro%20Magno%20Calle%20de%20Cedaceros%207%20Madrid',
  },
  {
    venue: 'Shoko Madrid',
    aliases: ['shoko', 'shoko madrid', 'sala shoko'],
    address: 'Calle de Toledo, 86, 28005 Madrid',
    area: 'La Latina',
    mapsUrl:
      'https://www.google.com/maps/search/?api=1&query=Shoko%20Madrid%20Calle%20de%20Toledo%2086%20Madrid',
  },
  {
    venue: 'Rubicon',
    aliases: ['rubicon', 'rubicon madrid', 'rubicón', 'rubicón madrid'],
    address: 'Calle de José Ortega y Gasset, 71, 28006 Madrid',
    area: 'Salamanca',
    mapsUrl:
      'https://www.google.com/maps/search/?api=1&query=Rubicon%20Calle%20de%20Jos%C3%A9%20Ortega%20y%20Gasset%2071%20Madrid',
  },
]

function normalizeVenueText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function findKnownVenueDetails(value: string) {
  const normalized = normalizeVenueText(value)
  if (!normalized) return null

  return (
    knownVenues.find((venue) =>
      venue.aliases.some((alias) => {
        const normalizedAlias = normalizeVenueText(alias)
        return normalized === normalizedAlias || normalized.includes(normalizedAlias)
      })
    ) || null
  )
}
