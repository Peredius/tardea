import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const appDir = process.argv.find((arg) => arg.startsWith('--app-dir='))?.slice('--app-dir='.length) || process.cwd()
const write = process.argv.includes('--write')
const require = createRequire(resolve(appDir, 'package.json'))
require('dotenv').config({ path: resolve(appDir, '.env.local'), quiet: true })
const { createClient } = require('@supabase/supabase-js')

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const tables = ['events', 'event_templates', 'promoter_event_profiles', 'event_research_items']
const replacements = [['18-25', '+18'], ['25-35', '+25']]

async function count(table, audience) {
  const { count: total, error } = await db.from(table)
    .select('id', { count: 'exact', head: true }).eq('audience', audience)
  if (error) throw new Error(`${table} (${audience}): ${error.message}`)
  return total || 0
}

async function main() {
  const summary = []
  for (const table of tables) {
    for (const [oldLabel, newLabel] of replacements) {
      const before = await count(table, oldLabel)
      summary.push({ table, from: oldLabel, to: newLabel, records: before })
    }
  }
  console.table(summary)
  if (!write) return

  for (const { table, from, to, records } of summary) {
    if (!records) continue
    const { error } = await db.from(table).update({ audience: to }).eq('audience', from)
    if (error) throw new Error(`${table} (${from}): ${error.message}`)
  }

  const remaining = []
  for (const table of tables) {
    for (const [oldLabel] of replacements) {
      const total = await count(table, oldLabel)
      if (total) remaining.push(`${table}: ${oldLabel} = ${total}`)
    }
  }
  if (remaining.length) throw new Error(`Valores antiguos restantes: ${remaining.join(', ')}`)
  console.log('Migración verificada: no quedan valores antiguos en las cuatro tablas.')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
