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
      <main className="min-h-screen bg-black px-6 py-10 text-white md:px-12">
        <p className="text-sm text-white/50">Cargando panel...</p>
      </main>
    )
  }

  const pendingEvents = events.filter((event) => event.status === 'pending')
  const approvedEvents = events.filter((event) => event.status === 'approved')

  return (
    <main className="min-h-screen bg-black px-6 py-8 text-white md:px-12">
      <section className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col gap-6 border-b border-white/10 pb-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-[#d7ff3f]">
              Tardea Partners
            </p>

            <h1 className="text-4xl font-black tracking-tight md:text-6xl">
              Panel de sala
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/60">
              Sube tus eventos, revisa su estado y gestiona tus propuestas antes
              de que aparezcan publicadas en Tardea.
            </p>
          </div>

          <a
            href="/dashboard/new-event"
            className="inline-flex items-center justify-center rounded-full bg-[#d7ff3f] px-7 py-4 text-sm font-black uppercase tracking-wide text-black transition hover:scale-[1.02] hover:bg-white"
          >
            + Crear evento
          </a>
        </div>

        <section className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-[28px] border border-white/10 bg-[#0b0b0b] p-6">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/35">
              Usuario
            </p>
            <p className="mt-3 break-all text-lg font-bold text-white">
              {email}
            </p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-[#0b0b0b] p-6">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/35">
              Aprobados
            </p>
            <p className="mt-3 text-5xl font-black text-[#d7ff3f]">
              {approvedEvents.length}
            </p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-[#0b0b0b] p-6">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/35">
              Pendientes
            </p>
            <p className="mt-3 text-5xl font-black text-white">
              {pendingEvents.length}
            </p>
          </div>
        </section>

        <section className="rounded-[32px] border border-white/10 bg-[#050505] p-5 md:p-7">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#d7ff3f]">
                Eventos
              </p>
              <h2 className="mt-2 text-3xl font-black">Mis eventos</h2>
            </div>

            <p className="text-sm text-white/45">
              Los eventos nuevos se envían como pendientes.
            </p>
          </div>

          {events.length === 0 && (
            <div className="rounded-[28px] border border-dashed border-white/15 bg-white/[0.02] p-10 text-center">
              <p className="text-xl font-bold">Todavía no tienes eventos.</p>
              <p className="mt-2 text-white/50">
                Crea tu primer evento y lo revisaremos antes de publicarlo.
              </p>

              <a
                href="/dashboard/new-event"
                className="mt-6 inline-flex rounded-full bg-[#d7ff3f] px-6 py-3 text-sm font-black uppercase text-black transition hover:bg-white"
              >
                Crear primer evento
              </a>
            </div>
          )}

          <div className="space-y-3">
            {events.map((event) => {
              const approved = event.status === 'approved'

              return (
                <article
                  key={event.id}
                  className="group rounded-[26px] border border-white/10 bg-[#0b0b0b] p-5 transition hover:border-[#d7ff3f]/50 hover:bg-[#101010]"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-xl font-black tracking-tight">
                        {event.title}
                      </h3>

                      <p className="mt-2 text-sm text-white/45">
                        {approved
                          ? 'Publicado en Tardea'
                          : 'En revisión por el equipo de Tardea'}
                      </p>
                    </div>

                    <span
                      className={
                        approved
                          ? 'w-fit rounded-full bg-[#d7ff3f] px-4 py-2 text-xs font-black uppercase tracking-wide text-black'
                          : 'w-fit rounded-full border border-white/15 bg-white/[0.03] px-4 py-2 text-xs font-black uppercase tracking-wide text-white/65'
                      }
                    >
                      {approved ? 'Aprobado' : 'Pendiente'}
                    </span>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      </section>
    </main>
  )
}
