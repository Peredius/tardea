import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const requiredEnv = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SERPER_API_KEY',
]

const requiredFiles = [
  'scripts/scout-platforms.json',
  'scripts/scout-config.json',
  'scripts/tardea-scout-discover.ts',
  'scripts/tardea-scout.ts',
]

function mask(value: string) {
  if (!value) return 'no configurada'
  if (value.length <= 8) return 'configurada'
  return `${value.slice(0, 4)}...${value.slice(-4)}`
}

function readJson(path: string) {
  return JSON.parse(readFileSync(resolve(process.cwd(), path), 'utf8'))
}

let hasErrors = false

console.log('TARDEA Scout - comprobacion')
console.log('')
console.log('Variables')

for (const key of requiredEnv) {
  const value = process.env[key] || ''
  const ok = Boolean(value)
  if (!ok) hasErrors = true
  console.log(`${ok ? 'OK' : 'FALTA'} ${key}: ${mask(value)}`)
}

console.log('')
console.log('Archivos')

for (const file of requiredFiles) {
  const ok = existsSync(resolve(process.cwd(), file))
  if (!ok) hasErrors = true
  console.log(`${ok ? 'OK' : 'FALTA'} ${file}`)
}

console.log('')

try {
  const platforms = readJson('scripts/scout-platforms.json')
  const config = readJson('scripts/scout-config.json')
  console.log(`Plataformas configuradas: ${platforms.length}`)
  console.log(`Tipos permitidos: ${(config.allowed_types || []).join(', ')}`)
  console.log(`Musicas permitidas: ${(config.allowed_music || []).join(', ')}`)
} catch (error) {
  hasErrors = true
  console.log(`Error leyendo JSON de Scout: ${error instanceof Error ? error.message : String(error)}`)
}

console.log('')

if (hasErrors) {
  console.log('Resultado: falta configuracion. Completa .env.local y vuelve a ejecutar npm run scout-check')
  process.exitCode = 1
} else {
  console.log('Resultado: listo para ejecutar npm run scout-discover o npm run scout-auto')
}