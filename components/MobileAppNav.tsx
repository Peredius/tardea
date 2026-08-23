'use client'

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { Heart, Home, Map, UserRound } from 'lucide-react'
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
  const [user, setUser] = useState<User | null>(null)
  const [avatarUrl, setAvatarUrl] = useState('')

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
  const isAccount = pathname.startsWith('/cuenta')
  const isHome = pathname === '/'

  return (
    <nav
      aria-label="Navegación principal móvil"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-slate-950/90 px-3 pb-[calc(env(safe-area-inset-bottom)+8px)] pt-2 shadow-2xl shadow-black/40 backdrop-blur-xl md:hidden"
    >
      <div className="mx-auto grid max-w-md grid-cols-4 gap-1 rounded-[28px] border border-white/10 bg-white/[0.04] p-1">
        <MobileNavItem href="/" active={isHome} label="Inicio">
          <Home className="h-5 w-5" />
        </MobileNavItem>

        <MobileNavItem href="/#destacados" active={false} label="Top">
          <Heart className="h-5 w-5" />
        </MobileNavItem>

        <MobileNavItem href="/?view=map#eventos" active={false} label="Mapa">
          <Map className="h-5 w-5" />
        </MobileNavItem>

        <MobileNavItem href={accountHref} active={isAccount} label="Cuenta">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Mi cuenta" className="h-6 w-6 rounded-full object-cover" />
          ) : (
            <UserRound className="h-5 w-5" />
          )}
        </MobileNavItem>
      </div>
    </nav>
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
      className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-3xl text-[11px] font-bold transition ${
        active
          ? 'bg-brand-500 text-white'
          : 'text-slate-400 hover:bg-white/10 hover:text-white'
      }`}
    >
      {children}
      <span>{label}</span>
    </Link>
  )
}
