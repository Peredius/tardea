'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, Mail, Search, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type AdminUser = {
  id: string
  email: string
  emailConfirmed: boolean
  role: string
  firstName: string
  lastName: string
  venueName: string
  municipality: string
  province: string
  musicPreferences: string[]
  marketingConsent: boolean
  createdAt: string
  lastSignInAt: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [registered, setRegistered] = useState(0)
  const [newsletter, setNewsletter] = useState(0)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState('')

  useEffect(() => {
    async function loadUsers() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        setError('Inicia sesión como admin para ver los usuarios.')
        setLoading(false)
        return
      }

      const response = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        cache: 'no-store',
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        setError(payload?.error || 'No se pudieron cargar los usuarios.')
      } else {
        setUsers(payload?.users || [])
        setRegistered(payload?.totals?.registered || 0)
        setNewsletter(payload?.totals?.newsletter || 0)
      }
      setLoading(false)
    }

    loadUsers()
  }, [])

  const visibleUsers = useMemo(() => {
    const search = query.trim().toLowerCase()
    if (!search) return users
    return users.filter((user) =>
      [user.email, user.firstName, user.lastName, user.venueName, user.municipality, user.province]
        .join(' ')
        .toLowerCase()
        .includes(search)
    )
  }, [query, users])

  async function downloadCsv(scope: 'all' | 'newsletter') {
    setDownloading(scope)
    setError('')
    const { data: { session } } = await supabase.auth.getSession()
    const response = await fetch(`/api/admin/users?format=csv&scope=${scope}`, {
      headers: { Authorization: `Bearer ${session?.access_token || ''}` },
    })
    if (!response.ok) {
      const payload = await response.json().catch(() => null)
      setError(payload?.error || 'No se pudo generar el archivo.')
      setDownloading('')
      return
    }

    const blob = await response.blob()
    const href = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = href
    link.download = `tardea-${scope === 'newsletter' ? 'newsletter' : 'usuarios'}-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(href)
    setDownloading('')
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="container-page py-5 pb-24 md:py-8">
        <Link href="/admin" className="inline-flex items-center gap-2 text-xs font-bold text-brand-400 md:text-sm">
          <ArrowLeft className="h-4 w-4" /> Volver al admin
        </Link>

        <div className="mt-5">
          <p className="text-xs font-bold uppercase text-brand-500">Administración</p>
          <h1 className="mt-1 text-2xl font-black md:text-4xl">Usuarios</h1>
          <p className="mt-2 text-sm text-slate-400">Cuentas registradas y consentimiento para comunicaciones.</p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 md:max-w-lg">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <Users className="h-5 w-5 text-brand-500" />
            <p className="mt-3 text-2xl font-black">{registered}</p>
            <p className="text-xs text-slate-400">Cuentas registradas</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <Mail className="h-5 w-5 text-brand-500" />
            <p className="mt-3 text-2xl font-black">{newsletter}</p>
            <p className="text-xs text-slate-400">Aceptan newsletter</p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button type="button" onClick={() => downloadCsv('all')} disabled={Boolean(downloading)} className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-4 py-2.5 text-xs font-bold disabled:opacity-50">
            <Download className="h-4 w-4" /> {downloading === 'all' ? 'Preparando...' : 'Exportar usuarios'}
          </button>
          <button type="button" onClick={() => downloadCsv('newsletter')} disabled={Boolean(downloading) || newsletter === 0} className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-500 px-4 py-2.5 text-xs font-bold disabled:opacity-40">
            <Download className="h-4 w-4" /> {downloading === 'newsletter' ? 'Preparando...' : `Exportar newsletter (${newsletter})`}
          </button>
        </div>

        <label className="relative mt-6 block max-w-xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} className="input rounded-full pl-11" placeholder="Buscar por nombre, email o localidad" />
        </label>

        {loading && <p className="mt-8 text-sm text-slate-400">Cargando usuarios...</p>}
        {error && <p className="mt-6 text-sm font-semibold text-brand-200">{error}</p>}

        {!loading && !error && (
          <div className="mt-5 divide-y divide-white/10 border-y border-white/10">
            {visibleUsers.map((user) => (
              <article key={user.id} className="py-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate font-bold">{[user.firstName, user.lastName].filter(Boolean).join(' ') || user.venueName || user.email.split('@')[0]}</p>
                    <p className="mt-1 break-all text-sm text-slate-300">{user.email}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {[user.role === 'venue' ? 'Promotor' : user.role === 'admin' ? 'Admin' : 'Usuario', user.municipality, user.province].filter(Boolean).join(' · ')}
                    </p>
                    {user.musicPreferences?.length > 0 && <p className="mt-2 text-xs text-slate-400">Música: {user.musicPreferences.join(', ')}</p>}
                  </div>
                  <div className="shrink-0 sm:text-right">
                    <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold ${user.marketingConsent ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/5 text-slate-400'}`}>
                      {user.marketingConsent ? 'Newsletter: sí' : 'Newsletter: no'}
                    </span>
                    <p className="mt-2 text-[11px] text-slate-500">Alta: {new Date(user.createdAt).toLocaleDateString('es-ES')}</p>
                  </div>
                </div>
              </article>
            ))}
            {visibleUsers.length === 0 && <p className="py-8 text-center text-sm text-slate-400">No hay usuarios con esa búsqueda.</p>}
          </div>
        )}
      </section>
    </main>
  )
}
