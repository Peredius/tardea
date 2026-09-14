'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, CalendarDays, FilePlus2, ListChecks, RefreshCw } from 'lucide-react'

const adminItems = [
  { href: '/admin/revision', label: 'Revisión', icon: RefreshCw, match: '/admin/revision' },
  { href: '/admin/eventos', label: 'Eventos', icon: CalendarDays, match: '/admin/eventos' },
  { href: '/admin/crear-evento', label: 'Crear', icon: FilePlus2, match: '/admin/crear-evento' },
  { href: '/admin/fichas', label: 'Fichas', icon: ListChecks, match: '/admin/fichas' },
  { href: '/admin/analitica', label: 'Analítica', icon: BarChart3, match: '/admin/analitica' },
]

export function AdminMobileNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Navegación admin móvil"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-black pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <div className="mx-auto grid max-w-md grid-cols-5 bg-black px-2 py-2">
        {adminItems.map((item) => {
          const Icon = item.icon
          const active =
            pathname === item.href ||
            pathname.startsWith(`${item.match}/`) ||
            (pathname === '/admin' && item.href === '/admin/eventos')

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex min-h-14 flex-col items-center justify-center gap-1 text-[10px] font-bold transition ${
                active ? 'text-white' : 'text-slate-500 hover:text-white'
              }`}
            >
              {active && <span className="absolute top-1 h-0.5 w-6 rounded-full bg-white" />}
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
