'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { User } from '@supabase/supabase-js'
import { Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export function Navbar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [firstName, setFirstName] = useState('')

  useEffect(() => {
    async function searchEvents() {
      if (query.trim().length < 2) {
        setResults([])
        return
      }

      const { data } = await supabase
        .from('events')
        .select('title, slug, venue, date')
        .eq('published', true)
        .eq('status', 'approved')
        .ilike('title', `%${query}%`)
        .order('date', { ascending: true })
        .limit(6)

      setResults(data || [])
    }

    searchEvents()
  }, [query])

  useEffect(() => {
    async function loadUserProfile(currentUser: User | null) {
      if (!currentUser) {
        setFirstName('')
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('first_name')
        .eq('id', currentUser.id)
        .maybeSingle()

      setFirstName(data?.first_name ?? '')
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
    window.location.href = '/'
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex shrink-0 items-center">
          <Image
            src="/logotardeaweb.png"
            alt="TARDEA"
            width={140}
            height={40}
            priority
          />
        </Link>

        <div className="relative hidden w-full max-w-md md:block">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar eventos..."
              className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
            />
          </div>

          {results.length > 0 && (
            <div className="absolute left-0 right-0 top-12 overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-xl">
              {results.map((event) => (
                <Link
                  key={event.slug}
                  href={`/eventos/${event.slug}`}
                  onClick={() => {
                    setQuery('')
                    setResults([])
                  }}
                  className="block border-b border-white/10 px-4 py-3 transition hover:bg-white/5 last:border-b-0"
                >
                  <p className="font-medium text-white">{event.title}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {event.venue}
                    {event.date
                      ? ` · ${new Date(event.date).toLocaleDateString('es-ES')}`
                      : ''}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>

        <nav className="hidden gap-6 text-sm text-slate-300 lg:flex">
          <a href="#destacados" className="hover:text-white">
            Destacados
          </a>
          <a href="#zonas" className="hover:text-white">
            Zonas
          </a>
          <a href="#newsletter" className="hover:text-white">
            Newsletter
          </a>
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          {user ? (
            <>
              {firstName && (
                <span className="hidden text-sm font-medium text-slate-200 md:inline">
                  Hola, {firstName}
                </span>
              )}

              <Link href="/cuenta" className="btn-primary">
                Mi cuenta
              </Link>

              <button
                type="button"
                onClick={handleSignOut}
                className="hidden text-sm text-slate-300 hover:text-white sm:inline"
              >
                Cerrar sesion
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login?type=venue"
                className="text-sm text-slate-300 hover:text-white"
              >
                Promotor
              </Link>

              <Link href="/login?type=user" className="btn-primary">
                Usuario
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
