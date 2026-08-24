'use client'

import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  CalendarDays,
  ChevronRight,
  CheckCircle2,
  Heart,
  KeyRound,
  LogOut,
  Mail,
  MapPin,
  MessageSquare,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
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
  const [passwordMessage, setPasswordMessage] = useState('')
  const [sendingPasswordEmail, setSendingPasswordEmail] = useState(false)
  const [emailConfirmed, setEmailConfirmed] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [accountMessage, setAccountMessage] = useState('')
  const [showAccountDetails, setShowAccountDetails] = useState(false)
  const [sendingConfirmationEmail, setSendingConfirmationEmail] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)
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
      setNewEmail(user.email ?? '')
      setEmailConfirmed(Boolean(user.email_confirmed_at))
      setUserId(user.id)

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
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  async function handlePasswordRecovery() {
    setPasswordMessage('')

    if (!email) {
      setPasswordMessage('No se ha podido detectar el email de tu cuenta.')
      return
    }

    setSendingPasswordEmail(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    })
    setSendingPasswordEmail(false)

    if (error) {
      setPasswordMessage(`No se pudo enviar el email: ${error.message}`)
      return
    }

    setPasswordMessage('Te hemos enviado un enlace para cambiar la contraseña.')
  }

  async function handleChangeEmail() {
    const nextEmail = newEmail.trim()
    setAccountMessage('')

    if (!nextEmail || nextEmail === email) {
      setAccountMessage('Escribe un correo nuevo para cambiarlo.')
      return
    }

    const { error } = await supabase.auth.updateUser({ email: nextEmail })

    if (error) {
      setAccountMessage(`No se pudo cambiar el correo: ${error.message}`)
      return
    }

    setAccountMessage('Te hemos enviado un correo para confirmar el cambio.')
  }

  async function handleSendConfirmationEmail() {
    setAccountMessage('')

    if (!email) {
      setAccountMessage('No se ha podido detectar el correo de tu cuenta.')
      return
    }

    setSendingConfirmationEmail(true)
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    setSendingConfirmationEmail(false)

    if (error) {
      setAccountMessage(`No se pudo enviar la confirmación: ${error.message}`)
      return
    }

    setAccountMessage('Te hemos enviado un correo de confirmación.')
  }

  async function handleDeleteAccount() {
    if (!window.confirm('¿Seguro que quieres eliminar tu cuenta de TARDEA? Esta acción no se puede deshacer.')) {
      return
    }

    setDeletingAccount(true)
    setAccountMessage('')

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.access_token) {
      setDeletingAccount(false)
      setAccountMessage('Tu sesión no está activa. Vuelve a iniciar sesión.')
      return
    }

    const response = await fetch('/api/account/delete', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    })

    if (!response.ok) {
      const data = await response.json().catch(() => null)
      setDeletingAccount(false)
      setAccountMessage(data?.error || 'No se pudo eliminar la cuenta.')
      return
    }

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
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 via-fuchsia-500 to-orange-400 p-1 sm:h-32 sm:w-32"
                aria-label="Cambiar foto de perfil"
              >
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
                <span className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border-4 border-slate-950 bg-white text-slate-950 sm:h-10 sm:w-10">
                  <Plus className="h-5 w-5" />
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
              <h1 className="truncate text-xl font-black text-white sm:text-3xl">
                {displayName}
              </h1>
              <p className="mt-1 truncate text-xs text-slate-400 sm:text-sm">{population}</p>

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
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-slate-400">Gustos</p>
                <p className="mt-1 text-base font-bold text-white">
                  {profile?.music_preferences?.length
                    ? profile.music_preferences.join(', ')
                    : 'Sin definir'}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-slate-400">Tardeos visitados</p>
                <p className="mt-1 text-base font-bold text-white">Próximamente</p>
              </div>
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
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

                <button
                  type="button"
                  onClick={() => setShowAccountDetails((current) => !current)}
                  className="flex min-h-12 w-full items-center justify-between px-4 py-3 text-left text-sm font-bold text-slate-200 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="flex items-center gap-3">
                    <UserRound className="h-4 w-4 text-brand-500" />
                    Detalles de la cuenta
                  </span>
                  <ChevronRight className={`h-4 w-4 text-slate-500 transition ${showAccountDetails ? 'rotate-90' : ''}`} />
                </button>

                {showAccountDetails && (
                  <div className="space-y-3 bg-slate-950/20 px-4 py-4">
                    <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-3">
                      <p className="text-[11px] font-semibold text-slate-500">Correo electrónico</p>
                      <div className="mt-1 flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-bold text-white">{email}</p>
                        {emailConfirmed ? (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-1 text-[10px] font-black text-emerald-300">
                            <CheckCircle2 className="h-3 w-3" />
                            Confirmado
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={handleSendConfirmationEmail}
                            disabled={sendingConfirmationEmail}
                            className="shrink-0 rounded-full border border-brand-500/40 px-2 py-1 text-[10px] font-black text-brand-400 disabled:opacity-60"
                          >
                            {sendingConfirmationEmail ? 'Enviando...' : 'Confirmar'}
                          </button>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handlePasswordRecovery}
                      disabled={sendingPasswordEmail}
                      className="flex min-h-11 w-full items-center justify-between rounded-2xl border border-white/10 px-4 text-left text-sm font-bold text-slate-200 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span className="flex items-center gap-3">
                        <KeyRound className="h-4 w-4 text-brand-500" />
                        {sendingPasswordEmail ? 'Enviando...' : 'Cambiar contraseña'}
                      </span>
                      <ChevronRight className="h-4 w-4 text-slate-500" />
                    </button>

                    <label className="block">
                      <span className="mb-2 flex items-center gap-3 text-sm font-bold text-slate-200">
                        <Mail className="h-4 w-4 text-brand-500" />
                        Cambiar correo
                      </span>
                      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                        <input
                          className="input min-h-11 text-sm"
                          value={newEmail}
                          onChange={(event) => setNewEmail(event.target.value)}
                          type="email"
                          autoComplete="email"
                        />
                        <button
                          type="button"
                          onClick={handleChangeEmail}
                          className="min-h-11 rounded-2xl border border-white/10 px-4 text-sm font-black text-white transition hover:border-brand-500/50"
                        >
                          Enviar
                        </button>
                      </div>
                    </label>

                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      disabled={deletingAccount}
                      className="flex min-h-11 w-full items-center justify-between rounded-2xl border border-red-300/20 px-4 text-left text-sm font-bold text-red-300 transition hover:bg-red-500/10 hover:text-red-200 disabled:opacity-60"
                    >
                      <span className="flex items-center gap-3">
                        <Trash2 className="h-4 w-4 text-red-300" />
                        {deletingAccount ? 'Eliminando...' : 'Eliminar cuenta'}
                      </span>
                      <ChevronRight className="h-4 w-4 text-red-300/60" />
                    </button>

                    {(passwordMessage || accountMessage) && (
                      <p className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-300">
                        {accountMessage || passwordMessage}
                      </p>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex min-h-12 w-full items-center justify-between px-4 py-3 text-left text-sm font-bold text-slate-200 transition hover:bg-brand-500/10 hover:text-white"
                >
                  <span className="flex items-center gap-3">
                    <LogOut className="h-4 w-4 text-brand-500" />
                    Cerrar sesión
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-500" />
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
                  Sin favoritos todavia
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
      </main>
    </>
  )
}
