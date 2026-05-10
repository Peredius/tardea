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
        .limit(8)

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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {featured.map((event) => (
          <article
            key={event.slug}
            className="group overflow-hidden rounded-3xl border border-white/10 bg-white/5 transition hover:-translate-y-1 hover:border-brand-500/40"
          >
            <Link href={`/eventos/${event.slug}`} className="block">
              <div
                className="h-44 bg-cover bg-center transition duration-500 group-hover:scale-105"
                style={{
                  backgroundImage: `url(${event.cover || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80'})`,
                }}
              />

              <div className="p-4">
                <div className="mb-3 flex flex-wrap gap-2">
                  <span className="badge">Destacado</span>
                  {event.type && <span className="badge">{event.type}</span>}
                </div>

                <h3 className="line-clamp-2 text-lg font-semibold text-white">
                  {event.title}
                </h3>

                <p className="mt-2 flex items-center gap-2 text-sm text-slate-400">
                  <MapPin className="h-4 w-4 text-brand-500" />
                  {event.venue}
                </p>

                <p className="mt-2 flex items-center gap-2 text-sm text-slate-400">
                  <CalendarDays className="h-4 w-4 text-brand-500" />
                  {new Date(event.date).toLocaleDateString('es-ES')}
                  {event.start_time ? ` · ${event.start_time.slice(0, 5)}` : ''}
                </p>

                <p className="mt-4 text-sm font-semibold text-brand-500">
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