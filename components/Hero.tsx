'use client'

import Link from 'next/link'
import {
  Calendar,
  MapPin,
  Music4,
  Ticket,
} from 'lucide-react'

export function Hero() {
  return (
    <section className="bg-hero-gradient">
      <div className="container-page grid gap-10 py-16 md:grid-cols-[1.2fr_0.8fr] md:py-24">
        <div>
          <span className="badge mb-6">
            Agenda premium de tardeo en Madrid
          </span>

          <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-white md:text-6xl">
            Descubre los mejores planes de tarde en Madrid.
          </h1>

          <a
            href="#eventos"
            className="btn-primary mt-8 inline-flex"
          >
            Buscar evento
          </a>

          <p className="mt-6 max-w-2xl text-lg text-slate-300">
            Una plataforma pensada para descubrir rooftops,
            afterworks, brunches y eventos de tarde con
            filtros útiles, diseño cuidado y fichas listas
            para reservar.
          </p>

          <div className="mt-8 flex flex-wrap gap-3 text-sm text-slate-200">
            <span className="badge">
              <Calendar className="mr-2 h-4 w-4" />
              Calendario
            </span>

            <span className="badge">
              <Music4 className="mr-2 h-4 w-4" />
              Música y ambiente
            </span>

            <span className="badge">
              <MapPin className="mr-2 h-4 w-4" />
              Zonas de Madrid
            </span>

            <span className="badge">
              <Ticket className="mr-2 h-4 w-4" />
              Precio y entradas
            </span>
          </div>
        </div>

        <div className="card border border-brand-500/20 bg-black/30 p-6 shadow-2xl shadow-brand-500/10">
          <div className="mb-5">
            <div className="mb-3 inline-flex items-center gap-3">
              <div className="rounded-2xl bg-brand-500/20 p-3 text-brand-400">
                <Calendar className="h-6 w-6" />
              </div>

              <div>
                <h2 className="text-3xl font-bold text-white">
                  ¿Qué día vas a salir?
                </h2>

                <p className="mt-1 text-slate-400">
                  Elige una fecha y descubre los mejores
                  eventos de tarde.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/20 p-6">
            <input
              type="date"
              className="input h-16 w-full text-lg"
              onChange={(e) => {
  localStorage.setItem('selectedDate', e.target.value)

  window.dispatchEvent(new Event('selectedDateChanged'))

  const eventos = document.getElementById('eventos')

  if (eventos) {
    eventos.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }
}}
            />

            <div className="mt-6 grid grid-cols-2 gap-3 text-sm text-slate-300">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="font-semibold text-white">
                  Rooftops
                </p>

                <p className="mt-1 text-slate-400">
                  Atardeceres y vistas premium.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="font-semibold text-white">
                  Brunch & tardeo
                </p>

                <p className="mt-1 text-slate-400">
                  Planes para empezar temprano.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="font-semibold text-white">
                  Afterworks
                </p>

                <p className="mt-1 text-slate-400">
                  El mejor ambiente después del trabajo.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="font-semibold text-white">
                  Eventos premium
                </p>

                <p className="mt-1 text-slate-400">
                  Los planes más top de Madrid.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}