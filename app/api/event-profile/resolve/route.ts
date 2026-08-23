import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function getTokens(value: string) {
  return normalizeText(value)
    .split(' ')
    .filter((token) => token.length > 2)
}

function getMatchScore(event: any, profile: any) {
  const eventTitle = normalizeText(event.title || '')
  const eventVenue = normalizeText(event.venue || '')
  const eventArea = normalizeText(event.area || '')
  const eventType = normalizeText(event.type || '')
  const profileName = normalizeText(profile.name || '')
  const profileSlug = normalizeText(profile.slug || '')
  const profileVenue = normalizeText(profile.venue_name || '')
  const profileArea = normalizeText(profile.area || '')
  const profileType = normalizeText(profile.type || '')

  let score = 0

  if (eventTitle && profileName === eventTitle) score += 12
  if (eventTitle && profileName.includes(eventTitle)) score += 8
  if (eventTitle && profileSlug.includes(eventTitle)) score += 6

  const profileText = `${profileName} ${profileSlug} ${profileVenue}`
  const commonTitleTokens = getTokens(eventTitle).filter((token) =>
    profileText.includes(token)
  )
  score += commonTitleTokens.length * 3

  if (eventVenue && profileVenue === eventVenue) score += 5
  if (
    eventVenue &&
    profileVenue &&
    (profileVenue.includes(eventVenue) || eventVenue.includes(profileVenue))
  ) {
    score += 4
  }

  if (eventArea && profileArea === eventArea) score += 2
  if (eventType && profileType === eventType) score += 1

  return score
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as
    | { slug?: string }
    | null

  if (!payload?.slug) {
    return NextResponse.json({ error: 'Falta el evento.' }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: 'Falta configurar Supabase seguro.' },
      { status: 500 }
    )
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const { data: event, error: eventError } = await supabaseAdmin
    .from('events')
    .select('id, slug, title, venue, area, type, event_profile_id')
    .eq('slug', payload.slug)
    .maybeSingle()

  if (eventError || !event) {
    return NextResponse.json(
      { error: eventError?.message || 'Evento no encontrado.' },
      { status: 404 }
    )
  }

  let eventProfileId = event.event_profile_id || ''

  if (!eventProfileId) {
    const { data: sameTitleEvent } = await supabaseAdmin
      .from('events')
      .select('event_profile_id')
      .eq('title', event.title)
      .not('event_profile_id', 'is', null)
      .limit(1)
      .maybeSingle()

    eventProfileId = sameTitleEvent?.event_profile_id || ''
  }

  if (!eventProfileId && event.venue) {
    const { data: sameVenueEvent } = await supabaseAdmin
      .from('events')
      .select('event_profile_id')
      .eq('venue', event.venue)
      .eq('type', event.type || 'Tardeo')
      .not('event_profile_id', 'is', null)
      .limit(1)
      .maybeSingle()

    eventProfileId = sameVenueEvent?.event_profile_id || ''
  }

  if (!eventProfileId) {
    const { data: candidateProfiles } = await supabaseAdmin
      .from('promoter_event_profiles')
      .select('id, name, slug, venue_name, area, type')
      .limit(1000)

    const bestProfile = (candidateProfiles || [])
      .map((profile) => ({
        profile,
        score: getMatchScore(event, profile),
      }))
      .filter((item) => item.score >= 6)
      .sort((a, b) => b.score - a.score)[0]?.profile

    eventProfileId = bestProfile?.id || ''
  }

  if (eventProfileId && !event.event_profile_id) {
    await supabaseAdmin
      .from('events')
      .update({ event_profile_id: eventProfileId })
      .eq('id', event.id)
  }

  return NextResponse.json({
    ok: true,
    eventProfileId,
  })
}
