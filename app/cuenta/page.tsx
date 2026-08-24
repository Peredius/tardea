'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  CalendarDays,
  ChevronRight,
  Heart,
  LogOut,
  MapPin,
  MessageSquare,
  Pencil,
  Sparkles,
  UserRound,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Navbar } from '@/components/Navbar'
import { FavoriteButton } from '@/components/FavoriteButton'
import { canonicalizeMusicList, normalizeMusicKey } from '@/lib/music'

type AccountProfile = {
  user_alias: string | null
  first_name: string | null
  last_name: string | null
  mobile_phone: string | null
  municipality: string | null
  province: string | null
  music_preferences: string[] | null
  avatar_url: string | null
}

type FavoriteEvent = {
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
}

type FavoriteProfile = {
  id: string
  name: string
  venue_name: string | null
  area: string | null
  type: string | null
  music: string[] | null
  logo_url: string | null
  banner_url: string | null
  nextEvent: FavoriteEvent | null
  eventCount: number
}

type AccountTab = 'profile' | 'favorites' | 'suggestions' | 'compare' | 'chats'

function eventSeriesKey(event: FavoriteEvent) {
  return event.event_profile_id || `${normalizeMusicKey(event.title)}__${normalizeMusicKey(event.venue)}`
}

function getNearestEventBySeries(events: FavoriteEvent[]) {
  const groups = new Map<string, FavoriteEvent>()

  events.forEach((event) => {
    const key = eventSeriesKey(event)
    const current = groups.get(key)

    if (!current || event.date < current.date) {
      groups.set(key, event)
    }
  })

  return Array.from(groups.values()).sort((a, b) => a.date.localeCompare(b.date))
}

export default function AccountPage() {
  const [email, setEmail] = useState<string | null>(null)
  const [profile, setProfile] = useState<AccountProfile | null>(null)
  const [favoriteProfiles, setFavoriteProfiles] = useState<FavoriteProfile[]>([])
  const [favoriteEvents, setFavoriteEvents] = useState<FavoriteEvent[]>([])
  const [suggestedEvents, setSuggestedEvents] = useState<FavoriteEvent[]>([])
  const [activeTab, setActiveTab] = useState<AccountTab>('profile')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadAccount() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        window.location.href = '/login?type=user'
        return
      }

      setEmail(user.email ?? null)

      const { data: profileData } = await supabase
        .from('profiles')
        .select('user_alias, first_name, last_name, mobile_phone, municipality, province, music_preferences, avatar_url')
        .eq('id', user.id)
        .maybeSingle()

      setProfile(
        profileData
          ? {
              ...profileData,
              music_preferences: canonicalizeMusicList(profileData.music_preferences),
            }
          : null
      )
      setAvatarUrl(profileData?.avatar_url ?? '')

      const today = new Date().toISOString().split('T')[0]

      const { data: favorites } = await supabase
        .from('favorites')
        .select('event_id')
        .eq('user_id', user.id)

      const eventIds = (favorites || [])
        .map((favorite) => favorite.event_id)
        .filter(Boolean)

      if (eventIds.length > 0) {
        const { data: events } = await supabase
          .from('events')
          .select(
            'id, event_profile_id, slug, title, venue, area, date, start_time, end_time, type, music, price_from, cover'
          )
          .in('id', eventIds)
          .gte('date', today)
          .order('date', { ascending: true })

        const favoriteEventRows = (events || []).map((event) => ({
          ...event,
          music: canonicalizeMusicList(event.music),
        }))

        setFavoriteEvents(favoriteEventRows)
      } else {
        setFavoriteEvents([])
      }

      const { data: profileFavorites } = await supabase
        .from('event_profile_favorites')
        .select('event_profile_id')
        .eq('user_id', user.id)

      const profileIdsFromFavorites = new Set<string>(
        (profileFavorites || [])
          .map((favorite) => favorite.event_profile_id)
          .filter(Boolean)
      )

      const favoriteProfileIds = Array.from(profileIdsFromFavorites)

      if (favoriteProfileIds.length > 0) {
        const [{ data: profiles }, { data: profileEvents }] = await Promise.all([
          supabase
            .from('promoter_event_profiles')
            .select('id, name, venue_name, type, music, logo_url, banner_url')
            .in('id', favoriteProfileIds),
          supabase
            .from('events')
            .select(
              'id, event_profile_id, slug, title, venue, area, date, start_time, end_time, type, music, price_from, cover'
            )
            .in('event_profile_id', favoriteProfileIds)
            .eq('published', true)
            .eq('status', 'approved')
            .gte('date', today)
            .order('date', { ascending: true }),
        ])

        const eventsByProfile = new Map<string, FavoriteEvent[]>()

        ;(profileEvents || []).forEach((event) => {
          if (!event.event_profile_id) return
          const nextEvent = {
            ...event,
            music: canonicalizeMusicList(event.music),
          }
          eventsByProfile.set(event.event_profile_id, [
            ...(eventsByProfile.get(event.event_profile_id) || []),
            nextEvent,
          ])
        })

        const profilesById = new Map(
          (profiles || []).map((favoriteProfile) => [favoriteProfile.id, favoriteProfile])
        )

        const favoriteProfileCards: FavoriteProfile[] = favoriteProfileIds
          .map((profileId): FavoriteProfile | null => {
            const favoriteProfile = profilesById.get(profileId)
            const profileEventsList = eventsByProfile.get(profileId) || []
            const nextEvent = profileEventsList[0] || null

            if (!favoriteProfile && !nextEvent) return null

            return {
              id: profileId,
              name: favoriteProfile?.name || nextEvent?.title || 'Plan TARDEA',
              venue_name: favoriteProfile?.venue_name || nextEvent?.venue || null,
              area: nextEvent?.area || null,
              type: favoriteProfile?.type || nextEvent?.type || null,
              music: canonicalizeMusicList(favoriteProfile?.music || nextEvent?.music || []),
              logo_url: favoriteProfile?.logo_url || nextEvent?.cover || null,
              banner_url: favoriteProfile?.banner_url || nextEvent?.cover || null,
              nextEvent,
              eventCount: profileEventsList.length,
            }
          })
          .filter((favoriteProfile): favoriteProfile is FavoriteProfile => Boolean(favoriteProfile))
          .sort((a, b) => a.name.localeCompare(b.name))

        setFavoriteProfiles(favoriteProfileCards)
      } else {
        setFavoriteProfiles([])
      }

      const musicPreferences = profileData?.music_preferences || []
      const normalizedPreferences = new Set(musicPreferences.map(normalizeMusicKey))
      const { data: suggestionPool } = await supabase
        .from('events')
        .select(
          'id, event_profile_id, slug, title, venue, area, date, start_time, end_time, type, music, price_from, cover'
        )
        .eq('published', true)
        .eq('status', 'approved')
        .gte('date', today)
        .order('date', { ascending: true })
        .limit(80)

      const suggestions = (suggestionPool || []).filter((event) => {
        if (eventIds.includes(event.id)) return false
        if (normalizedPreferences.size === 0) return true

        return (event.music || []).some((musicItem: string) =>
          normalizedPreferences.has(normalizeMusicKey(musicItem))
        )
      })

      setSuggestedEvents(
        getNearestEventBySeries(
          suggestions.map((event) => ({
            ...event,
            music: canonicalizeMusicList(event.music),
          }))
        ).slice(0, 12)
      )

      setLoading(false)
    }

    loadAccount()
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    function syncAccountTab() {
      const tab = new URLSearchParams(window.location.search).get('tab')
      if (tab === 'profile' || tab === 'favorites' || tab === 'suggestions' || tab === 'compare' || tab === 'chats') {
        setActiveTab(tab)
      }
    }

    function handleAccountTabChanged(event: Event) {
      const tab = (event as CustomEvent<{ tab?: string }>).detail?.tab
      if (tab === 'profile' || tab === 'favorites' || tab === 'suggestions' || tab === 'compare' || tab === 'chats') {
        setActiveTab(tab)
      }
    }

    syncAccountTab()
    window.addEventListener('popstate', syncAccountTab)
    window.addEventListener('tardeaAccountTabChanged', handleAccountTabChanged)

    return () => {
      window.removeEventListener('popstate', syncAccountTab)
      window.removeEventListener('tardeaAccountTabChanged', handleAccountTabChanged)
    }
  }, [])

  function changeAccountTab(tab: AccountTab) {
    setActiveTab(tab)

    if (typeof window !== 'undefined') {
      const nextUrl = `/cuenta?tab=${tab}`
      window.history.replaceState(null, '', nextUrl)
    }
  }

  useEffect(() => {
    if (activeTab === 'favorites') {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    }
  }, [activeTab])

  const displayName = useMemo(() => {
    if (profile?.user_alias?.trim()) return profile.user_alias.trim()

    const fullName = [profile?.first_name, profile?.last_name]
      .filter(Boolean)
      .join(' ')
      .trim()

    if (fullName) return fullName
    if (email) return email.split('@')[0]
    return 'Usuario'
  }, [email, profile])

  const population = profile?.municipality || profile?.province || 'Población sin definir'

  const initials = displayName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  async function handleSignOut() {
    setShowSignOutConfirm(false)
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="container-page py-16">
          <p className="text-slate-400">Cargando cuenta...</p>
        </div>
      </main>
    )
  }

  return (
    <>
      <Navbar />
      <main
        className={
          activeTab === 'favorites'
            ? 'h-[calc(100dvh-86px)] overflow-hidden bg-hero-gradient text-slate-100 md:min-h-screen md:h-auto md:overflow-visible'
            : 'min-h-screen bg-hero-gradient text-slate-100'
        }
      >
      <div
        className={
          activeTab === 'favorites'
            ? 'mx-auto h-full w-full max-w-5xl overflow-hidden pt-0 md:min-h-screen md:pb-12 md:pt-10'
            : 'mx-auto min-h-screen w-full max-w-5xl pb-12 pt-8 md:pt-10'
        }
      >
        {activeTab === 'profile' && (
        <section className="px-5 pt-3 md:pt-8">
          <div className="grid grid-cols-[auto_1fr] items-center gap-5">
            <div className="relative">
              <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 via-fuchsia-500 to-orange-400 p-1 sm:h-32 sm:w-32">
                <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-slate-900 text-3xl font-black text-white sm:text-4xl">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    initials || <UserRound className="h-10 w-10" />
                  )}
                </span>
              </div>
              <button
                type="button"
                onClick={() => changeAccountTab('chats')}
                className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center text-white drop-shadow-[0_10px_20px_rgba(0,0,0,0.45)] transition hover:text-brand-500 sm:h-10 sm:w-10"
                aria-label="Abrir chats"
              >
                <MessageSquare className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={2.4} />
                <span className="absolute -right-0.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[9px] font-black text-white ring-2 ring-slate-950">
                  0
                </span>
              </button>
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-xl font-black text-white sm:text-3xl">
                {displayName}
              </h1>
              <p className="mt-1 truncate text-xs text-slate-400 sm:text-sm">
                {population}
              </p>

              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <button
                  type="button"
                  onClick={() => changeAccountTab('favorites')}
                  className="rounded-2xl px-2 py-1 transition hover:bg-white/10"
                >
                  <p className="text-2xl font-black text-white">
                    {favoriteProfiles.length + favoriteEvents.length}
                  </p>
                  <p className="text-xs text-slate-300">Favoritos</p>
                  <p className="mt-1 text-[10px] font-semibold text-slate-500">
                    Visitados: próximamente
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => changeAccountTab('favorites')}
                  className="rounded-2xl px-2 py-1 transition hover:bg-white/10"
                >
                  <p className="text-2xl font-black text-white">
                    {favoriteProfiles.length}
                  </p>
                  <p className="text-xs text-slate-300">Planes</p>
                </button>
                <button
                  type="button"
                  onClick={() => changeAccountTab('chats')}
                  className="rounded-2xl px-2 py-1 transition hover:bg-white/10"
                >
                  <p className="text-2xl font-black text-white">0</p>
                  <p className="text-xs text-slate-300">Chats</p>
                </button>
              </div>
            </div>
          </div>
        </section>
        )}

        {activeTab === 'profile' && (
          <section className="px-5 py-5">
            <div className="hidden space-y-8 md:block">
              <section>
                <div className="mb-4 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-brand-500">
                      Para ti
                    </p>
                    <h2 className="mt-1 text-2xl font-black text-white">
                      Según tus gustos
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => changeAccountTab('suggestions')}
                    className="text-sm font-bold text-brand-400 transition hover:text-brand-300"
                  >
                    Ver todo →
                  </button>
                </div>

                {suggestedEvents.length > 0 ? (
                  <div className="grid grid-cols-4 gap-4">
                    {suggestedEvents.slice(0, 4).map((event) => (
                      <Link
                        key={event.id}
                        href={`/eventos/${event.slug}`}
                        className="group relative aspect-[9/16] overflow-hidden rounded-2xl border border-white/10 bg-slate-900"
                      >
                        <div
                          className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105"
                          style={{
                            backgroundImage: `url(${
                              event.cover ||
                              'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80'
                            })`,
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/55 to-transparent" />
                        <FavoriteButton
                          eventId={event.id}
                          eventProfileId={event.event_profile_id}
                          className="absolute right-3 top-3 z-20"
                        />
                        <div className="absolute inset-x-0 bottom-0 p-4">
                          <div className="mb-2 flex flex-wrap gap-1.5">
                            <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
                              {event.type}
                            </span>
                            <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
                              {event.area}
                            </span>
                          </div>
                          <h3 className="line-clamp-2 text-sm font-black uppercase text-white">
                            {event.title}
                          </h3>
                          <p className="mt-1 line-clamp-2 text-xs text-slate-200">
                            {event.venue} · {new Date(event.date).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-400">
                    Completa tus gustos para ver sugerencias más afinadas.
                  </div>
                )}
              </section>

              <section>
                <div className="mb-4 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-brand-500">
                      Favoritos
                    </p>
                    <h2 className="mt-1 text-2xl font-black text-white">
                      Planes y fechas guardadas
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => changeAccountTab('favorites')}
                    className="text-sm font-bold text-brand-400 transition hover:text-brand-300"
                  >
                    Ver favoritos →
                  </button>
                </div>

                {favoriteProfiles.length + favoriteEvents.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                      <h3 className="text-lg font-black text-white">Planes favoritos</h3>
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        {favoriteProfiles.slice(0, 2).map((favoriteProfile) => {
                          const nextEvent = favoriteProfile.nextEvent
                          const cover =
                            favoriteProfile.logo_url ||
                            favoriteProfile.banner_url ||
                            nextEvent?.cover ||
                            'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80'

                          return (
                            <Link
                              key={favoriteProfile.id}
                              href={`/eventos/grupo/${favoriteProfile.id}`}
                              className="group relative aspect-[9/16] overflow-hidden rounded-2xl border border-white/10 bg-slate-900"
                            >
                              <div
                                className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105"
                                style={{ backgroundImage: `url(${cover})` }}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/55 to-transparent" />
                              <div className="absolute inset-x-0 bottom-0 p-3">
                                <h4 className="line-clamp-2 text-xs font-black uppercase text-white">
                                  {favoriteProfile.name}
                                </h4>
                                <p className="mt-1 text-[11px] font-bold text-brand-400">
                                  {favoriteProfile.eventCount === 1
                                    ? '1 fecha'
                                    : `${favoriteProfile.eventCount} fechas`}
                                </p>
                              </div>
                            </Link>
                          )
                        })}
                      </div>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                      <h3 className="text-lg font-black text-white">Fechas guardadas</h3>
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        {favoriteEvents.slice(0, 2).map((event) => (
                          <Link
                            key={event.id}
                            href={`/eventos/${event.slug}`}
                            className="group relative aspect-[9/16] overflow-hidden rounded-2xl border border-white/10 bg-slate-900"
                          >
                            <div
                              className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105"
                              style={{
                                backgroundImage: `url(${
                                  event.cover ||
                                  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80'
                                })`,
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/55 to-transparent" />
                            <div className="absolute inset-x-0 bottom-0 p-3">
                              <h4 className="line-clamp-2 text-xs font-black uppercase text-white">
                                {event.title}
                              </h4>
                              <p className="mt-1 text-[11px] text-slate-200">
                                {new Date(event.date).toLocaleDateString('es-ES')}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-400">
                    Cuando guardes planes o fechas, aparecerán aquí.
                  </div>
                )}
              </section>

              <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-brand-500" />
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-brand-500">
                      Chat
                    </p>
                    <h2 className="mt-1 text-2xl font-black text-white">
                      Conversaciones
                    </h2>
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-400">
                  Aquí centralizaremos chats con la app y con promotores.
                </p>
              </section>
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-white/5 md:hidden">
              <p className="px-4 pt-4 text-[11px] font-black uppercase tracking-[0.2em] text-brand-500">
                Preferencias
              </p>

              <div className="mt-3 divide-y divide-white/10">
                <Link
                  href="/cuenta/perfil"
                  className="flex min-h-12 items-center justify-between px-4 py-3 text-sm font-bold text-white transition hover:bg-white/10"
                >
                  <span className="flex items-center gap-3">
                    <Pencil className="h-4 w-4 text-brand-500" />
                    Editar perfil
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-500" />
                </Link>

                <Link
                  href="/cuenta/detalles"
                  className="flex min-h-12 items-center justify-between px-4 py-3 text-sm font-bold text-slate-200 transition hover:bg-white/10 hover:text-white"
                >
                  <span className="flex items-center gap-3">
                    <UserRound className="h-4 w-4 text-brand-500" />
                    Detalles de la cuenta
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-500" />
                </Link>

                <button
                  type="button"
                  onClick={() => setShowSignOutConfirm(true)}
                  className="mt-3 flex min-h-12 w-full items-center justify-center gap-3 rounded-2xl border border-brand-500/40 px-4 py-3 text-center text-sm font-black text-white transition hover:bg-brand-500/10"
                >
                  <LogOut className="h-4 w-4 text-brand-500" />
                  Cerrar sesión
                </button>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'favorites' && (
          <section className="flex h-full flex-col overflow-hidden px-0 pb-24 pt-4 md:h-auto md:overflow-visible md:pb-28">
            {favoriteProfiles.length + favoriteEvents.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <Heart className="mx-auto h-10 w-10 text-brand-500" />
                <h2 className="mt-4 text-2xl font-bold text-white">
                  Sin favoritos todavía
                </h2>
                <Link href="/" className="btn-primary mt-5">
                  Buscar planes
                </Link>
              </div>
            ) : (
              <>
              {favoriteEvents.length > 0 && (
                <div className="min-h-0 shrink-0 pb-4 md:pb-5">
                  <div className="px-5 pb-3">
                    <h2 className="text-xl font-black text-white">
                      Fechas guardadas
                    </h2>
                  </div>

                  <div className="flex gap-2.5 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {favoriteEvents.map((event) => (
                      <Link
                        key={event.id}
                        href={`/eventos/${event.slug}`}
                        className="group relative aspect-[9/16] w-[31vw] max-w-[136px] shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-slate-900"
                      >
                        <div
                          className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105"
                          style={{
                            backgroundImage: `url(${
                              event.cover ||
                              'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80'
                            })`,
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />

                        <div className="absolute left-2 top-2 rounded-full bg-brand-500 px-2 py-0.5 text-[9px] font-black text-white">
                          Fecha
                        </div>

                        <div className="absolute inset-x-0 bottom-0 p-2.5">
                          <div className="mb-2 flex flex-wrap gap-1">
                            <span className="rounded-full bg-white/15 px-2 py-0.5 text-[9px] font-medium text-white backdrop-blur">
                              {event.type}
                            </span>
                            <span className="rounded-full bg-white/15 px-2 py-0.5 text-[9px] font-medium text-white backdrop-blur">
                              {event.area}
                            </span>
                          </div>

                          <h2 className="line-clamp-2 text-[11px] font-black uppercase leading-tight text-white">
                            {event.title}
                          </h2>
                          <p className="mt-1 line-clamp-2 text-[9px] text-slate-200">
                            {event.venue} ·{' '}
                            {new Date(event.date).toLocaleDateString('es-ES')} ·{' '}
                            {event.start_time?.slice(0, 5)}
                            {event.end_time ? ` - ${event.end_time.slice(0, 5)}` : ''}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {favoriteProfiles.length > 0 && (
                <div className="min-h-0 shrink-0 pt-2">
                  <div className="px-5 pb-3">
                    <h2 className="text-xl font-black text-white">
                      Planes favoritos
                    </h2>
                  </div>

                  <div className="flex gap-2.5 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {favoriteProfiles.map((favoriteProfile) => {
                      const nextEvent = favoriteProfile.nextEvent
                      const cover =
                        favoriteProfile.logo_url ||
                        favoriteProfile.banner_url ||
                        nextEvent?.cover ||
                        'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80'

                      return (
                        <Link
                          key={favoriteProfile.id}
                          href={`/eventos/grupo/${favoriteProfile.id}`}
                          className="group relative aspect-[9/16] w-[31vw] max-w-[136px] shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-slate-900"
                        >
                          <div
                            className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105"
                            style={{ backgroundImage: `url(${cover})` }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/55 to-transparent" />

                          <div className="absolute left-2 top-2 rounded-full bg-brand-500 px-2 py-0.5 text-[9px] font-black text-white">
                            Favorito
                          </div>

                          <div className="absolute inset-x-0 bottom-0 p-2.5">
                            <div className="mb-2 flex flex-wrap gap-1">
                              {favoriteProfile.type && (
                                <span className="rounded-full bg-white/15 px-2 py-0.5 text-[9px] font-medium text-white backdrop-blur">
                                  {favoriteProfile.type}
                                </span>
                              )}
                              {favoriteProfile.area && (
                                <span className="rounded-full bg-white/15 px-2 py-0.5 text-[9px] font-medium text-white backdrop-blur">
                                  {favoriteProfile.area}
                                </span>
                              )}
                            </div>

                            <h2 className="line-clamp-2 text-[11px] font-black uppercase leading-tight text-white">
                              {favoriteProfile.name}
                            </h2>
                            <p className="mt-1 line-clamp-1 text-[9px] text-slate-200">
                              {favoriteProfile.venue_name || nextEvent?.venue || 'Ficha de evento'}
                            </p>
                            <p className="mt-1 text-[9px] font-bold text-brand-400">
                              {favoriteProfile.eventCount === 1
                                ? '1 fecha'
                                : `${favoriteProfile.eventCount} fechas`}
                            </p>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}
              </>
            )}
          </section>
        )}

        {activeTab === 'suggestions' && (
          <section className="px-5 pb-28 pt-4 md:pt-8">
            {suggestedEvents.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <Sparkles className="mx-auto h-10 w-10 text-brand-500" />
                <h2 className="mt-4 text-2xl font-bold text-white">
                  Sin sugerencias todavía
                </h2>
                <p className="mx-auto mt-2 max-w-sm text-sm text-slate-400">
                  Cuando tengamos eventos que coincidan con tus gustos,
                  aparecerán aquí.
                </p>
                <Link href="/cuenta/perfil" className="btn-primary mt-5">
                  Editar gustos
                </Link>
              </div>
            ) : (
              <>
                <div className="mb-5">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-500">
                    Para ti
                  </p>
                  <h2 className="mt-2 text-3xl font-black text-white">
                    Según tus gustos
                  </h2>
                  {profile?.music_preferences?.length ? (
                    <p className="mt-2 text-sm text-slate-400">
                      {profile.music_preferences.join(', ')}
                    </p>
                  ) : (
                    <p className="mt-2 text-sm text-slate-400">
                      Destacados hasta que completes tus gustos.
                    </p>
                  )}
                </div>

                <div className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {suggestedEvents.map((event) => (
                    <Link
                      key={event.id}
                      href={`/eventos/${event.slug}`}
                      className="group relative h-[520px] w-[78vw] max-w-[330px] shrink-0 snap-center overflow-hidden rounded-[28px] border border-white/10 bg-slate-900 shadow-2xl shadow-black/30"
                    >
                      <div
                        className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105"
                        style={{
                          backgroundImage: `url(${
                            event.cover ||
                            'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80'
                          })`,
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/55 to-slate-950/10" />

                      <div className="absolute left-4 top-4 rounded-full bg-brand-500 px-3 py-1.5 text-xs font-black text-white shadow-lg shadow-brand-500/20">
                        Para ti
                      </div>
                      <FavoriteButton
                        eventId={event.id}
                        eventProfileId={event.event_profile_id}
                        className="absolute right-4 top-4 z-20"
                      />

                      <div className="absolute inset-x-0 bottom-0 p-5">
                        <div className="mb-3 flex flex-wrap gap-2">
                          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                            {event.type}
                          </span>
                          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                            {event.area}
                          </span>
                          {(event.music || []).slice(0, 2).map((musicItem) => (
                            <span
                              key={musicItem}
                              className="rounded-full bg-brand-500/80 px-3 py-1 text-xs font-semibold text-white backdrop-blur"
                            >
                              {musicItem}
                            </span>
                          ))}
                        </div>

                        <h2 className="line-clamp-2 text-2xl font-black uppercase leading-tight text-white">
                          {event.title}
                        </h2>
                        <p className="mt-3 line-clamp-2 text-sm font-medium text-slate-200">
                          {event.venue} ·{' '}
                          {new Date(event.date).toLocaleDateString('es-ES')} ·{' '}
                          {event.start_time?.slice(0, 5)}
                          {event.end_time ? ` - ${event.end_time.slice(0, 5)}` : ''}
                        </p>
                        <p className="mt-4 text-sm font-black text-brand-400">
                          Ver evento →
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </section>
        )}

        {activeTab === 'compare' && (
          <section className="px-5 py-12">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
              <CalendarDays className="mx-auto h-10 w-10 text-brand-500" />
              <h2 className="mt-4 text-2xl font-bold text-white">
                Encuestas para grupos
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Aqui compararemos eventos para mandarlos por WhatsApp y que el
                grupo pueda elegir plan.
              </p>
            </div>
          </section>
        )}

        {activeTab === 'chats' && (
          <section className="px-5 py-12">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
              <MapPin className="mx-auto h-10 w-10 text-brand-500" />
              <h2 className="mt-4 text-2xl font-bold text-white">
                Chats
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Aqui centralizaremos conversaciones y dudas sobre eventos.
              </p>
            </div>
          </section>
        )}
      </div>

      {showSignOutConfirm && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/80 px-5 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-[28px] border border-brand-500/35 bg-slate-950 p-5 shadow-2xl shadow-brand-500/10">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/15 text-brand-500">
              <LogOut className="h-5 w-5" />
            </div>

            <p className="text-xs font-black uppercase tracking-[0.22em] text-brand-500">
              Confirmación
            </p>
            <h2 className="mt-2 text-2xl font-black text-white">¿Cerrar sesión?</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Saldrás de tu cuenta en este dispositivo.
            </p>

            <div className="mt-6 grid gap-3">
              <button
                type="button"
                onClick={handleSignOut}
                className="min-h-12 rounded-2xl bg-brand-500 px-4 text-sm font-black text-white transition hover:bg-brand-400 disabled:opacity-60"
              >
                Sí, cerrar sesión
              </button>
              <button
                type="button"
                onClick={() => setShowSignOutConfirm(false)}
                className="min-h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-black text-white transition hover:bg-white/10 disabled:opacity-60"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      </main>
    </>
  )
}
