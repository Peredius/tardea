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

  const profileSelect = 'id, name, venue_name, type, logo_url, banner_url'
  const eventSelect = 'id, event_profile_id, slug, title, venue, area, type, date, cover'

  const [{ data: nameMatches }, { data: venueMatches }, { data: typeMatches }] =
    await Promise.all([
      supabaseClient
        .from('promoter_event_profiles')
        .select(profileSelect)
        .eq('is_active', true)
        .ilike('name', `%${query}%`)
        .limit(12),
      supabaseClient
        .from('promoter_event_profiles')
        .select(profileSelect)
        .eq('is_active', true)
        .ilike('venue_name', `%${query}%`)
        .limit(12),
      supabaseClient
        .from('promoter_event_profiles')
        .select(profileSelect)
        .eq('is_active', true)
        .ilike('type', `%${query}%`)
        .limit(12),
    ])

  const [{ data: titleEvents }, { data: venueEvents }, { data: areaEvents }, { data: typeEvents }] =
    await Promise.all([
      supabaseClient
        .from('events')
        .select(eventSelect)
        .eq('published', true)
        .eq('status', 'approved')
        .gte('date', today)
        .ilike('title', `%${query}%`)
        .order('date', { ascending: true })
        .limit(30),
      supabaseClient
        .from('events')
        .select(eventSelect)
        .eq('published', true)
        .eq('status', 'approved')
        .gte('date', today)
        .ilike('venue', `%${query}%`)
        .order('date', { ascending: true })
        .limit(30),
      supabaseClient
        .from('events')
        .select(eventSelect)
        .eq('published', true)
        .eq('status', 'approved')
        .gte('date', today)
        .ilike('area', `%${query}%`)
        .order('date', { ascending: true })
        .limit(30),
      supabaseClient
        .from('events')
        .select(eventSelect)
        .eq('published', true)
        .eq('status', 'approved')
        .gte('date', today)
        .ilike('type', `%${query}%`)
        .order('date', { ascending: true })
        .limit(30),
    ])

  const eventMatches = uniqueById([
    ...((titleEvents || []) as SearchEvent[]),
    ...((venueEvents || []) as SearchEvent[]),
    ...((areaEvents || []) as SearchEvent[]),
    ...((typeEvents || []) as SearchEvent[]),
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
    ...((nameMatches || []) as EventProfile[]),
    ...((venueMatches || []) as EventProfile[]),
    ...((typeMatches || []) as EventProfile[]),
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

  return uniqueById([...profileResults, ...fallbackEventResults]).slice(0, 8)
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
