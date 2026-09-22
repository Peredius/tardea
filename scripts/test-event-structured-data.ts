import assert from 'node:assert/strict'
import { eventStructuredData, type StructuredEvent } from '../lib/event-structured-data'

const base: StructuredEvent = {
  slug: 'tardeo-super-pop-2026-10-30',
  title: 'Tardeo Súper Pop',
  venue: 'Sala Morocco',
  area: 'Centro',
  address: 'C. del Marqués de Leganés, 7, Madrid',
  date: '2026-10-30',
  start_time: '20:00:00',
  end_time: '06:00:00',
  description: 'Viernes non-stop',
  cover: 'https://example.com/poster.jpg',
  price_from: 12,
  source_url: 'https://tickets.salamoroccomadrid.com/events/tardeo-super-pop-viernes',
}

const ticketed = eventStructuredData(base, {
  name: 'Tardeo Súper Pop',
  website_url: 'https://www.superpopbar.com/tardeo-super-pop',
})
assert.equal(ticketed.startDate, '2026-10-30T20:00:00')
assert.equal(ticketed.endDate, '2026-10-31T06:00:00')
assert.deepEqual(ticketed.organizer, {
  '@type': 'Organization',
  name: 'Tardeo Súper Pop',
  url: 'https://www.superpopbar.com/tardeo-super-pop',
})
assert.equal(ticketed.offers?.price, 12)
assert.equal(eventStructuredData({
  ...base,
  source_url: 'https://bclever.ai/eventos/madrid/premier14nov',
}, null).offers?.price, 12)
assert.equal('validFrom' in (ticketed.offers || {}), false)
assert.equal('performer' in ticketed, false)

const noTicket = eventStructuredData({
  ...base,
  date: '2026-11-07',
  start_time: '18:00:00',
  end_time: '23:00:00',
  price_from: 0,
  source_url: 'https://www.google.com/search?q=fiesta',
}, null)
assert.equal(noTicket.startDate, '2026-11-07T18:00:00')
assert.equal(noTicket.endDate, '2026-11-07T23:00:00')
assert.equal(noTicket.organizer, undefined)
assert.equal(noTicket.offers, undefined)

const unknownPrice = eventStructuredData({ ...base, price_from: 0 }, null)
assert.equal(unknownPrice.offers, undefined)

const nonTicketSource = eventStructuredData({
  ...base,
  source_url: 'https://www.google.com/search?q=fiesta',
}, null)
assert.equal(nonTicketSource.offers, undefined)

const searchProfile = eventStructuredData(base, {
  name: 'Sala de fiestas',
  website_url: 'https://www.google.com/search?q=sala',
})
assert.deepEqual(searchProfile.organizer, { '@type': 'Organization', name: 'Sala de fiestas', url: undefined })

const noTime = eventStructuredData({ ...base, start_time: null, end_time: null }, null)
assert.equal(noTime.startDate, '2026-10-30')
assert.equal(noTime.endDate, undefined)

console.log('Event JSON-LD checks passed')
