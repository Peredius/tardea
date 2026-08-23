'use client'

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { Heart, MessageSquare, Search, Sparkles, UserRound } from 'lucide-react'
import { usePathname } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

const hiddenRoutes = [
  '/admin',
  '/dashboard',
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
  const [homeHash, setHomeHash] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const [avatarUrl, setAvatarUrl] = useState('')

  useEffect(() => {
    if (typeof window === 'undefined') return

    function syncNavigationState() {
      const params = new URLSearchParams(window.location.search)
      setActiveTab(params.get('tab') || '')
      setHomeView(params.get('view') || '')
      setHomeHash(window.location.hash.replace('#', ''))
    }

    syncNavigationState()
    window.addEventListener('hashchange', syncNavigationState)
    window.addEventListener('popstate', syncNavigationState)

    return () => {
      window.removeEventListener('hashchange', syncNavigationState)
      window.removeEventListener('popstate', syncNavigationState)
    }
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
  const accountOnlyHref = (href: string) => (user ? href : '/login?type=user')
  const recommendationsHref = user ? '/cuenta?tab=suggestions' : '/?tab=for-you#destacados'
  const isAccount = pathname.startsWith('/cuenta')
  const isRecommendations = user
    ? isAccount && activeTab === 'suggestions'
    : pathname === '/' && (activeTab === 'for-you' || homeHash === 'destacados')
  const isNearMe = pathname === '/' && homeView === 'map'
  const isSearch = pathname === '/' && !isRecommendations && homeView !== 'map'
  const isAuthScreen = pathname === '/login' || pathname === '/register'

  return (
    <>
      <nav
        aria-label="Navegación principal móvil"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-black pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <div className="mx-auto grid max-w-md grid-cols-5 bg-black px-2 py-2">
          <MobileNavItem
            href={accountOnlyHref('/cuenta?tab=profile')}
            active={isAccount && (!activeTab || activeTab === 'profile')}
            label="Perfil"
            onClick={() => {
              setActiveTab('profile')
              window.dispatchEvent(
                new CustomEvent('tardeaAccountTabChanged', {
                  detail: { tab: 'profile' },
                })
              )
            }}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Mi cuenta" className="h-6 w-6 rounded-full object-cover" />
            ) : (
              <UserRound className="h-5 w-5" />
            )}
          </MobileNavItem>

          <MobileNavItem
            href={recommendationsHref}
            active={isRecommendations}
            label="Para ti"
            onClick={() => {
              setActiveTab(user ? 'suggestions' : 'for-you')
              setHomeView('')
              setHomeHash(user ? '' : 'destacados')
              if (user) {
                window.dispatchEvent(
                  new CustomEvent('tardeaAccountTabChanged', {
                    detail: { tab: 'suggestions' },
                  })
                )
              }
            }}
          >
            <Sparkles className="h-5 w-5" />
          </MobileNavItem>

          <MobileNavItem
            href="/?tab=search#buscador"
            active={isSearch}
            label="Buscar"
            prominent
            onClick={() => {
              setActiveTab('search')
              setHomeView('')
              setHomeHash('buscador')
            }}
          >
            <span
              className={`flex h-[3.25rem] w-[3.25rem] items-center justify-center rounded-full border transition ${
                isSearch
                  ? 'border-brand-500 bg-brand-500 text-white shadow-[0_0_28px_rgba(244,63,94,0.35)]'
                  : 'border-white/10 bg-slate-900 text-slate-300'
              }`}
            >
              <Search className="h-7 w-7" />
            </span>
          </MobileNavItem>

          <MobileNavItem
            href={accountOnlyHref('/cuenta?tab=favorites')}
            active={isAccount && activeTab === 'favorites'}
            label="Favoritos"
            onClick={() => {
              setActiveTab('favorites')
              window.dispatchEvent(
                new CustomEvent('tardeaAccountTabChanged', {
                  detail: { tab: 'favorites' },
                })
              )
            }}
          >
            <Heart className="h-5 w-5" />
          </MobileNavItem>

          <MobileNavItem
            href={accountOnlyHref('/cuenta?tab=chats')}
            active={isAccount && activeTab === 'chats'}
            label="Chat"
            onClick={() => {
              setActiveTab('chats')
              window.dispatchEvent(
                new CustomEvent('tardeaAccountTabChanged', {
                  detail: { tab: 'chats' },
                })
              )
            }}
          >
            <MessageSquare className="h-5 w-5" />
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
  onClick,
  prominent = false,
  children,
}: {
  href: string
  active: boolean
  label: string
  onClick?: () => void
  prominent?: boolean
  children: ReactNode
}) {
  return (
    <Link
      href={href}
      onClick={(event) => {
        onClick?.()
        event.currentTarget.blur()
      }}
      className={`relative flex flex-col items-center justify-center gap-1 font-bold transition ${
        prominent ? '-mt-4 min-h-[4.75rem] text-[11px]' : 'min-h-14 text-[10px]'
      } ${
        active
          ? 'text-white'
          : 'text-slate-500'
      }`}
    >
      {active && !prominent && <span className="absolute top-1 h-0.5 w-6 rounded-full bg-white" />}
      {children}
      <span>{label}</span>
    </Link>
  )
}
