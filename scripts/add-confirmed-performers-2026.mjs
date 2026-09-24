import { createRequire } from 'node:module'

const require = createRequire(`${process.cwd()}/package.json`)
const { createClient } = require('@supabase/supabase-js')

const confirmed = [
  { slug: 'tardeo-super-pop-2026-09-25', date: '2026-09-25', title: 'ROSER', perk: 'Artista: Roser' },
  { slug: 'tardeo-super-pop-2026-09-26', date: '2026-09-26', title: 'MALENA GRACIA', perk: 'Artista: Malena Gracia' },
  { slug: 'oro-viejo-by-dj-nano-2026-09-26', date: '2026-09-26', title: 'DJ NANO', perk: 'Artista: DJ Nano' },
  { slug: 'tardeo-rumbeo-actuacion-david-de-paloma-2026-05-09', date: '2026-05-09', title: 'DAVID DE PALOMA', perk: 'Artista: David de Paloma' },
]

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Faltan las credenciales de Supabase')
}

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const apply = process.argv.includes('--apply')

for (const item of confirmed) {
  const { data: event, error } = await db.from('events')
    .select('id, slug, date, title, perks, status, published')
    .eq('slug', item.slug).maybeSingle()
  if (error) throw error
  if (!event) {
    console.log(`${item.slug}: no existe; omitido`)
    continue
  }
  if (event.date !== item.date || !event.title.toUpperCase().includes(item.title)) {
    throw new Error(`${item.slug}: la fecha o el título no coinciden`)
  }
  if (event.status !== 'approved' || !event.published) {
    console.log(`${item.slug}: no publicado; omitido`)
    continue
  }

  const perks = Array.isArray(event.perks) ? event.perks : []
  if (perks.some((perk) => perk.toLocaleLowerCase('es') === item.perk.toLocaleLowerCase('es'))) {
    console.log(`${item.slug}: ya consta ${item.perk}`)
    continue
  }
  if (!apply) {
    console.log(`${item.slug}: añadiría ${item.perk}`)
    continue
  }
  const { data: updated, error: updateError } = await db.from('events')
    .update({ perks: [...perks, item.perk] })
    .eq('id', event.id).eq('slug', item.slug).eq('date', item.date)
    .select('id').maybeSingle()
  if (updateError) throw updateError
  if (!updated) throw new Error(`${item.slug}: no se ha actualizado`)
  console.log(`${item.slug}: añadido ${item.perk}`)
}
