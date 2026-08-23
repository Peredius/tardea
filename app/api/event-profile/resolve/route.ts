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

function getEventSeriesSlug(event: any) {
  const title = normalizeText(event.title || 'evento')
    .replace(/\b\d{1,2}\s*(?:de\s*)?(?:ene|enero|feb|febrero|mar|marzo|abr|abril|may|mayo|jun|junio|jul|julio|ago|agosto|sep|septiembre|oct|octubre|nov|noviembre|dic|diciembre)\b/gi, ' ')
    .replace(/\b\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?\b/g, ' ')
    .replace(/\b20\d{2}\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '')

  return [event.type || 'Tardeo', title || 'evento'].filter(Boolean).join('__').toLowerCase()
}

function getProfileSlug(event: any) {
  return getEventSeriesSlug(event).replace(/__/g, '-').replace(/^-+|-+$/g, '') || 'evento'
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
    | { slug?: string; createIfMissing?: boolean }
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
    .select('id, slug, title, venue, area, address, maps_url, type, music, audience, price_from, cover, description, source_url, website_url, instagram_url, tiktok_url, user_id, event_profile_id')
    .eq('slug', payload.slug)
    .maybeSingle()

  if (eventError || !event) {
    return NextResponse.json(
      { error: eventError?.message || 'Evento no encontrado.' },
      { status: 404 }
    )
  }

  let eventProfileId = event.event_profile_id || ''
  const seriesSlug = getEventSeriesSlug(event)

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

  if (!eventProfileId && payload.createIfMissing) {
    const today = new Date().toISOString().split('T')[0]
    const { data: publicEvents } = await supabaseAdmin
      .from('events')
      .select('id, slug, title, venue, area, address, maps_url, type, music, audience, price_from, cover, description, source_url, website_url, instagram_url, tiktok_url, user_id, event_profile_id, published, status, date')
      .eq('published', true)
      .eq('status', 'approved')
      .gte('date', today)
      .limit(1000)

    const relatedEvents = (publicEvents || []).filter(
      (publicEvent) => getEventSeriesSlug(publicEvent) === seriesSlug
    )
    const baseEvent = relatedEvents[0] || event

    const { data: newProfile } = await supabaseAdmin
      .from('promoter_event_profiles')
      .insert({
        user_id: baseEvent.user_id || null,
        name: baseEvent.title || event.title || 'Plan TARDEA',
        slug: getProfileSlug(baseEvent),
        logo_url: baseEvent.cover || event.cover || null,
        banner_url: baseEvent.cover || event.cover || null,
        description: baseEvent.description || event.description || null,
        type: baseEvent.type || event.type || 'Tardeo',
        venue_name: baseEvent.venue || event.venue || null,
        area: baseEvent.area || event.area || null,
        address: baseEvent.address || event.address || null,
        maps_url: baseEvent.maps_url || event.maps_url || null,
        music: Array.isArray(baseEvent.music) ? baseEvent.music : [],
        audience: baseEvent.audience || event.audience || 'Mixto',
        price_from: baseEvent.price_from ?? event.price_from ?? 0,
        website_url: baseEvent.website_url || event.website_url || baseEvent.source_url || event.source_url || null,
        instagram_url: baseEvent.instagram_url || event.instagram_url || null,
        tiktok_url: baseEvent.tiktok_url || event.tiktok_url || null,
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .maybeSingle()

    eventProfileId = newProfile?.id || ''

    if (eventProfileId) {
      const relatedIds = relatedEvents.map((relatedEvent) => relatedEvent.id).filter(Boolean)
      if (relatedIds.length > 0) {
        await supabaseAdmin
          .from('events')
          .update({ event_profile_id: eventProfileId })
          .in('id', relatedIds)
      }
    }
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
    seriesSlug,
  })
}
