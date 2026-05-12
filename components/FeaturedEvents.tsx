'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CalendarDays, MapPin } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export function FeaturedEvents() {
  const [featured, setFeatured] = useState<any[]>([])

  useEffect(() => {
    async function fetchFeaturedEvents() {
      const today = new Date().toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('published', true)
        .eq('status', 'approved')
        .eq('featured', true)
        .gte('date', today)
        .order('date', { ascending: true })
        .limit(4)

      if (error) {
        console.error(error)
        return
      }

      setFeatured(data || [])
    }

    fetchFeaturedEvents()
  }, [])

  if (featured.length === 0) return null

  return (
    <section id="destacados" className="container-page py-8 md:py-12">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-brand-500">
            Selección editorial
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-white">
            Destacados de la semana
          </h2>
        </div>

        <p className="hidden text-sm text-slate-400 md:block">
          Eventos recomendados por TARDEA
        </p>
      </div>

      <div className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-3 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 xl:grid-cols-4 [&::-webkit-scrollbar]:hidden">
        {featured.map((event) => (
          <article
            key={event.slug}
            className="group min-w-[78vw] snap-start overflow-hidden rounded-3xl border border-white/10 bg-white/5 transition hover:-translate-y-1 hover:border-brand-500/40 sm:min-w-0"
          >
            <Link href={`/eventos/${event.slug}`} className="relative flex aspect-[3/4] overflow-hidden sm:block sm:aspect-auto">
              <div
                className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105 sm:relative sm:h-44 sm:w-full"
                style={{
                  backgroundImage: `url(${event.cover || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80'})`,
                }}
              />

              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/55 to-transparent sm:hidden" />

              <div className="relative z-10 flex min-w-0 flex-1 flex-col justify-end p-4 sm:justify-start">
                <div className="mb-2 flex flex-wrap gap-1.5 sm:mb-3 sm:gap-2">
                  <span className="badge">Destacado</span>
                  {event.type && <span className="badge hidden sm:inline-flex">{event.type}</span>}
                </div>

                <h3 className="line-clamp-2 text-base font-semibold leading-tight text-white sm:text-lg">
                  {event.title}
                </h3>

                <p className="mt-2 flex items-center gap-2 text-xs text-slate-400 sm:text-sm">
                  <MapPin className="h-4 w-4 text-brand-500" />
                  {event.venue}
                </p>

                <p className="mt-2 flex items-center gap-2 text-xs text-slate-400 sm:text-sm">
                  <CalendarDays className="h-4 w-4 text-brand-500" />
                  {new Date(event.date).toLocaleDateString('es-ES')}
                  {event.start_time ? ` · ${event.start_time.slice(0, 5)}` : ''}
                </p>

                <p className="mt-auto pt-3 text-sm font-semibold text-brand-500 sm:mt-4 sm:pt-0">
                  Ver evento →
                </p>
              </div>
            </Link>
          </article>
        ))}
      </div>
    </section>
  )
}
