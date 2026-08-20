import { writeFileSync, existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const platformFilter = args.find((arg) => arg.startsWith('--platform='))?.split('=')[1]?.toLowerCase()
const priorityFilter = args.find((arg) => arg.startsWith('--priority='))?.split('=')[1]
const limitPerQuery = Number(args.find((arg) => arg.startsWith('--limit-per-query='))?.split('=')[1] || 5)
const maxResults = Number(args.find((arg) => arg.startsWith('--max-results='))?.split('=')[1] || 80)
const outPath = args.find((arg) => arg.startsWith('--out='))?.split('=')[1] || 'scripts/scout-sources.generated.json'
const includeUndated = args.includes('--include-undated')

const serperApiKey = process.env.SERPER_API_KEY

type ScoutPlatform = {
  platform: string
  priority: number
  source_type: string
  base_url: string
  search_patterns: string[]
  best_for: string[]
  signals: string[]
  scout_strategy: string
  image_policy: string
  notes: string
}

type SearchResult = {
  title: string
  link: string
  snippet?: string
}

type ScoutCandidate = {
  source_name: string
  source_type: string
  platform: string
  source_url: string
  title: string
  city: string
  province: string
  area: string
  date?: string
  type: string
  music: string[]
  audience: string
  price_from: number
  notes: string
}

const typeKeywords: Record<string, string[]> = {
  Brunch: ['brunch', 'desayuno'],
  Rooftop: ['rooftop', 'terraza', 'azotea'],
  Afterwork: ['afterwork', 'after work', 'networking'],
  Tardeo: ['tardeo', 'tardear', 'fiesta tarde', 'club'],
}

const musicKeywords: Record<string, string[]> = {
  Electronica: ['electronica', 'electrónica', 'techno', 'house', 'dj set'],
  Flamenquito: ['flamenquito', 'flamenco', 'rumba', 'sevillanas'],
  Indie: ['indie', 'alternativo'],
  Remember: ['remember', '90s', '2000', 'clasicos', 'clásicos'],
  Pop: ['pop'],
  Reguetón: ['reggaeton', 'reguetón', 'regueton', 'urbano', 'urban'],
  Comercial: ['comercial', 'hits', 'tardeo'],
}

const spanishMonths: Record<string, string> = {
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
}

function readJson<T>(path: string) {
  return JSON.parse(readFileSync(path, 'utf8')) as T
}

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function inferFromKeywords(text: string, rules: Record<string, string[]>, fallback: string) {
  const normalized = normalize(text)
  const match = Object.entries(rules).find(([, keywords]) =>
    keywords.some((keyword) => normalized.includes(normalize(keyword)))
  )

  return match?.[0] || fallback
}

function inferType(platform: ScoutPlatform, text: string) {
  const inferred = inferFromKeywords(text, typeKeywords, '')
  if (inferred) return inferred
  return platform.best_for.includes('Brunch') ? 'Brunch' : platform.best_for.includes('Rooftop') ? 'Rooftop' : 'Tardeo'
}

function inferMusic(text: string) {
  return [inferFromKeywords(text, musicKeywords, 'Comercial')]
}

function inferDate(text: string) {
  const iso = text.match(/(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})/)
  if (iso) return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`

  const numeric = text.match(/\b(\d{1,2})[/-](\d{1,2})(?:[/-](20\d{2}|\d{2}))?\b/)
  if (numeric) {
    const year = numeric[3] ? (numeric[3].length === 2 ? `20${numeric[3]}` : numeric[3]) : new Date().getFullYear().toString()
    return `${year}-${numeric[2].padStart(2, '0')}-${numeric[1].padStart(2, '0')}`
  }

  const monthNames = Object.keys(spanishMonths).join('|')
  const written = normalize(text).match(new RegExp(`\\b(\\d{1,2})\\s+(?:de\\s+)?(${monthNames})(?:\\s+(?:de\\s+)?(20\\d{2}))?\\b`))
  if (written) {
    const year = written[3] || new Date().getFullYear().toString()
    return `${year}-${spanishMonths[written[2]]}-${written[1].padStart(2, '0')}`
  }

  return undefined
}

function cleanTitle(title: string) {
  return title
    .replace(/\s*\|\s*(Fourvenues|Xceed|Fever|Eventbrite|Entradium).*$/i, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function canSearch(pattern: string) {
  return !pattern.includes('hashtags:') && !pattern.includes('[web sala]') && !pattern.includes('[nombre')
}

async function searchSerper(query: string): Promise<SearchResult[]> {
  if (!serperApiKey) {
    throw new Error('Falta SERPER_API_KEY en .env.local para buscar automaticamente')
  }

  const response = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: {
      'X-API-KEY': serperApiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ q: query, gl: 'es', hl: 'es', num: limitPerQuery }),
  })

  if (!response.ok) {
    throw new Error(`Serper respondio ${response.status} para ${query}`)
  }

  const data = await response.json()
  return (data.organic || []).map((item: any) => ({
    title: item.title || '',
    link: item.link || '',
    snippet: item.snippet || '',
  }))
}

function candidateFromResult(platform: ScoutPlatform, result: SearchResult): ScoutCandidate | null {
  if (!result.link || !result.title) return null

  const text = `${result.title} ${result.snippet || ''}`
  const date = inferDate(text)

  if (!date && !includeUndated) return null

  return {
    source_name: platform.platform,
    source_type: platform.source_type,
    platform: platform.platform,
    source_url: result.link,
    title: cleanTitle(result.title),
    city: 'Madrid',
    province: 'Madrid',
    area: 'Madrid',
    date,
    type: inferType(platform, text),
    music: inferMusic(text),
    audience: 'Mixto',
    price_from: 0,
    notes: `Descubierto automaticamente. Revisar datos antes de aprobar. Snippet: ${(result.snippet || '').slice(0, 220)}`,
  }
}

async function main() {
  const platformsPath = resolve(process.cwd(), 'scripts/scout-platforms.json')
  const platforms = readJson<ScoutPlatform[]>(platformsPath)
    .filter((platform) => !platformFilter || platform.platform.toLowerCase() === platformFilter)
    .filter((platform) => !priorityFilter || platform.priority === Number(priorityFilter))

  const queries = platforms.flatMap((platform) =>
    platform.search_patterns.filter(canSearch).map((query) => ({ platform, query }))
  )

  if (dryRun || !serperApiKey) {
    console.log('TARDEA Scout Discover')
    console.log(`- Plataformas: ${platforms.length}`)
    console.log(`- Busquedas preparadas: ${queries.length}`)
    if (!serperApiKey) console.log('- Falta SERPER_API_KEY: muestro busquedas, no puedo consultar Google automaticamente')
    queries.forEach(({ platform, query }) => console.log(`[${platform.platform}] ${query}`))
    return
  }

  const seen = new Set<string>()
  const candidates: ScoutCandidate[] = []
  const rejected: string[] = []

  for (const { platform, query } of queries) {
    const results = await searchSerper(query)

    for (const result of results) {
      if (seen.has(result.link)) continue
      seen.add(result.link)

      const candidate = candidateFromResult(platform, result)
      if (!candidate) {
        rejected.push(`${platform.platform}: sin fecha clara - ${result.title}`)
        continue
      }

      candidates.push(candidate)
      if (candidates.length >= maxResults) break
    }

    if (candidates.length >= maxResults) break
  }

  const finalCandidates = candidates.slice(0, maxResults)
  writeFileSync(resolve(process.cwd(), outPath), JSON.stringify(finalCandidates, null, 2))

  console.log('TARDEA Scout Discover')
  console.log(`- Candidatos generados: ${finalCandidates.length}`)
  console.log(`- Archivo: ${outPath}`)
  console.log(`- Omitidos: ${rejected.length}`)
  if (rejected.length) rejected.slice(0, 15).forEach((item) => console.log(`  ${item}`))
}

main()
