'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, CalendarDays, ExternalLink, MapPin, Music4 } from 'lucide-react'
import { FavoriteButton } from '@/components/FavoriteButton'
import { Footer } from '@/components/Footer'
import { Navbar } from '@/components/Navbar'
import { supabase } from '@/lib/supabase'
import { canonicalizeMusicList } from '@/lib/music'

type SeriesEvent = {
  id: string
  event_profile_id: string | null
  slug: string
  title: string
  venue: string
  area: string
  date: string
  start_time: string | null
  end_time: string | null
  type: string
  music: string[] | null
  price_from: number | null
  cover: string | null
  source_url: string | null
}

type EventProfile = {
  id: string
  name: string
  logo_url: string | null
  banner_url: string | null
  description: string | null
  type: string | null
  venue_name: string | null
  area: string | null
  address: string | null
  maps_url: string | null
  music: string[] | null
  audience: string | null
  price_from: number | null
  instagram_url: string | null
  tiktok_url: string | null
  website_url: string | null
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

export default function EventGroupPage() {
  const params = useParams()
  const profileId = params.id as string
  const [profile, setProfile] = useState<EventProfile | null>(null)
  const [events, setEvents] = useState<SeriesEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadProfile() {
      const today = new Date().toISOString().split('T')[0]

      const [{ data: profileData }, { data: eventData }] = await Promise.all([
        supabase
          .from('promoter_event_profiles')
          .select('*')
          .eq('id', profileId)
          .maybeSingle(),
        supabase
          .from('events')
          .select(
            'id, event_profile_id, slug, title, venue, area, date, start_time, end_time, type, music, price_from, cover, source_url'
          )
          .eq('event_profile_id', profileId)
          .eq('published', true)
          .eq('status', 'approved')
          .gte('date', today)
          .order('date', { ascending: true }),
      ])

      setProfile(profileData || null)
      setEvents(
        (eventData || []).map((event) => ({
          ...event,
          music: canonicalizeMusicList(event.music),
        }))
      )
      setLoading(false)
    }

    if (profileId) loadProfile()
  }, [profileId])

  const fallbackCover = useMemo(
    () =>
      profile?.banner_url ||
      profile?.logo_url ||
      events[0]?.cover ||
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
    [events, profile]
  )

  if (loading) {
    return (
      <main>
        <Navbar />
        <section className="container-page py-16 text-slate-400">Cargando plan...</section>
      </main>
    )
  }

  if (!profile && events.length === 0) {
    return (
      <main>
        <Navbar />
        <section className="container-page py-16">
          <Link href="/cuenta?tab=favorites" className="btn-secondary mb-8 inline-flex">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver a favoritos
          </Link>
          <h1 className="text-3xl font-bold text-white">Ficha no encontrada</h1>
        </section>
        <Footer />
      </main>
    )
  }

  const title = profile?.name || events[0]?.title || 'Tardeo'
  const venue = profile?.venue_name || events[0]?.venue
  const area = profile?.area || events[0]?.area
  const music = canonicalizeMusicList(profile?.music || events[0]?.music || [])

  return (
    <main>
      <Navbar />

      <section className="relative overflow-hidden border-b border-white/10">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25"
          style={{ backgroundImage: `url(${fallbackCover})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/50 via-slate-950/85 to-slate-950" />

        <div className="container-page relative py-12 md:py-20">
          <Link href="/cuenta?tab=favorites" className="btn-secondary mb-8 inline-flex">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver a favoritos
          </Link>

          <div className="grid gap-8 lg:grid-cols-[1fr_0.7fr] lg:items-end">
            <div>
              <div className="flex items-center gap-4">
                {profile?.logo_url && (
                  <img
                    src={profile.logo_url}
                    alt={title}
                    className="h-16 w-16 rounded-2xl object-cover"
                  />
                )}
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-500">
                    Ficha del plan
                  </p>
                  <h1 className="mt-2 text-4xl font-black tracking-tight text-white md:text-6xl">
                    {title}
                  </h1>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {profile?.type && <span className="badge">{profile.type}</span>}
                {area && <span className="badge">{area}</span>}
                {music.slice(0, 3).map((musicItem) => (
                  <span key={musicItem} className="badge">
                    <Music4 className="mr-1 h-3.5 w-3.5" />
                    {musicItem}
                  </span>
                ))}
              </div>

              {profile?.description && (
                <p className="mt-6 max-w-3xl text-base leading-7 text-slate-300">
                  {profile.description}
                </p>
              )}
            </div>

            <div className="card p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-400">Próximas fechas aprobadas</p>
                  <p className="mt-1 text-3xl font-black text-white">{events.length}</p>
                </div>
                <FavoriteButton eventProfileId={profileId} compact={false} />
              </div>

              {venue && (
                <p className="mt-4 flex items-center gap-2 text-sm text-slate-300">
                  <MapPin className="h-4 w-4 text-brand-500" />
                  {venue}
                </p>
              )}

              <div className="mt-5 flex flex-wrap gap-2">
                {profile?.website_url && (
                  <a href={profile.website_url} target="_blank" rel="noopener noreferrer" className="btn-secondary">
                    Web <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                )}
                {profile?.instagram_url && (
                  <a href={profile.instagram_url} target="_blank" rel="noopener noreferrer" className="btn-secondary">
                    Instagram
                  </a>
                )}
                {profile?.tiktok_url && (
                  <a href={profile.tiktok_url} target="_blank" rel="noopener noreferrer" className="btn-secondary">
                    TikTok
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-12">
        <h2 className="text-3xl font-black text-white">Próximas fechas</h2>

        {events.length === 0 ? (
          <div className="card mt-6 p-8 text-slate-400">
            Todavía no hay fechas próximas aprobadas para este plan.
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {events.map((event) => (
              <article
                key={event.id}
                className="group overflow-hidden rounded-3xl border border-white/10 bg-white/5"
              >
                <Link
                  href={`/eventos/${event.slug}`}
                  className="relative block aspect-[9/16] overflow-hidden"
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105"
                    style={{
                      backgroundImage: `url(${event.cover || fallbackCover})`,
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <p className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white backdrop-blur">
                      {formatDate(event.date)}
                    </p>
                    <h3 className="mt-3 line-clamp-2 text-lg font-black uppercase text-white">
                      {event.title}
                    </h3>
                    <p className="mt-2 text-sm text-slate-200">
                      {event.start_time?.slice(0, 5)}
                      {event.end_time ? ` - ${event.end_time.slice(0, 5)}` : ''}
                    </p>
                  </div>
                </Link>

                <div className="flex gap-2 p-3">
                  <Link href={`/eventos/${event.slug}`} className="btn-secondary flex-1">
                    Ver
                  </Link>
                  {event.source_url && (
                    <a
                      href={event.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary flex-1"
                    >
                      Entradas
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </main>
  )
}
