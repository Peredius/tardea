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
