'use client'

import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  CalendarDays,
  Heart,
  LockKeyhole,
  MapPin,
  Menu,
  MessageSquare,
  Plus,
  Search,
  Sparkles,
  UserRound,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

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
  slug: string
  title: string
  venue: string
  area: string
  date: string
  start_time: string | null
  end_time: string | null
  type: string
  price_from: number | null
  cover: string | null
}

type AccountTab = 'favorites' | 'suggestions' | 'compare' | 'chats'

export default function AccountPage() {
  const avatarInputRef = useRef<HTMLInputElement | null>(null)
  const [userId, setUserId] = useState('')
  const [email, setEmail] = useState<string | null>(null)
  const [profile, setProfile] = useState<AccountProfile | null>(null)
  const [favoriteEvents, setFavoriteEvents] = useState<FavoriteEvent[]>([])
  const [suggestedEvents, setSuggestedEvents] = useState<FavoriteEvent[]>([])
  const [activeTab, setActiveTab] = useState<AccountTab>('favorites')
  const [menuOpen, setMenuOpen] = useState(false)
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

      setProfile(profileData ?? null)
      setAvatarUrl(profileData?.avatar_url ?? '')

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
            'id, slug, title, venue, area, date, start_time, end_time, type, price_from, cover'
          )
          .in('id', eventIds)
          .order('date', { ascending: true })

        setFavoriteEvents(events || [])
      }

      const today = new Date().toISOString().split('T')[0]
      const musicPreferences = profileData?.music_preferences || []
      let suggestionsQuery = supabase
        .from('events')
        .select(
          'id, slug, title, venue, area, date, start_time, end_time, type, price_from, cover'
        )
        .eq('published', true)
        .eq('status', 'approved')
        .gte('date', today)
        .order('date', { ascending: true })
        .limit(8)

      if (musicPreferences.length > 0) {
        suggestionsQuery = suggestionsQuery.overlaps('music', musicPreferences)
      }

      const { data: suggestions } = await suggestionsQuery
      setSuggestedEvents(
        (suggestions || []).filter((event) => !eventIds.includes(event.id))
      )

      setLoading(false)
    }

    loadAccount()
  }, [])

  const displayName = useMemo(() => {
    const fullName = [profile?.first_name, profile?.last_name]
      .filter(Boolean)
      .join(' ')
      .trim()

    if (fullName) return fullName
    if (email) return email.split('@')[0]
    return 'Usuario'
  }, [email, profile])

  const username = useMemo(
    () => displayName.toLowerCase().replace(/\s+/g, '_'),
    [displayName]
  )

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
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto min-h-screen w-full max-w-5xl pb-12">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/90 px-5 py-4 backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/"
              aria-label="Buscar planes"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full text-white transition hover:bg-white/10"
            >
              <Plus className="h-8 w-8" />
            </Link>

            <div className="flex min-w-0 items-center gap-2 text-xl font-black text-white sm:text-2xl">
              <LockKeyhole className="h-5 w-5 shrink-0 text-slate-300" />
              <span className="truncate">{username}</span>
            </div>

            <div className="relative flex items-center gap-3">
              <button
                type="button"
                aria-label="Chats"
                onClick={() => setActiveTab('chats')}
                className="relative inline-flex h-11 w-11 items-center justify-center rounded-full text-white transition hover:bg-white/10"
              >
                <MessageSquare className="h-8 w-8 fill-white" />
                <span className="absolute right-1 top-0 h-5 min-w-5 rounded-full bg-brand-500 px-1 text-xs font-bold leading-5 text-white">
                  0
                </span>
              </button>

              <button
                type="button"
                onClick={() => setMenuOpen((current) => !current)}
                aria-label="Abrir menu"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full text-white transition hover:bg-white/10"
              >
                <Menu className="h-8 w-8" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-14 w-48 overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/30">
                  <Link
                    href="/cuenta/perfil"
                    className="block border-b border-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Editar perfil
                  </Link>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="block w-full px-4 py-3 text-left text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
                  >
                    Cerrar sesion
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <section className="px-5 pt-8">
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
                    {favoriteEvents.length}
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
              onClick={() => setActiveTab('suggestions')}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-5 py-3 text-lg font-semibold text-white transition hover:bg-white/15"
            >
              <Sparkles className="h-5 w-5" />
              Sugerencias
            </button>
          </div>
        </section>

        <section className="mt-8 border-b border-white/10 px-5">
          <div className="grid grid-cols-4 text-center">
            <button
              type="button"
              onClick={() => setActiveTab('favorites')}
              className={`flex justify-center border-b-2 py-4 transition ${
                activeTab === 'favorites'
                  ? 'border-white text-white'
                  : 'border-transparent text-slate-500 hover:text-white'
              }`}
            >
              <Heart className="h-8 w-8 fill-current" />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('suggestions')}
              className={`flex justify-center border-b-2 py-4 transition ${
                activeTab === 'suggestions'
                  ? 'border-white text-white'
                  : 'border-transparent text-slate-500 hover:text-white'
              }`}
            >
              <Sparkles className="h-8 w-8 fill-current" />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('compare')}
              className={`flex justify-center border-b-2 py-4 transition ${
                activeTab === 'compare'
                  ? 'border-white text-white'
                  : 'border-transparent text-slate-500 hover:text-white'
              }`}
            >
              <Search className="h-8 w-8" />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('chats')}
              className={`flex justify-center border-b-2 py-4 transition ${
                activeTab === 'chats'
                  ? 'border-white text-white'
                  : 'border-transparent text-slate-500 hover:text-white'
              }`}
            >
              <MessageSquare className="h-8 w-8 fill-current" />
            </button>
          </div>
        </section>

        {activeTab === 'favorites' && (
          <section className="grid grid-cols-2 gap-1 px-0 pt-1 sm:grid-cols-3 lg:grid-cols-4">
            {favoriteEvents.length === 0 ? (
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
              favoriteEvents.map((event) => (
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
              ))
            )}
          </section>
        )}

        {activeTab === 'suggestions' && (
          <section className="grid grid-cols-2 gap-1 px-0 pt-1 sm:grid-cols-3 lg:grid-cols-4">
            {suggestedEvents.length === 0 ? (
              <div className="col-span-full px-5 py-12 text-center">
                <Sparkles className="mx-auto h-10 w-10 text-brand-500" />
                <h2 className="mt-4 text-2xl font-bold text-white">
                  Sin sugerencias todavia
                </h2>
                <p className="mx-auto mt-2 max-w-sm text-sm text-slate-400">
                  Completa tus gustos musicales para que podamos recomendarte
                  planes que encajen contigo.
                </p>
                <Link href="/cuenta/perfil" className="btn-primary mt-5">
                  Completar perfil
                </Link>
              </div>
            ) : (
              suggestedEvents.map((event) => (
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

                  <div className="absolute left-3 top-3 rounded-full bg-brand-500 px-3 py-1 text-xs font-bold text-white shadow-lg shadow-brand-500/20">
                    Para ti
                  </div>

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
              ))
            )}
          </section>
        )}

        {activeTab === 'compare' && (
          <section className="px-5 py-12">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
              <CalendarDays className="mx-auto h-10 w-10 text-brand-500" />
              <h2 className="mt-4 text-2xl font-bold text-white">
                Comparador de planes
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Aqui prepararemos las encuestas para grupos de WhatsApp.
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
  )
}
