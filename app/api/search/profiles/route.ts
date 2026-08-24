import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type SearchEvent = {
  id: string
  event_profile_id: string | null
  title: string
  venue: string | null
  area: string | null
  type: string | null
  date: string
}

type EventProfile = {
  id: string
  name: string
  venue_name: string | null
  area: string | null
  type: string | null
  logo_url: string | null
  banner_url: string | null
}

function uniqueById<T extends { id: string }>(items: T[]) {
  return Array.from(new Map(items.map((item) => [item.id, item])).values())
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')?.trim() || ''

  if (query.length < 2) {
    return NextResponse.json({ results: [] })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: 'Falta configurar Supabase para la búsqueda.' },
      { status: 500 }
    )
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const today = new Date().toISOString().split('T')[0]

  const [{ data: nameMatches }, { data: venueMatches }, { data: areaMatches }, { data: typeMatches }] =
    await Promise.all([
      supabaseAdmin
        .from('promoter_event_profiles')
        .select('id, name, venue_name, area, type, logo_url, banner_url')
        .eq('is_active', true)
        .ilike('name', `%${query}%`)
        .limit(12),
      supabaseAdmin
        .from('promoter_event_profiles')
        .select('id, name, venue_name, area, type, logo_url, banner_url')
        .eq('is_active', true)
        .ilike('venue_name', `%${query}%`)
        .limit(12),
      supabaseAdmin
        .from('promoter_event_profiles')
        .select('id, name, venue_name, area, type, logo_url, banner_url')
        .eq('is_active', true)
        .ilike('area', `%${query}%`)
        .limit(12),
      supabaseAdmin
        .from('promoter_event_profiles')
        .select('id, name, venue_name, area, type, logo_url, banner_url')
        .eq('is_active', true)
        .ilike('type', `%${query}%`)
        .limit(12),
    ])

  const [{ data: titleEvents }, { data: venueEvents }, { data: areaEvents }, { data: typeEvents }] =
    await Promise.all([
      supabaseAdmin
        .from('events')
        .select('id, event_profile_id, title, venue, area, type, date')
        .eq('published', true)
        .eq('status', 'approved')
        .gte('date', today)
        .ilike('title', `%${query}%`)
        .order('date', { ascending: true })
        .limit(30),
      supabaseAdmin
        .from('events')
        .select('id, event_profile_id, title, venue, area, type, date')
        .eq('published', true)
        .eq('status', 'approved')
        .gte('date', today)
        .ilike('venue', `%${query}%`)
        .order('date', { ascending: true })
        .limit(30),
      supabaseAdmin
        .from('events')
        .select('id, event_profile_id, title, venue, area, type, date')
        .eq('published', true)
        .eq('status', 'approved')
        .gte('date', today)
        .ilike('area', `%${query}%`)
        .order('date', { ascending: true })
        .limit(30),
      supabaseAdmin
        .from('events')
        .select('id, event_profile_id, title, venue, area, type, date')
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
    ? await supabaseAdmin
        .from('promoter_event_profiles')
        .select('id, name, venue_name, area, type, logo_url, banner_url')
        .eq('is_active', true)
        .in('id', profileIdsFromEvents)
    : { data: [] as EventProfile[] }

  const profiles = uniqueById([
    ...((nameMatches || []) as EventProfile[]),
    ...((venueMatches || []) as EventProfile[]),
    ...((areaMatches || []) as EventProfile[]),
    ...((typeMatches || []) as EventProfile[]),
    ...((profilesFromEvents || []) as EventProfile[]),
  ])

  if (profiles.length === 0) {
    return NextResponse.json({ results: [] })
  }

  const { data: futureEvents } = await supabaseAdmin
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

  const nextDateByProfile = new Map<string, string>()

  ;(futureEvents || []).forEach((event) => {
    if (event.event_profile_id && !nextDateByProfile.has(event.event_profile_id)) {
      nextDateByProfile.set(event.event_profile_id, event.date)
    }
  })

  const results = profiles
    .map((profile) => ({
      ...profile,
      nextDate: nextDateByProfile.get(profile.id) || null,
    }))
    .filter((profile) => profile.nextDate)
    .sort((a, b) => (a.nextDate || '').localeCompare(b.nextDate || ''))
    .slice(0, 8)

  return NextResponse.json({ results })
}
