'use client'

import { useMemo, useState } from 'react'
import { Calendar, ChevronLeft, ChevronRight, MapPin, Music4, Ticket } from 'lucide-react'

const monthNames = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
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
      eventos.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <section className="bg-hero-gradient">
      <div className="container-page grid gap-10 py-16 md:grid-cols-[1fr_1fr] md:py-24">
        <div>
          <span className="badge mb-6">Agenda premium de tardeo en Madrid</span>

          <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-white md:text-6xl">
            Descubre los mejores <span className="text-brand-500">planes de tarde</span> en Madrid.
          </h1>

          <a href="#eventos" className="btn-primary mt-8 inline-flex">
            Buscar eventos
          </a>

          <p className="mt-6 max-w-2xl text-lg text-slate-300">
            Rooftops, brunches, afterworks y eventos de tarde seleccionados cada día para que solo tengas que elegir y disfrutar.
          </p>

          <div className="mt-8 flex flex-wrap gap-3 text-sm text-slate-200">
            <span className="badge"><Calendar className="mr-2 h-4 w-4" /> Agenda diaria</span>
            <span className="badge"><Music4 className="mr-2 h-4 w-4" /> Música y ambiente</span>
            <span className="badge"><MapPin className="mr-2 h-4 w-4" /> Zonas de Madrid</span>
            <span className="badge"><Ticket className="mr-2 h-4 w-4" /> Precios y entradas</span>
          </div>
        </div>

        <div className="card border border-brand-500/30 bg-black/30 p-6 shadow-2xl shadow-brand-500/10">
          <div className="mb-5 flex items-center gap-4">
            <div className="rounded-2xl bg-brand-500/20 p-3 text-brand-400">
              <Calendar className="h-7 w-7" />
            </div>

            <div>
              <h2 className="text-3xl font-bold text-white">
                ¿Qué día vas a salir?
              </h2>
              <p className="mt-1 text-slate-400">
                Elige una fecha y descubre los mejores eventos de tarde.
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6">
            <div className="mb-6 flex items-center justify-between">
              <button
                type="button"
                onClick={() => changeMonth(-1)}
                className="rounded-full p-2 text-slate-300 hover:bg-white/10 hover:text-white"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <p className="text-lg font-bold text-white">
                {monthNames[currentMonth]} {currentYear}
              </p>

              <button
                type="button"
                onClick={() => changeMonth(1)}
                className="rounded-full p-2 text-slate-300 hover:bg-white/10 hover:text-white"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-slate-400">
              {weekDays.map((day) => (
                <div key={day}>{day}</div>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-7 gap-2 text-center">
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
                    className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition ${
                      isSelected
                        ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30'
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

            <p className="mt-6 text-center text-sm text-slate-400">
              ✨ Los mejores planes, cada día.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}