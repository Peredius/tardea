'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function DashboardPage() {
  const [email, setEmail] = useState<string | null>(null)
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        window.location.href = '/login'
        return
      }

      setEmail(user.email ?? null)

      const { data: events } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setEvents(events || [])
      setLoading(false)
    }

    loadUser()
  }, [])

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="container-page py-10">
          <p className="text-slate-400">Cargando panel...</p>
        </div>
      </main>
    )
  }

  const pendingEvents = events.filter((event) => event.status === 'pending')
  const approvedEvents = events.filter((event) => event.status === 'approved')

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="container-page py-10">
        <section className="mb-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-500">
              Tardea Partners
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight md:text-5xl">
              Panel de sala
            </h1>
            <p className="mt-3 max-w-2xl text-slate-400">
              Crea eventos, consulta su estado y gestiona las propuestas que has enviado a Tardea.
            </p>
          </div>

          <a href="/dashboard/new-event" className="btn-primary">
            + Crear evento
          </a>
        </section>

        <section className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="card p-6">
            <p className="text-sm text-slate-400">Usuario conectado</p>
            <p className="mt-2 break-all font-semibold">{email}</p>
          </div>

          <div className="card p-6">
            <p className="text-sm text-slate-400">Eventos publicados</p>
            <p className="mt-2 text-4xl font-bold">{approvedEvents.length}</p>
          </div>

          <div className="card p-6">
            <p className="text-sm text-slate-400">Eventos pendientes</p>
            <p className="mt-2 text-4xl font-bold">{pendingEvents.length}</p>
          </div>
        </section>

        <section className="card p-6">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold">Mis eventos</h2>
              <p className="mt-1 text-sm text-slate-400">
                Los eventos pendientes serán revisados antes de publicarse.
              </p>
            </div>
          </div>

          {events.length === 0 && (
            <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-8 text-center">
              <p className="font-semibold">No tienes eventos todavía.</p>
              <p className="mt-2 text-sm text-slate-400">
                Crea tu primer evento para enviarlo a revisión.
              </p>

              <a href="/dashboard/new-event" className="btn-primary mt-6">
                Crear primer evento
              </a>
            </div>
          )}

          <div className="space-y-4">
            {events.map((event) => {
              const approved = event.status === 'approved'

              return (
                <article
                  key={event.id}
                  className="rounded-3xl border border-white/10 bg-slate-900/80 p-5"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="font-semibold">{event.title}</h3>

                      {event.date && (
                        <p className="mt-2 text-sm text-slate-400">
                          {event.date}
                        </p>
                      )}
                    </div>

                    <span
                      className={
                        approved
                          ? 'badge border-emerald-400/20 bg-emerald-500/20 text-emerald-200'
                          : 'badge border-yellow-400/20 bg-yellow-500/20 text-yellow-200'
                      }
                    >
                      {approved ? 'Publicado' : 'Pendiente'}
                    </span>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      </div>
    </main>
  )
}
