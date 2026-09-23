'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { CalendarDays, Clock3, Euro, List, Map as MapIcon, MapPin, Music4, SlidersHorizontal, Users, X } from 'lucide-react'
import { audienceTypes, eventTypes, musicTypes, priceRanges } from '@/lib/data'
import { optimizedCoverUrl } from '@/lib/images'
import { canonicalizeMusicList, normalizeMusicKey } from '@/lib/music'

export type WeekendEvent = {
  id: string
  slug: string
  title: string
  venue: string | null
  area: string | null
  address: string | null
  maps_url: string | null
  date: string
  start_time: string | null
  end_time: string | null
  type: string | null
  music: string[] | null
  audience: string | null
  price_from: number | null
  cover: string | null
}

const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
const fallbackCover = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=76'
let mapsLoader: Promise<void> | null = null

function addDays(value: string, days: number) {
  const date = new Date(`${value}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function formatDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

function formatPrice(value: number | null) {
  if (value === 0) return 'Gratis'
  return value === null ? 'Consultar precio' : `Desde ${value} €`
}

function matchesPrice(range: string, price: number | null) {
  if (range === 'Todos') return true
  if (price === null) return false
  if (range === 'Gratis') return price === 0
  if (range === '0-15€') return price > 0 && price <= 15
  if (range === '15-30€') return price > 15 && price <= 30
  return range === '30€+' ? price > 30 : true
}

function loadGoogleMaps() {
  if ((window as any).google?.maps) return Promise.resolve()
  if (mapsLoader) return mapsLoader

  mapsLoader = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById('google-maps-js') as HTMLScriptElement | null
    const script = existing || document.createElement('script')
    script.addEventListener('load', () => resolve(), { once: true })
    script.addEventListener('error', () => {
      mapsLoader = null
      reject(new Error('Google Maps no disponible'))
    }, { once: true })
    if (!existing) {
      script.id = 'google-maps-js'
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(mapsApiKey)}`
      script.async = true
      script.defer = true
      document.head.appendChild(script)
    }
  })

  return mapsLoader
}

function coordinatesFromUrl(url: string | null) {
  if (!url) return null
  let decoded = url
  try { decoded = decodeURIComponent(url) } catch { /* Keep the original URL. */ }
  const match = decoded.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/)
    || decoded.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/)
    || decoded.match(/[?&](?:q|query)=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/)
  if (!match) return null
  const lat = Number(match[1])
  const lng = Number(match[2])
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null
}

function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;')
}

function mapInfoHtml(event: WeekendEvent) {
  return `<div style="min-width:150px;color:#111827;font:12px Arial,sans-serif"><strong>${escapeHtml(event.title)}</strong><br>${escapeHtml(event.venue || event.area || '')}<br><a href="/eventos/${encodeURIComponent(event.slug)}">Ver ficha</a></div>`
}

function routeUrl(event: WeekendEvent) {
  const coordinates = coordinatesFromUrl(event.maps_url)
  const destination = coordinates ? `${coordinates.lat},${coordinates.lng}` : event.address
  return destination ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}` : null
}

async function eventPosition(geocoder: any, event: WeekendEvent) {
  const coordinates = coordinatesFromUrl(event.maps_url)
  if (coordinates) return coordinates
  if (!event.address?.trim()) return null

  return new Promise<any | null>((resolve) => {
    const address = [event.address, event.area, 'Madrid', 'España'].filter(Boolean).join(', ')
    geocoder.geocode({ address, region: 'ES' }, (results: any[], status: string) => {
      resolve(status === 'OK' ? results?.[0]?.geometry?.location || null : null)
    })
  })
}

function SelectFilter({ label, icon, value, options, onChange }: {
  label: string
  icon: React.ReactNode
  value: string
  options: string[]
  onChange: (value: string) => void
}) {
  return (
    <label className="min-w-0 text-sm text-slate-300">
      <span className="mb-2 flex items-center gap-2">{icon}{label}</span>
      <select className="select w-full" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option} value={option}>{label === 'Día' && option !== 'Todos' ? formatDate(option) : option}</option>)}
      </select>
    </label>
  )
}

export function WeekendAgenda({ events, friday, sunday }: {
  events: WeekendEvent[]
  friday: string
  sunday: string
}) {
  const [day, setDay] = useState('Todos')
  const [type, setType] = useState('Todos')
  const [music, setMusic] = useState('Todas')
  const [audience, setAudience] = useState('Todas')
  const [price, setPrice] = useState('Todos')
  const [area, setArea] = useState('Todas')
  const [view, setView] = useState<'list' | 'map'>('list')
  const [mapStatus, setMapStatus] = useState('')
  const [activeSlug, setActiveSlug] = useState('')
  const mapElement = useRef<HTMLDivElement | null>(null)
  const mapInstance = useRef<any>(null)
  const markers = useRef<any[]>([])
  const markerBySlug = useRef<Map<string, any>>(new Map())
  const infoWindow = useRef<any>(null)
  const days = useMemo(() => [friday, addDays(friday, 1), sunday], [friday, sunday])
  const areas = useMemo(() => ['Todas', ...Array.from(new Set(events.map((event) => event.area)
    .filter((value): value is string => Boolean(value)))).sort((a, b) => a.localeCompare(b, 'es'))], [events])
  const activeFilters = day !== 'Todos' || type !== 'Todos' || music !== 'Todas'
    || audience !== 'Todas' || price !== 'Todos' || area !== 'Todas'

  const filtered = useMemo(() => events.filter((event) =>
    (day === 'Todos' || event.date === day) &&
    (type === 'Todos' || event.type === type) &&
    (music === 'Todas' || canonicalizeMusicList(event.music).some((item) =>
      normalizeMusicKey(item) === normalizeMusicKey(music))) &&
    (audience === 'Todas' || event.audience === audience) &&
    matchesPrice(price, event.price_from) &&
    (area === 'Todas' || event.area === area)
  ), [events, day, type, music, audience, price, area])

  const grouped = useMemo(() => filtered.reduce<Record<string, WeekendEvent[]>>((groups, event) => {
    groups[event.date] = [...(groups[event.date] || []), event]
    return groups
  }, {}), [filtered])

  function clearFilters() {
    setDay('Todos')
    setType('Todos')
    setMusic('Todas')
    setAudience('Todas')
    setPrice('Todos')
    setArea('Todas')
  }

  useEffect(() => {
    if (view !== 'map' || !mapElement.current) return
    if (!mapsApiKey) {
      setMapStatus('El mapa no está disponible ahora. Puedes consultar las fichas en la lista.')
      return
    }

    let cancelled = false
    async function renderMap() {
      setMapStatus('Cargando mapa...')
      try {
        await loadGoogleMaps()
        if (cancelled || !mapElement.current) return
        const google = (window as any).google
        const map = mapInstance.current || new google.maps.Map(mapElement.current, {
          center: { lat: 40.4168, lng: -3.7038 }, zoom: 12,
          mapTypeControl: false, streetViewControl: false, fullscreenControl: true,
        })
        mapInstance.current = map
        markers.current.forEach((marker) => marker.setMap(null))
        markers.current = []
        markerBySlug.current.clear()
        infoWindow.current ||= new google.maps.InfoWindow()
        const geocoder = new google.maps.Geocoder()
        const bounds = new google.maps.LatLngBounds()
        let located = 0

        for (const [index, event] of filtered.slice(0, 40).entries()) {
          const position = await eventPosition(geocoder, event)
          if (cancelled) return
          if (!position) continue
          const marker = new google.maps.Marker({
            position, map, title: event.title,
            label: { text: String(index + 1), color: '#fff', fontWeight: '800' },
          })
          marker.addListener('click', () => {
            setActiveSlug(event.slug)
            infoWindow.current.setContent(mapInfoHtml(event))
            infoWindow.current.open({ anchor: marker, map })
          })
          markers.current.push(marker)
          markerBySlug.current.set(event.slug, marker)
          bounds.extend(position)
          located += 1
        }

        if (located > 1) map.fitBounds(bounds, 64)
        else if (located === 1) { map.setCenter(bounds.getCenter()); map.setZoom(14) }
        else { map.setCenter({ lat: 40.4168, lng: -3.7038 }); map.setZoom(12) }
        setMapStatus(located === 0 && filtered.length > 0
          ? 'Estas fichas aún no tienen una dirección verificable para situarlas en el mapa.'
          : filtered.length > 40 ? `Mostrando 40 de ${filtered.length} eventos.` : '')
      } catch {
        if (!cancelled) setMapStatus('No se pudo cargar el mapa. Consulta los eventos en la lista.')
      }
    }
    renderMap()
    return () => {
      cancelled = true
      markers.current.forEach((marker) => marker.setMap(null))
      markers.current = []
      markerBySlug.current.clear()
      infoWindow.current?.close()
      infoWindow.current = null
      mapInstance.current = null
    }
  }, [filtered, view])

  function selectMapEvent(event: WeekendEvent) {
    setActiveSlug(event.slug)
    const marker = markerBySlug.current.get(event.slug)
    if (!marker || !mapInstance.current || !infoWindow.current) return
    mapInstance.current.panTo(marker.getPosition())
    infoWindow.current.setContent(mapInfoHtml(event))
    infoWindow.current.open({ anchor: marker, map: mapInstance.current })
  }

  return (
    <section id="agenda-fin-de-semana" className="container-page scroll-mt-20 py-7 md:py-10">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <SelectFilter label="Día" icon={<CalendarDays className="h-4 w-4" />} value={day}
          options={['Todos', ...days]} onChange={setDay} />
        <SelectFilter label="Tipo" icon={<Clock3 className="h-4 w-4" />} value={type} options={eventTypes} onChange={setType} />
        <SelectFilter label="Música" icon={<Music4 className="h-4 w-4" />} value={music} options={musicTypes} onChange={setMusic} />
        <SelectFilter label="Edad" icon={<Users className="h-4 w-4" />} value={audience} options={audienceTypes} onChange={setAudience} />
        <SelectFilter label="Precio" icon={<Euro className="h-4 w-4" />} value={price} options={priceRanges} onChange={setPrice} />
        <SelectFilter label="Zona" icon={<MapPin className="h-4 w-4" />} value={area} options={areas} onChange={setArea} />
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
        <div className="flex items-center gap-3 text-sm font-semibold text-brand-500">
          <SlidersHorizontal className="h-4 w-4" /> Filtros de eventos
          {activeFilters && <button type="button" onClick={clearFilters} className="inline-flex items-center gap-1 text-xs font-medium text-slate-300 hover:text-white"><X className="h-3.5 w-3.5" /> Limpiar</button>}
        </div>
        <span className="text-sm font-semibold text-white">{filtered.length} evento{filtered.length === 1 ? '' : 's'} encontrado{filtered.length === 1 ? '' : 's'}</span>
      </div>

      <div className="mt-4 inline-flex border border-white/10 bg-slate-900 p-1" role="group" aria-label="Vista de resultados">
        <button type="button" onClick={() => setView('list')} aria-pressed={view === 'list'} className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold ${view === 'list' ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'}`}><List className="h-4 w-4" /> Lista</button>
        <button type="button" onClick={() => setView('map')} aria-pressed={view === 'map'} className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold ${view === 'map' ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'}`}><MapIcon className="h-4 w-4" /> Mapa</button>
      </div>

      {view === 'map' ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="relative min-h-[440px] overflow-hidden border border-white/10 bg-slate-900">
            <div ref={mapElement} className="absolute inset-0" />
            {mapStatus && <p className="absolute bottom-3 left-3 right-3 bg-slate-950/90 px-3 py-2 text-sm text-white">{mapStatus}</p>}
          </div>
          <div className="max-h-[560px] space-y-2 overflow-y-auto">
            {filtered.map((event, index) => (
              <article key={event.id} className={`border p-3 ${activeSlug === event.slug ? 'border-brand-500 bg-brand-500/10' : 'border-white/10 bg-slate-900'}`}>
                <button type="button" onClick={() => selectMapEvent(event)} className="w-full text-left">
                  <span className="block text-sm font-bold text-white">{index + 1}. {event.title}</span>
                  <span className="mt-1 block text-xs text-slate-400">{formatDate(event.date)} · {event.start_time?.slice(0, 5) || 'Horario pendiente'} · {event.venue || event.area || 'Ubicación pendiente'}</span>
                </button>
                <div className="mt-2 flex flex-wrap gap-3 text-xs font-semibold text-brand-500">
                  <Link href={`/eventos/${event.slug}`} className="hover:underline">Ver ficha</Link>
                  {routeUrl(event) && <a href={routeUrl(event) || '#'} target="_blank" rel="noopener noreferrer" className="hover:underline">Ruta</a>}
                  {event.maps_url && <a href={event.maps_url} target="_blank" rel="noopener noreferrer" className="hover:underline">Google Maps</a>}
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : filtered.length > 0 ? (
        <div className="mt-7 space-y-10">
          {Object.entries(grouped).map(([date, dateEvents]) => (
            <section key={date} aria-labelledby={`fecha-${date}`}>
              <div className="flex items-center gap-3 border-b border-white/10 pb-3">
                <CalendarDays className="h-5 w-5 text-brand-500" />
                <h2 id={`fecha-${date}`} className="text-xl font-bold capitalize text-white">{formatDate(date)}</h2>
                <span className="ml-auto text-sm text-slate-400">{dateEvents.length}</span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {dateEvents.map((event) => (
                  <article key={event.id} className="overflow-hidden rounded-lg border border-white/10 bg-slate-900">
                    <Link href={`/eventos/${event.slug}`} aria-label={`Ver ${event.title}`} className="block aspect-[4/3] bg-cover bg-center"
                      style={{ backgroundImage: `url(${optimizedCoverUrl(event.cover || fallbackCover, { width: 480, quality: 72 })})` }} />
                    <div className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {event.type && <span className="badge max-w-full truncate !px-2 !py-0.5 !text-[10px]">{event.type}</span>}
                        {event.area && <span className="badge max-w-full truncate !px-2 !py-0.5 !text-[10px]">{event.area}</span>}
                        {event.audience && <span className="badge max-w-full truncate !px-2 !py-0.5 !text-[10px]">{event.audience}</span>}
                      </div>
                      <h3 className="mt-2 min-h-10 break-words text-sm font-bold leading-5 text-white"><Link href={`/eventos/${event.slug}`} className="hover:text-brand-500">{event.title}</Link></h3>
                      <div className="mt-2 space-y-1 text-xs text-slate-300">
                        <p className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5 shrink-0 text-brand-500" />{event.start_time?.slice(0, 5) || 'Horario por confirmar'}{event.end_time ? ` - ${event.end_time.slice(0, 5)}` : ''}</p>
                        <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 shrink-0 text-brand-500" /><span className="truncate" title={event.venue || event.area || 'Madrid'}>{event.venue || event.area || 'Madrid'}</span></p>
                        <p className="flex items-center gap-1.5"><Euro className="h-3.5 w-3.5 shrink-0 text-brand-500" />{formatPrice(event.price_from)}</p>
                      </div>
                      {(event.music || []).length > 0 && <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400"><Music4 className="h-3.5 w-3.5 shrink-0 text-brand-500" /><span className="truncate">{canonicalizeMusicList(event.music).slice(0, 3).join(' · ')}</span></p>}
                      <Link href={`/eventos/${event.slug}`} className="mt-3 inline-flex text-xs font-semibold text-brand-500 hover:underline">Ver ficha</Link>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="mt-6 border-y border-white/10 py-8 text-center">
          <h2 className="text-lg font-bold text-white">{events.length > 0 ? 'No hay eventos con estos filtros' : 'Agenda en actualización'}</h2>
          <p className="mt-2 text-sm text-slate-400">{events.length > 0 ? 'Prueba con otra combinación.' : 'Todavía no hay eventos publicados para estas fechas.'}</p>
          {activeFilters && <button type="button" onClick={clearFilters} className="btn-primary mt-4">Limpiar filtros</button>}
        </div>
      )}
    </section>
  )
}
