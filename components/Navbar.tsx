'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { User } from '@supabase/supabase-js'
import { Search, UserRound } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { BrandLogo } from '@/components/BrandLogo'

type SearchProfile = {
  id: string
  name: string
  venue_name: string | null
  area: string | null
  type: string | null
  logo_url: string | null
  banner_url: string | null
  nextDate?: string | null
  href?: string
}

export function Navbar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchProfile[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [firstName, setFirstName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function searchProfiles() {
      const searchTerm = query.trim()

      if (searchTerm.length < 2) {
        setResults([])
        return
      }

      const response = await fetch(`/api/search/profiles?q=${encodeURIComponent(searchTerm)}`, {
        cache: 'no-store',
      })
      const payload = await response.json().catch(() => null)

      if (!cancelled) {
        setResults(response.ok ? payload?.results || [] : [])
      }
    }

    searchProfiles()

    return () => {
      cancelled = true
    }
  }, [query])

  useEffect(() => {
    async function loadUserProfile(currentUser: User | null) {
      if (!currentUser) {
        setFirstName('')
        setAvatarUrl('')
        setAccountMenuOpen(false)
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('first_name, avatar_url')
        .eq('id', currentUser.id)
        .maybeSingle()

      setFirstName(data?.first_name ?? '')
      setAvatarUrl(data?.avatar_url ?? '')
    }

    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      setUser(user)
      loadUserProfile(user)
    }

    loadUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      loadUserProfile(currentUser)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    setUser(null)
    setFirstName('')
    setAvatarUrl('')
    setAccountMenuOpen(false)
    window.location.href = '/'
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/95 backdrop-blur">
      <div className="container-page relative flex min-h-[86px] items-end justify-center gap-2 pb-4 pt-[calc(env(safe-area-inset-top)+14px)] sm:gap-4 md:h-16 md:min-h-0 md:items-center md:justify-between md:py-0">
        <Link
          href="/"
          className="absolute left-1/2 flex min-w-0 shrink -translate-x-1/2 translate-y-1.5 items-center md:static md:translate-x-0 md:translate-y-0 md:shrink-0"
        >
          <BrandLogo
            className="origin-center scale-[0.82] md:origin-left md:scale-100"
            iconClassName="h-10 w-10 sm:h-11 sm:w-11"
            textClassName="text-[1.15rem] sm:text-[1.45rem]"
          />
        </Link>

        <div className="relative hidden w-full max-w-md md:block">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar planes..."
              className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
            />
          </div>

          {results.length > 0 && (
            <div className="absolute left-0 right-0 top-12 overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-xl">
              {results.map((profile) => (
                <Link
                  key={profile.id}
                  href={profile.href || `/eventos/grupo/${profile.id}`}
                  onClick={() => {
                    setQuery('')
                    setResults([])
                  }}
                  className="block border-b border-white/10 px-4 py-3 transition hover:bg-white/5 last:border-b-0"
                >
                  <p className="font-medium text-white">{profile.name}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {[profile.venue_name || profile.area, profile.type, profile.nextDate ? `Próxima fecha ${new Date(profile.nextDate).toLocaleDateString('es-ES')}` : null]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>

        <nav className="hidden gap-6 text-sm text-slate-300 lg:flex">
          <Link href="/#destacados" className="hover:text-white">
            Destacados
          </Link>
          <Link href="/#zonas" className="hover:text-white">
            Zonas
          </Link>
          <Link href="/#newsletter" className="hover:text-white">
            Newsletter
          </Link>
        </nav>

        <div className="hidden shrink-0 items-center gap-2 md:flex">
          {user ? (
            <>
              <Link
                href="/cuenta"
                className="max-w-[92px] truncate text-xs font-semibold text-slate-200 transition hover:text-white sm:max-w-none sm:text-sm"
              >
                Hola, {firstName || 'usuario'}
              </Link>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setAccountMenuOpen((current) => !current)}
                  aria-label="Abrir menu de usuario"
                  title="Mi cuenta"
                  className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:border-brand-500/60 hover:bg-brand-500/15 hover:text-white"
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={firstName ? `Perfil de ${firstName}` : 'Mi cuenta'}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserRound className="h-5 w-5" />
                  )}
                </button>

                {accountMenuOpen && (
                  <div className="absolute right-0 top-12 w-48 overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/30">
                    <Link
                      href="/cuenta"
                      onClick={() => setAccountMenuOpen(false)}
                      className="block border-b border-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                    >
                      Mi perfil
                    </Link>
                    <Link
                      href="/cuenta/perfil"
                      onClick={() => setAccountMenuOpen(false)}
                      className="block border-b border-white/10 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10 hover:text-white"
                    >
                      Editar perfil
                    </Link>
                    <Link
                      href="/cuenta/detalles"
                      onClick={() => setAccountMenuOpen(false)}
                      className="block border-b border-white/10 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10 hover:text-white"
                    >
                      Detalles de la cuenta
                    </Link>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="block w-full px-4 py-3 text-left text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
                    >
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                href="/login?type=venue"
                className="whitespace-nowrap text-xs font-medium text-slate-300 hover:text-white sm:text-sm"
              >
                Promotor
              </Link>

              <Link
                href="/login?type=user"
                aria-label="Acceso usuario"
                title="Usuario"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:border-brand-500/60 hover:bg-brand-500/15 hover:text-white"
              >
                <UserRound className="h-5 w-5" />
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
