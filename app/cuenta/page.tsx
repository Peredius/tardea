'use client'

import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  CalendarDays,
  Heart,
  MapPin,
  MessageSquare,
  Plus,
  Search,
  Sparkles,
  UserRound,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Navbar } from '@/components/Navbar'
import { FavoriteButton } from '@/components/FavoriteButton'
import { canonicalizeMusicList, normalizeMusicKey } from '@/lib/music'

type AccountProfile = {
  first_name: string | null
  last_name: string | null
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
  const avatarInputRef = useRef<HTMLInputElement | null>(null)
  const [userId, setUserId] = useState('')
  const [email, setEmail] = useState<string | null>(null)
  const [profile, setProfile] = useState<AccountProfile | null>(null)
  const [favoriteProfiles, setFavoriteProfiles] = useState<FavoriteProfile[]>([])
  const [favoriteEvents, setFavoriteEvents] = useState<FavoriteEvent[]>([])
  const [suggestedEvents, setSuggestedEvents] = useState<FavoriteEvent[]>([])
  const [activeTab, setActiveTab] = useState<AccountTab>('profile')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarMessage, setAvatarMessage] = useState('')
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
      setUserId(user.id)

      const { data: profileData } = await supabase
        .from('profiles')
        .select('first_name, last_name, municipality, province, music_preferences, avatar_url')
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
          .order('date', { ascending: true })

        const favoriteEventRows = (events || []).map((event) => ({
          ...event,
          music: canonicalizeMusicList(event.music),
        }))

        setFavoriteEvents(favoriteEventRows)
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
            .select('id, name, venue_name, area, type, music, logo_url, banner_url')
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

        setFavoriteProfiles(
          (profiles || [])
            .map((favoriteProfile) => {
              const profileEventsList = eventsByProfile.get(favoriteProfile.id) || []

              return {
                ...favoriteProfile,
                music: canonicalizeMusicList(favoriteProfile.music),
                nextEvent: profileEventsList[0] || null,
                eventCount: profileEventsList.length,
              }
            })
            .sort((a, b) => a.name.localeCompare(b.name))
        )
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

  const displayName = useMemo(() => {
    const fullName = [profile?.first_name, profile?.last_name]
      .filter(Boolean)
      .join(' ')
      .trim()

    if (fullName) return fullName
    if (email) return email.split('@')[0]
    return 'Usuario'
  }, [email, profile])

  const initials = displayName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file || !userId) return

    setAvatarUploading(true)
    setAvatarMessage('')

    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '-')
    const filePath = `avatars/${userId}/${Date.now()}-${safeFileName}`

    const { error: uploadError } = await supabase.storage
      .from('events')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      })

    if (uploadError) {
      setAvatarUploading(false)
      setAvatarMessage(`No se pudo subir la foto: ${uploadError.message}`)
      event.target.value = ''
      return
    }

    const { data } = supabase.storage.from('events').getPublicUrl(filePath)
    const nextAvatarUrl = data.publicUrl

    const { error: profileError } = await supabase.from('profiles').upsert(
      {
        id: userId,
        role: 'user',
        avatar_url: nextAvatarUrl,
      },
      { onConflict: 'id' }
    )

    setAvatarUploading(false)
    event.target.value = ''

    if (profileError) {
      setAvatarMessage(`Foto subida, pero no se pudo guardar: ${profileError.message}`)
      return
    }

    setAvatarUrl(nextAvatarUrl)
    setAvatarMessage('Foto actualizada')
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
      <main className="min-h-screen bg-hero-gradient text-slate-100">
      <div className="mx-auto min-h-screen w-full max-w-5xl pb-12 pt-8 md:pt-10">
        {activeTab === 'profile' && (
        <section className="px-5 pt-4 md:pt-8">
          <div className="grid grid-cols-[auto_1fr] items-center gap-6">
            <div className="relative">
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="relative flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 via-fuchsia-500 to-orange-400 p-1 sm:h-36 sm:w-36"
                aria-label="Cambiar foto de perfil"
              >
                <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-slate-900 text-4xl font-black text-white">
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
                <span className="absolute bottom-1 right-1 flex h-11 w-11 items-center justify-center rounded-full border-4 border-slate-950 bg-white text-slate-950">
                  <Plus className="h-6 w-6" />
                </span>
              </button>

              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />

              {avatarUploading && (
                <p className="mt-2 text-center text-xs font-semibold text-brand-500">
                  Subiendo...
                </p>
              )}
              {avatarMessage && (
                <p className="mt-2 text-center text-xs text-slate-400">
                  {avatarMessage}
                </p>
              )}
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-2xl font-black text-white sm:text-4xl">
                {displayName}
              </h1>
              <p className="mt-1 truncate text-sm text-slate-400">{email}</p>

              <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-3xl font-black text-white">
                    {favoriteProfiles.length + favoriteEvents.length}
                  </p>
                  <p className="text-sm text-slate-300">Favoritos</p>
                </div>
                <div>
                  <p className="text-3xl font-black text-white">0</p>
                  <p className="text-sm text-slate-300">Comparar</p>
                </div>
                <div>
                  <p className="text-3xl font-black text-white">0</p>
                  <p className="text-sm text-slate-300">Chats</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-5 py-3 text-lg font-semibold text-white transition hover:bg-white/15"
            >
              <Search className="h-5 w-5" />
              Buscar
            </Link>

            <button
              type="button"
              onClick={() => changeAccountTab('suggestions')}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-5 py-3 text-lg font-semibold text-white transition hover:bg-white/15"
            >
              <Sparkles className="h-5 w-5" />
              Sugerencias
            </button>
          </div>
        </section>
        )}

        {activeTab === 'profile' && (
          <section className="px-5 py-8">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm text-slate-400">Zona</p>
                <p className="mt-2 text-lg font-bold text-white">
                  {profile?.municipality || 'Sin definir'}
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm text-slate-400">Gustos</p>
                <p className="mt-2 text-lg font-bold text-white">
                  {profile?.music_preferences?.length
                    ? profile.music_preferences.join(', ')
                    : 'Sin definir'}
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm text-slate-400">Tardeos visitados</p>
                <p className="mt-2 text-lg font-bold text-white">Próximamente</p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Link href="/cuenta/perfil" className="btn-primary w-full">
                Editar perfil
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-bold text-slate-200 transition hover:border-brand-500/50 hover:text-white"
              >
                Cerrar sesión
              </button>
            </div>
          </section>
        )}

        {activeTab === 'favorites' && (
          <section className="grid grid-cols-2 gap-1 px-0 pt-1 sm:grid-cols-3 lg:grid-cols-4">
            {favoriteProfiles.length + favoriteEvents.length === 0 ? (
              <div className="col-span-full px-5 py-12 text-center">
                <Heart className="mx-auto h-10 w-10 text-brand-500" />
                <h2 className="mt-4 text-2xl font-bold text-white">
                  Sin favoritos todavia
                </h2>
                <Link href="/" className="btn-primary mt-5">
                  Buscar planes
                </Link>
              </div>
            ) : (
              <>
              {favoriteProfiles.map((favoriteProfile) => {
                const nextEvent = favoriteProfile.nextEvent
                const cover =
                  nextEvent?.cover ||
                  favoriteProfile.banner_url ||
                  favoriteProfile.logo_url ||
                  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80'

                return (
                  <Link
                    key={favoriteProfile.id}
                    href={`/eventos/grupo/${favoriteProfile.id}`}
                    className="group relative aspect-[3/4] overflow-hidden bg-slate-900"
                  >
                    <div
                      className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105"
                      style={{ backgroundImage: `url(${cover})` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/55 to-transparent" />

                    <div className="absolute left-3 top-3 rounded-full bg-brand-500 px-3 py-1 text-xs font-black text-white">
                      Favorito
                    </div>

                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <div className="mb-2 flex flex-wrap gap-1.5">
                        {favoriteProfile.type && (
                          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur">
                            {favoriteProfile.type}
                          </span>
                        )}
                        {favoriteProfile.area && (
                          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur">
                            {favoriteProfile.area}
                          </span>
                        )}
                      </div>

                      <h2 className="line-clamp-2 text-base font-black uppercase leading-tight text-white">
                        {favoriteProfile.name}
                      </h2>
                      <p className="mt-2 line-clamp-2 text-xs text-slate-200">
                        {favoriteProfile.venue_name || nextEvent?.venue || 'Ficha de evento'}
                        {nextEvent
                          ? ` · Próxima fecha ${new Date(nextEvent.date).toLocaleDateString('es-ES')}`
                          : ''}
                      </p>
                      <p className="mt-2 text-xs font-bold text-brand-400">
                        {favoriteProfile.eventCount === 1
                          ? '1 fecha próxima'
                          : `${favoriteProfile.eventCount} fechas próximas`}
                      </p>
                    </div>
                  </Link>
                )
              })}

              {favoriteEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/eventos/${event.slug}`}
                  className="group relative aspect-[3/4] overflow-hidden bg-slate-900"
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

                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur">
                        {event.type}
                      </span>
                      <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur">
                        {event.area}
                      </span>
                      <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur">
                        {event.price_from === 0
                          ? 'Desde gratis'
                          : `Desde ${event.price_from} EUR`}
                      </span>
                    </div>

                    <h2 className="line-clamp-2 text-base font-black uppercase leading-tight text-white">
                      {event.title}
                    </h2>
                    <p className="mt-2 line-clamp-2 text-xs text-slate-200">
                      {event.venue} ·{' '}
                      {new Date(event.date).toLocaleDateString('es-ES')} ·{' '}
                      {event.start_time?.slice(0, 5)}
                      {event.end_time ? ` - ${event.end_time.slice(0, 5)}` : ''}
                    </p>
                  </div>
                </Link>
              ))}
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
      </main>
    </>
  )
}
