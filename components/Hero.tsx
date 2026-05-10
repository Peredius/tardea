'use client'

import { useMemo, useState } from 'react'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Music4,
  Ticket,
} from 'lucide-react'

const monthNames = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

const weekDays = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM']

function formatDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function Hero() {
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [selectedDate, setSelectedDate] = useState('')

  const days = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1)
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate()
    const startOffset = (firstDay.getDay() + 6) % 7

    return [
      ...Array(startOffset).fill(null),
      ...Array.from({ length: totalDays }, (_, i) => i + 1),
    ]
  }, [currentMonth, currentYear])

  function changeMonth(direction: number) {
    const newDate = new Date(currentYear, currentMonth + direction, 1)
    setCurrentMonth(newDate.getMonth())
    setCurrentYear(newDate.getFullYear())
  }

  function selectDate(day: number) {
    const value = formatDate(currentYear, currentMonth, day)

    setSelectedDate(value)
    localStorage.setItem('selectedDate', value)
    window.dispatchEvent(new Event('selectedDateChanged'))

    const eventos = document.getElementById('eventos')

    if (eventos) {
      eventos.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }
  }

  return (
    <section className="bg-hero-gradient">
      <div className="container-page grid items-center gap-12 py-12 md:grid-cols-[0.95fr_1.05fr] md:py-16">
        <div>
          <span className="badge mb-6">
            Agenda premium de tardeo en Madrid
          </span>

          <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-white md:text-5xl">
            Descubre los mejores{' '}
            <span className="text-brand-500">planes de tarde</span> en Madrid.
          </h1>

          <a href="#eventos" className="btn-primary mt-8 inline-flex">
            Buscar eventos
          </a>

          <p className="mt-6 max-w-2xl text-lg text-slate-300">
            Rooftops, brunches, afterworks y eventos de tarde seleccionados cada
            día para que solo tengas que elegir y disfrutar.
          </p>

          <div className="mt-8 flex flex-wrap gap-8 text-sm text-slate-200">
            <div className="flex items-start gap-3">
              <Calendar className="mt-1 h-5 w-5 text-brand-500" />
              <div>
                <p className="font-semibold text-white">Agenda diaria</p>
                <p className="text-xs text-slate-400">Actualizada</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Music4 className="mt-1 h-5 w-5 text-brand-500" />
              <div>
                <p className="font-semibold text-white">Música y ambiente</p>
                <p className="text-xs text-slate-400">Para todos los gustos</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="mt-1 h-5 w-5 text-brand-500" />
              <div>
                <p className="font-semibold text-white">Zonas de Madrid</p>
                <p className="text-xs text-slate-400">Descubre tu zona</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Ticket className="mt-1 h-5 w-5 text-brand-500" />
              <div>
                <p className="font-semibold text-white">Precios y entradas</p>
                <p className="text-xs text-slate-400">Encuentra tu plan</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[32px] border border-brand-500/35 bg-black/40 p-5 shadow-[0_0_85px_rgba(255,0,102,0.22)] backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-0 rounded-[32px] bg-[radial-gradient(circle_at_top,rgba(255,0,120,0.20),transparent_58%)]" />
          <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-brand-500 to-transparent" />

          <div className="relative">
            <div className="mb-4 flex items-center gap-4">
              <div className="rounded-2xl bg-brand-500/20 p-3 text-brand-400 shadow-[0_0_35px_rgba(255,0,102,0.25)]">
                <Calendar className="h-6 w-6" />
              </div>

              <div>
                <h2 className="text-[2rem] font-bold leading-none text-white">
                  ¿Qué día vas a salir?
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Elige una fecha y descubre los mejores eventos de tarde.
                </p>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-[#060816]/90 p-5 shadow-inner shadow-brand-500/5">
              <div className="mb-5 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => changeMonth(-1)}
                  className="rounded-full p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                <p className="text-lg font-bold text-white">
                  {monthNames[currentMonth]} {currentYear}
                </p>

                <button
                  type="button"
                  onClick={() => changeMonth(1)}
                  className="rounded-full p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-semibold text-slate-400">
                {weekDays.map((day) => (
                  <div key={day}>{day}</div>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-7 gap-1.5 text-center">
                {days.map((day, index) => {
                  if (!day) return <div key={index} />

                  const value = formatDate(currentYear, currentMonth, day)

                  const isToday =
                    day === today.getDate() &&
                    currentMonth === today.getMonth() &&
                    currentYear === today.getFullYear()

                  const isSelected = selectedDate === value

                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => selectDate(day)}
                      className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition ${
                        isSelected
                          ? 'bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-[0_0_30px_rgba(255,0,102,0.55)]'
                          : isToday
                            ? 'border border-brand-500 text-brand-400'
                            : 'text-slate-200 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {day}
                    </button>
                  )
                })}
              </div>

              <p className="mt-5 text-center text-sm text-slate-400">
                ✨ Los mejores planes, cada día.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}