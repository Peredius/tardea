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
      <main className="min-h-screen bg-black text-white px-6 py-10 md:px-12">
        <p className="text-white/60">Cargando...</p>
      </main>
    )
  }

  const pendingEvents = events.filter((event) => event.status === 'pending')
  const approvedEvents = events.filter((event) => event.status === 'approved')

  return (
    <main className="min-h-screen bg-black text-white px-6 py-10 md:px-12">
      <section className="mb-10 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-white/40">
            Dashboard
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-tight">
            Panel de sala
          </h1>
          <p className="mt-3 max-w-2xl text-white/60">
            Gestiona tus eventos, revisa su estado y crea nuevas propuestas para aprobación.
          </p>
        </div>

        <a
          href="/dashboard/new-event"
          className="rounded-full bg-[#d7ff3f] px-6 py-3 text-sm font-black text-black transition hover:scale-[1.02] hover:opacity-90"
        >
          + Crear evento
        </a>
      </section>

      <section className="mb-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-sm text-white/50">Usuario conectado</p>
          <p className="mt-2 font-semibold">{email}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-sm text-white/50">Eventos aprobados</p>
          <p className="mt-2 text-3xl font-black">{approvedEvents.length}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-sm text-white/50">Pendientes de revisión</p>
          <p className="mt-2 text-3xl font-black">{pendingEvents.length}</p>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.02] p-5 md:p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-white/40">
              Eventos
            </p>
            <h2 className="mt-1 text-2xl font-black">Mis eventos</h2>
          </div>
        </div>

        {events.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center">
            <p className="text-white/60">No tienes eventos todavía.</p>
            <a
              href="/dashboard/new-event"
              className="mt-5 inline-block rounded-full bg-[#d7ff3f] px-5 py-3 text-sm font-black text-black"
            >
              Crear mi primer evento
            </a>
          </div>
        )}

        <div className="space-y-3">
          {events.map((event) => (
            <div
              key={event.id}
              className="rounded-2xl border border-white/10 bg-black/40 p-5 transition hover:border-white/20 hover:bg-white/[0.04]"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-lg font-bold">{event.title}</h3>
                  <p className="mt-1 text-sm text-white/45">
                    Evento enviado para revisión
                  </p>
                </div>

                <span
                  className={
                    event.status === 'approved'
                      ? 'w-fit rounded-full bg-[#d7ff3f] px-3 py-1 text-xs font-black uppercase text-black'
                      : 'w-fit rounded-full border border-white/15 px-3 py-1 text-xs font-bold uppercase text-white/60'
                  }
                >
                  {event.status === 'approved' ? 'Aprobado' : 'Pendiente'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
