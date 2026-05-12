'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Music4,
  Ticket,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

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
  const [selectedDates, setSelectedDates] = useState<string[]>([])
  const [eventDates, setEventDates] = useState<string[]>([])

  const days = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1)
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate()
    const startOffset = (firstDay.getDay() + 6) % 7

    return [
      ...Array(startOffset).fill(null),
      ...Array.from({ length: totalDays }, (_, i) => i + 1),
    ]
  }, [currentMonth, currentYear])

  useEffect(() => {
    async function loadEventDates() {
      const { data, error } = await supabase
        .from('events')
        .select('date')
        .eq('published', true)
        .eq('status', 'approved')

      if (error) {
        console.error(error)
        return
      }

      setEventDates([
        ...new Set((data || []).map((event) => event.date).filter(Boolean)),
      ])
    }

    loadEventDates()
  }, [])

  function changeMonth(direction: number) {
    const newDate = new Date(currentYear, currentMonth + direction, 1)

    setCurrentMonth(newDate.getMonth())
    setCurrentYear(newDate.getFullYear())
  }

  function selectDate(day: number) {
    const value = formatDate(currentYear, currentMonth, day)

    setSelectedDates((current) =>
      current.includes(value)
        ? current.filter((date) => date !== value)
        : [...current, value].sort()
    )
  }

  function searchSelectedDates() {
    if (selectedDates.length === 0) return

    localStorage.setItem('selectedDates', JSON.stringify(selectedDates))
    localStorage.setItem('selectedDate', selectedDates[0])
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
      <div className="container-page grid items-center gap-8 py-10 md:grid-cols-[1.15fr_0.85fr] md:gap-12 md:py-12">
        <div className="contents md:block">
          
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-white md:text-[56px] md:leading-[1.02]">
            Descubre los mejores{' '}
            <span className="text-brand-500">planes de tarde</span> en Madrid.
          </h1>

          <div className="order-3 mt-2 flex flex-wrap gap-5 text-sm text-slate-200 md:mt-6">
            <div className="flex items-start gap-2">
              <Calendar className="mt-0.5 h-4 w-4 text-brand-500" />
              <div>
                <p className="text-sm font-semibold text-white">Agenda diaria</p>
                <p className="text-[11px] text-slate-400">Actualizada</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Music4 className="mt-0.5 h-4 w-4 text-brand-500" />
              <div>
                <p className="text-sm font-semibold text-white">
                  Música y ambiente
                </p>
                <p className="text-[11px] text-slate-400">
                  Para todos los gustos
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 text-brand-500" />
              <div>
                <p className="text-sm font-semibold text-white">
                  Zonas de Madrid
                </p>
                <p className="text-[11px] text-slate-400">Descubre tu zona</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Ticket className="mt-0.5 h-4 w-4 text-brand-500" />
              <div>
                <p className="text-sm font-semibold text-white">
                  Precios y entradas
                </p>
                <p className="text-[11px] text-slate-400">Encuentra tu plan</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative order-2 mx-auto w-full max-w-[520px] overflow-hidden rounded-[26px] border border-brand-500/35 bg-black/40 p-3 shadow-[0_0_60px_rgba(255,0,102,0.16)] backdrop-blur-xl md:order-none">
          <div className="pointer-events-none absolute inset-0 rounded-[32px] bg-[radial-gradient(circle_at_top,rgba(255,0,120,0.20),transparent_58%)]" />
          <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-brand-500 to-transparent" />

          <div className="relative">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div className="rounded-2xl bg-brand-500/20 p-3 text-brand-400 shadow-[0_0_35px_rgba(255,0,102,0.25)]">
                <Calendar className="h-6 w-6" />
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-bold leading-none text-white sm:text-xl">
                  ¿Qué día vas a salir?
                </h2>
                <p className="mt-1 text-[10px] font-medium normal-case tracking-0 text-slate-500 sm:text-[11px]">
                  seleciona uno o varios días
                </p>

              </div>

              <button
                type="button"
                onClick={searchSelectedDates}
                disabled={selectedDates.length === 0}
                className="rounded-full bg-brand-500 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-slate-500 sm:px-4 sm:py-2 sm:text-xs"
              >
                Buscar
              </button>
            </div>

            <div className="rounded-[22px] border border-white/10 bg-[#060816]/90 p-3 shadow-inner shadow-brand-500/5">
              <div className="mb-5 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => changeMonth(-1)}
                  className="rounded-full p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                <p className="text-base font-bold text-white">
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

              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-slate-500">
                {weekDays.map((day) => (
                  <div key={day}>{day}</div>
                ))}
              </div>

              <div className="mt-3 grid grid-cols-7 gap-1 text-center">
                {days.map((day, index) => {
                  if (!day) return <div key={index} />

                  const value = formatDate(currentYear, currentMonth, day)

                  const isToday =
                    day === today.getDate() &&
                    currentMonth === today.getMonth() &&
                    currentYear === today.getFullYear()

                  const isSelected = selectedDates.includes(value)
                  const hasEvents = eventDates.includes(value)

                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => selectDate(day)}
                      className={`relative mx-auto flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold transition ${
                        isSelected
                          ? 'bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-[0_0_30px_rgba(255,0,102,0.55)]'
                          : isToday
                            ? 'border border-brand-500 text-brand-400'
                            : hasEvents
                              ? 'bg-brand-500/15 text-white ring-1 ring-brand-500/35 hover:bg-brand-500/25'
                            : 'text-slate-200 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {day}
                      {hasEvents && !isSelected && (
                        <span className="absolute -bottom-1 h-1 w-1 rounded-full bg-brand-500" />
                      )}
                    </button>
                  )
                })}
              </div>

              
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
