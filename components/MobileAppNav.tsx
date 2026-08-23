'use client'

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { Heart, Map, MessageSquare, Search, Sparkles, UserRound } from 'lucide-react'
import { usePathname } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

const hiddenRoutes = [
  '/admin',
  '/dashboard',
  '/login',
  '/register',
  '/reset-password',
  '/private-access',
  '/auth',
  '/aviso-legal',
  '/condiciones',
  '/cookies',
  '/privacidad',
]

export function MobileAppNav() {
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState('')
  const [homeView, setHomeView] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const [avatarUrl, setAvatarUrl] = useState('')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    setActiveTab(params.get('tab') || '')
    setHomeView(params.get('view') || '')
  }, [pathname])

  useEffect(() => {
    async function loadUserProfile(currentUser: User | null) {
      if (!currentUser) {
        setAvatarUrl('')
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', currentUser.id)
        .maybeSingle()

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

  if (hiddenRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    return null
  }

  const accountHref = user ? '/cuenta' : '/login?type=user'
  const protectedHref = (href: string) => (user ? href : '/login?type=user')
  const isAccount = pathname.startsWith('/cuenta')
  const isSearch = pathname === '/' && homeView !== 'map'

  return (
    <>
      <Link
        href="/?view=map#eventos"
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+86px)] left-1/2 z-50 inline-flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-2xl shadow-black/50 ring-1 ring-brand-500/25 backdrop-blur-xl md:hidden"
      >
        <Map className="h-5 w-5" />
        Mapa
      </Link>

      <nav
        aria-label="Navegación principal móvil"
        className="fixed inset-x-0 bottom-0 z-50 px-3 pb-[calc(env(safe-area-inset-bottom)+8px)] pt-2 md:hidden"
      >
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1 rounded-[30px] border border-white/10 bg-slate-950/95 p-1.5 shadow-2xl shadow-black/50 backdrop-blur-xl">
          <MobileNavItem
            href={protectedHref('/cuenta?tab=suggestions')}
            active={isAccount && activeTab === 'suggestions'}
            label="Para ti"
          >
            <Sparkles className="h-5 w-5" />
          </MobileNavItem>

          <MobileNavItem href="/#buscador" active={isSearch} label="Buscar">
            <Search className="h-5 w-5" />
          </MobileNavItem>

          <MobileNavItem
            href={protectedHref('/cuenta?tab=favorites')}
            active={isAccount && activeTab === 'favorites'}
            label="Favoritos"
          >
            <Heart className="h-5 w-5" />
          </MobileNavItem>

          <MobileNavItem
            href={protectedHref('/cuenta?tab=chats')}
            active={isAccount && activeTab === 'chats'}
            label="Chat"
          >
            <MessageSquare className="h-5 w-5" />
          </MobileNavItem>

          <MobileNavItem
            href={protectedHref('/cuenta?tab=profile')}
            active={isAccount && (!activeTab || activeTab === 'profile')}
            label="Perfil"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Mi cuenta" className="h-6 w-6 rounded-full object-cover" />
            ) : (
              <UserRound className="h-5 w-5" />
            )}
          </MobileNavItem>
        </div>
      </nav>
    </>
  )
}

function MobileNavItem({
  href,
  active,
  label,
  children,
}: {
  href: string
  active: boolean
  label: string
  children: ReactNode
}) {
  return (
    <Link
      href={href}
      className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-[24px] text-[10px] font-bold transition ${
        active
          ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
          : 'text-slate-400 hover:bg-white/10 hover:text-white'
      }`}
    >
      {children}
      <span>{label}</span>
    </Link>
  )
}
