'use client'

import { useEffect, useState } from 'react'
import { Heart, TicketPercent } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function AccountPage() {
  const [email, setEmail] = useState<string | null>(null)
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
      setLoading(false)
    }

    loadAccount()
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/'
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
      <div className="container-page py-12">
        <section className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-500">
              Mi TARDEA
            </p>

            <h1 className="mt-2 text-4xl font-bold tracking-tight">
              Mi cuenta
            </h1>

            <p className="mt-3 text-slate-400">
              {email}
            </p>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="btn-secondary self-start"
          >
            Cerrar sesion
          </button>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="card p-6">
            <Heart className="h-6 w-6 text-brand-500" />
            <h2 className="mt-4 text-2xl font-bold">Tardeos favoritos</h2>
            <p className="mt-2 text-sm text-slate-400">
              Pronto podras guardar planes y volver a ellos cuando quieras.
            </p>
          </div>

          <div className="card p-6">
            <TicketPercent className="h-6 w-6 text-brand-500" />
            <h2 className="mt-4 text-2xl font-bold">Ofertas y descuentos</h2>
            <p className="mt-2 text-sm text-slate-400">
              Aqui recibiras ventajas de los tardeos que encajen contigo.
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
