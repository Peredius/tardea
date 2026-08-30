import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type SearchEvent = {
  id: string
  event_profile_id: string | null
  slug: string
  title: string
  venue: string | null
  area: string | null
  type: string | null
  date: string
  cover: string | null
}

type EventProfile = {
  id: string
  name: string
  venue_name: string | null
  type: string | null
  logo_url: string | null
  banner_url: string | null
}

type FutureEvent = {
  event_profile_id: string | null
  date: string
}

type SearchResult = EventProfile & {
  area: string | null
  nextDate: string | null
  href: string
}

function uniqueById<T extends { id: string }>(items: T[]) {
  return Array.from(new Map(items.map((item) => [item.id, item])).values())
}

function normalizeSearchKey(value: string | null | undefined) {
  return (value || '')
    .trim()
    .toLocaleLowerCase('es-ES')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function getSearchVariants(query: string) {
  const compactQuery = query.trim().replace(/\s+/g, ' ')
  const singularQuery = compactQuery
    .split(' ')
    .map((word) => (word.length > 3 && word.toLocaleLowerCase('es-ES').endsWith('s') ? word.slice(0, -1) : word))
    .join(' ')
  const meaningfulWords = singularQuery
    .split(' ')
    .filter((word) => !['el', 'la', 'los', 'las', 'de', 'del', 'y'].includes(normalizeSearchKey(word)))

  return Array.from(new Set([
    compactQuery,
    singularQuery,
    meaningfulWords.join(' '),
    ...meaningfulWords,
  ].map((value) => value.trim()).filter((value) => value.length >= 2))).slice(0, 6)
}

const outsideMadridAreaKeys = new Set(
  [
    'Alcorcón',
    'Alcorcon',
    'Móstoles',
    'Mostoles',
    'Getafe',
    'Leganés',
    'Leganes',
    'Alcobendas',
    'San Sebastián de los Reyes',
    'San Sebastian de los Reyes',
    'Pozuelo',
    'Majadahonda',
    'Boadilla',
    'Boadilla del Monte',
    'Fuenlabrada',
  ].map(normalizeSearchKey)
)

function isMadridCapitalArea(value?: string | null) {
  return !outsideMadridAreaKeys.has(normalizeSearchKey(value || 'Madrid'))
}

function getSupabaseClients() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl) {
    return []
  }

  return [serviceRoleKey, anonKey]
    .filter(Boolean)
    .map((key) =>
      createClient(supabaseUrl, key as string, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    )
}

async function runProfileSearch(supabaseClient: SupabaseClient, query: string) {
  const today = new Date().toISOString().split('T')[0]
  const searchVariants = getSearchVariants(query)

  const profileSelect = 'id, name, venue_name, type, logo_url, banner_url'
  const eventSelect = 'id, event_profile_id, slug, title, venue, area, type, date, cover'

  const profileMatches = await Promise.all(
    searchVariants.flatMap((variant) => [
      supabaseClient
        .from('promoter_event_profiles')
        .select(profileSelect)
        .eq('is_active', true)
        .ilike('name', `%${variant}%`)
        .limit(12),
      supabaseClient
        .from('promoter_event_profiles')
        .select(profileSelect)
        .eq('is_active', true)
        .ilike('venue_name', `%${variant}%`)
        .limit(12),
      supabaseClient
        .from('promoter_event_profiles')
        .select(profileSelect)
        .eq('is_active', true)
        .ilike('type', `%${variant}%`)
        .limit(12),
    ])
  )

  const eventMatchResponses = await Promise.all(
    searchVariants.flatMap((variant) => [
      supabaseClient
        .from('events')
        .select(eventSelect)
        .eq('published', true)
        .eq('status', 'approved')
        .gte('date', today)
        .ilike('title', `%${variant}%`)
        .order('date', { ascending: true })
        .limit(30),
      supabaseClient
        .from('events')
        .select(eventSelect)
        .eq('published', true)
        .eq('status', 'approved')
        .gte('date', today)
        .ilike('venue', `%${variant}%`)
        .order('date', { ascending: true })
        .limit(30),
      supabaseClient
        .from('events')
        .select(eventSelect)
        .eq('published', true)
        .eq('status', 'approved')
        .gte('date', today)
        .ilike('area', `%${variant}%`)
        .order('date', { ascending: true })
        .limit(30),
      supabaseClient
        .from('events')
        .select(eventSelect)
        .eq('published', true)
        .eq('status', 'approved')
        .gte('date', today)
        .ilike('type', `%${variant}%`)
        .order('date', { ascending: true })
        .limit(30),
    ])
  )

  const madridAreaEventsResponse =
    normalizeSearchKey(query) === 'madrid'
      ? await supabaseClient
          .from('events')
          .select(eventSelect)
          .eq('published', true)
          .eq('status', 'approved')
          .gte('date', today)
          .order('date', { ascending: true })
          .limit(200)
      : { data: [] as SearchEvent[] }

  const madridCapitalEvents = ((madridAreaEventsResponse.data || []) as SearchEvent[]).filter((event) =>
    isMadridCapitalArea(event.area)
  )

  const eventMatches = uniqueById([
    ...eventMatchResponses.flatMap((response) => (response.data || []) as SearchEvent[]),
    ...madridCapitalEvents,
  ])
  const profileIdsFromEvents = Array.from(
    new Set(eventMatches.map((event) => event.event_profile_id).filter(Boolean) as string[])
  )

  const { data: profilesFromEvents } = profileIdsFromEvents.length
    ? await supabaseClient
        .from('promoter_event_profiles')
        .select(profileSelect)
        .eq('is_active', true)
        .in('id', profileIdsFromEvents)
    : { data: [] as EventProfile[] }

  const profiles = uniqueById([
    ...profileMatches.flatMap((response) => (response.data || []) as EventProfile[]),
    ...((profilesFromEvents || []) as EventProfile[]),
  ])

  const futureEventsResponse = profiles.length
    ? await supabaseClient
        .from('events')
        .select('event_profile_id, date')
        .in(
          'event_profile_id',
          profiles.map((profile) => profile.id)
        )
        .eq('published', true)
        .eq('status', 'approved')
        .gte('date', today)
        .order('date', { ascending: true })
    : { data: [] }
  const futureEvents = (futureEventsResponse.data || []) as FutureEvent[]

  const nextDateByProfile = new Map<string, string>()
  const firstEventByProfile = new Map<string, SearchEvent>()

  futureEvents.forEach((event) => {
    if (event.event_profile_id && !nextDateByProfile.has(event.event_profile_id)) {
      nextDateByProfile.set(event.event_profile_id, event.date)
    }
  })

  eventMatches.forEach((event) => {
    if (event.event_profile_id && !firstEventByProfile.has(event.event_profile_id)) {
      firstEventByProfile.set(event.event_profile_id, event)
    }
  })

  const profileResults: SearchResult[] = profiles
    .map((profile) => {
      const firstEvent = firstEventByProfile.get(profile.id)

      return {
        ...profile,
        area: firstEvent?.area || null,
        nextDate: nextDateByProfile.get(profile.id) || null,
        href: `/eventos/grupo/${profile.id}`,
      }
    })
    .filter((profile) => profile.nextDate)
    .sort((a, b) => (a.nextDate || '').localeCompare(b.nextDate || ''))

  const fallbackEventsByPlan = new Map<string, SearchEvent>()

  eventMatches
    .filter((event) => !event.event_profile_id && event.slug)
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach((event) => {
      const key = `${normalizeSearchKey(event.title)}__${normalizeSearchKey(event.venue)}`

      if (!fallbackEventsByPlan.has(key)) {
        fallbackEventsByPlan.set(key, event)
      }
    })

  const fallbackEventResults: SearchResult[] = Array.from(fallbackEventsByPlan.values())
    .map((event) => ({
      id: event.id,
      name: event.title,
      venue_name: event.venue,
      area: event.area,
      type: event.type,
      logo_url: null,
      banner_url: event.cover,
      nextDate: event.date,
      href: `/eventos/${event.slug}`,
    }))
    .sort((a, b) => (a.nextDate || '').localeCompare(b.nextDate || ''))

  return uniqueById([...profileResults, ...fallbackEventResults])
    .sort((a, b) => (a.nextDate || '').localeCompare(b.nextDate || ''))
    .slice(0, 8)
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')?.trim() || ''

  if (query.length < 2) {
    return NextResponse.json({ results: [] })
  }

  const clients = getSupabaseClients()

  if (clients.length === 0) {
    return NextResponse.json(
      { error: 'Falta configurar Supabase para la busqueda.' },
      { status: 500 }
    )
  }

  for (const client of clients) {
    const results = await runProfileSearch(client, query).catch(() => [])

    if (results.length > 0) {
      return NextResponse.json({ results })
    }
  }

  return NextResponse.json({ results: [] })
}
