export function normalizeMusicKey(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

export function canonicalizeMusic(value: string) {
  const normalized = normalizeMusicKey(value)

  if (normalized === 'electronica') return 'Electrónica'
  if (normalized === 'regueton') return 'Reguetón'

  return value.trim()
}

export function canonicalizeMusicList(value: unknown) {
  const items = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : []

  return Array.from(
    new Set(
      items
        .map((item) => canonicalizeMusic(String(item)))
        .filter(Boolean)
    )
  )
}
