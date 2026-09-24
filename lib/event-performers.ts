export type EventPerformer = {
  name: string
  type: 'Person' | 'PerformingGroup'
}

const performerLabel = /^(Artista|Grupo):\s*(.+)$/i

export function getEventPerformers(perks: string[] | null | undefined): EventPerformer[] {
  if (!Array.isArray(perks)) return []

  const seen = new Set<string>()
  return perks.flatMap((perk) => {
    const match = typeof perk === 'string' ? perk.match(performerLabel) : null
    const name = match?.[2]?.trim()
    if (!name) return []
    const type = match![1].toLowerCase() === 'grupo' ? 'PerformingGroup' : 'Person'
    const key = `${type}:${name.toLocaleLowerCase('es')}`
    if (seen.has(key)) return []
    seen.add(key)
    return [{ name, type }]
  })
}

export function withoutEventPerformers(perks: string[] | null | undefined): string[] {
  return Array.isArray(perks)
    ? perks.filter((perk) => typeof perk === 'string' && !performerLabel.test(perk))
    : []
}

export function performerPerksFromInput(input: string): string[] {
  return input.split(',').map((name) => name.trim()).filter(Boolean).map((name) => {
    const group = /^Grupo:\s*/i.test(name)
    const cleanName = name.replace(/^(Artista|Grupo):\s*/i, '').trim()
    return cleanName ? `${group ? 'Grupo' : 'Artista'}: ${cleanName}` : ''
  }).filter(Boolean)
}

export function performerInputFromPerks(perks: string[] | null | undefined): string {
  return getEventPerformers(perks).map((performer) =>
    performer.type === 'PerformingGroup' ? `Grupo: ${performer.name}` : performer.name
  ).join(', ')
}
