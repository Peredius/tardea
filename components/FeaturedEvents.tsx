'use client'

import { useEffect, useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import Link from 'next/link'
import { CalendarDays, MapPin } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export function FeaturedEvents() {
  const carouselRef = useRef<HTMLDivElement | null>(null)
  const [featured, setFeatured] = useState<any[]>([])
  const [activeEventSlug, setActiveEventSlug] = useState('')

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
      setActiveEventSlug(data?.[0]?.slug || '')
    }

    fetchFeaturedEvents()
  }, [])

  if (featured.length === 0) return null

  function updateActiveEventFromScroll() {
    const carousel = carouselRef.current
    if (!carousel) return

    const carouselBox = carousel.getBoundingClientRect()
    const center = carouselBox.left + carouselBox.width / 2
    const cards = Array.from(
      carousel.querySelectorAll<HTMLElement>('[data-event-card]')
    )

    const closest = cards.reduce<{ slug: string; distance: number } | null>(
      (best, card) => {
        const box = card.getBoundingClientRect()
        const cardCenter = box.left + box.width / 2
        const distance = Math.abs(center - cardCenter)
        const slug = card.dataset.slug || ''

        if (!best || distance < best.distance) return { slug, distance }
        return best
      },
      null
    )

    if (closest?.slug) setActiveEventSlug(closest.slug)
  }

  function openActiveEventOnTap(
    slug: string,
    event: MouseEvent<HTMLElement>
  ) {
    if (window.innerWidth >= 640) return

    const target = event.target as HTMLElement
    if (target.closest('a, button, input, select, textarea')) return

    if (activeEventSlug === slug) {
      window.location.href = `/eventos/${slug}`
    }
  }

  return (
    <section id="destacados" className="container-page py-8 md:py-12">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-brand-500">
            Top eventos Madrid
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-white">
            Destacados de la semana
          </h2>
        </div>

        <p className="hidden text-sm text-slate-400 md:block">
          Eventos recomendados por TARDEA
        </p>
      </div>

      <div
        ref={carouselRef}
        onScroll={updateActiveEventFromScroll}
        className="-mx-5 flex snap-x snap-mandatory gap-2 overflow-x-auto px-5 pb-3 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 xl:grid-cols-4 [&::-webkit-scrollbar]:hidden"
      >
        {featured.map((event) => (
          <article
            key={event.slug}
            data-event-card
            data-slug={event.slug}
            onClick={(clickEvent) => openActiveEventOnTap(event.slug, clickEvent)}
            className={`group snap-center overflow-hidden rounded-3xl border border-white/10 bg-white/5 transition duration-300 hover:border-brand-500/40 sm:min-w-0 sm:scale-100 ${
              activeEventSlug === event.slug
                ? 'min-w-[56vw] scale-100'
                : 'min-w-[50vw] scale-[0.94] opacity-80'
            }`}
          >
            <div className="relative flex aspect-[9/16] overflow-hidden sm:block sm:aspect-auto">
              <Link
                href={`/eventos/${event.slug}`}
                aria-label={`Ver ${event.title}`}
                className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105 sm:relative sm:h-44 sm:w-full"
                style={{
                  backgroundImage: `url(${event.cover || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80'})`,
                }}
              />

              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-transparent sm:hidden" />

              <div className="relative z-10 mt-auto flex min-w-0 flex-1 flex-col justify-end self-end p-4 sm:mt-0 sm:justify-start sm:self-auto">
                <div className="mb-2 flex flex-wrap gap-1.5 sm:mb-3 sm:gap-2">
                  <span className="badge">Destacado</span>
                  {event.type && <span className="badge hidden sm:inline-flex">{event.type}</span>}
                </div>

                <h3 className="line-clamp-2 text-base font-semibold leading-tight text-white sm:text-lg">
                  {event.title}
                </h3>

                <p className="mt-2 flex items-center gap-2 text-xs text-slate-200 sm:text-sm sm:text-slate-400">
                  <MapPin className="h-4 w-4 text-brand-500" />
                  {event.venue}
                </p>

                <p className="mt-2 flex items-center gap-2 text-xs text-slate-200 sm:text-sm sm:text-slate-400">
                  <CalendarDays className="h-4 w-4 text-brand-500" />
                  {new Date(event.date).toLocaleDateString('es-ES')}
                  {event.start_time ? ` · ${event.start_time.slice(0, 5)}` : ''}
                </p>

                <Link href={`/eventos/${event.slug}`} className="mt-3 text-sm font-semibold text-brand-500 hover:underline sm:mt-4">
                  Ver evento →
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
