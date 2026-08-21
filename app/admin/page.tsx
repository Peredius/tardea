'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'

function generateSlug(title: string, date: string) {
  const cleanTitle = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return date ? `${cleanTitle}-${date}` : cleanTitle
}

const MUSIC_OPTIONS = ['Comercial', 'Electronica', 'Reguetón', 'Pop', 'Indie', 'Flamenquito', 'Remember']
const AUDIENCE_OPTIONS = ['18-25', '25-35', '30+', 'Mixto']
const EVENT_TYPE_OPTIONS = ['Tardeo', 'Rooftop', 'Brunch', 'Afterwork', 'Fitness Party', 'Fiesta']
const AREA_OPTIONS = ['Madrid', 'Centro', 'Salamanca', 'Retiro', 'Chamberi', 'Malasana', 'La Latina', 'Chamartin', 'Tetuan', 'Alcorcon']
const PRICE_OPTIONS = Array.from({ length: 31 }, (_, index) => index.toString())

type BulkEventRow = {
  id: string
  active: boolean
  title: string
  type: string
  music: string
  audience: string
  venue: string
  area: string
  date: string
  startTime: string
  endTime: string
  priceFrom: string
  ticketUrl: string
  mapsUrl: string
  description: string
}

type ResearchRow = {
  id?: string
  selected?: boolean
  source_url: string
  title: string
  type: string
  music: string
  audience: string
  venue: string
  area: string
  date: string
  start_time: string
  end_time: string
  price_from: string
  maps_url: string
  status: string
  notes: string
}

function createBulkRow(values: Partial<BulkEventRow> = {}): BulkEventRow {
  const { id: _id, ...rowValues } = values

  return {
    id: Date.now().toString() + '-' + Math.random().toString(16).slice(2),
    active: true,
    title: '',
    type: 'Tardeo',
    music: 'Comercial',
    audience: 'Mixto',
    venue: '',
    area: 'Madrid',
    date: '',
    startTime: '18:00',
    endTime: '23:00',
    priceFrom: '0',
    ticketUrl: '',
    mapsUrl: '',
    description: '',
    ...rowValues,
  }
}

function createResearchRow(values: Partial<ResearchRow> = {}): ResearchRow {
  return {
    selected: false,
    source_url: '',
    title: '',
    type: 'Tardeo',
    music: 'Comercial',
    audience: 'Mixto',
    venue: '',
    area: 'Madrid',
    date: '',
    start_time: '18:00',
    end_time: '23:00',
    price_from: '0',
    maps_url: '',
    status: 'nuevo',
    notes: '',
    ...values,
  }
}

function scoutCoverFor(type: string, music: string) {
  if (music === 'Electronica') return '/scout-covers/electronica.svg'
  if (music === 'Flamenquito') return '/scout-covers/flamenquito.svg'
  if (type === 'Brunch') return '/scout-covers/brunch.svg'
  if (type === 'Rooftop') return '/scout-covers/rooftop.svg'
  return '/scout-covers/tardeo.svg'
}

function formatInputDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

function compactOptions(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)))
}

function compactValue(value: string, fallback: string) {
  return (value || fallback).trim() || fallback
}

function compactOptionsWithCurrent(options: string[], currentValue: string, fallback: string) {
  return compactOptions([compactValue(currentValue, fallback), ...options])
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + days)
  return nextDate
}

function normalizeEventSeriesText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\b\d{1,2}\s*(?:de\s*)?(?:ene|enero|feb|febrero|mar|marzo|abr|abril|may|mayo|jun|junio|jul|julio|ago|agosto|sep|septiembre|oct|octubre|nov|noviembre|dic|diciembre)\b/gi, ' ')
    .replace(/\b\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?\b/g, ' ')
    .replace(/\b20\d{2}\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function getEventSeriesSlug(event: any) {
  const title = normalizeEventSeriesText(event.title || 'evento')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '')
  const venue = normalizeEventSeriesText(event.venue || '')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '')
  return [event.type || 'Tardeo', title || 'evento', venue].filter(Boolean).join('__').toLowerCase()
}

function getPromoterEventProfileSlug(event: any) {
  return getEventSeriesSlug(event).replace(/__/g, '-').replace(/^-+|-+$/g, '') || 'evento'
}

function getResearchSeriesKey(row: Partial<ResearchRow>) {
  const venueWords = normalizeEventSeriesText(row.venue || '')
    .split(' ')
    .filter(Boolean)
  const fillerWords = new Set([
    'entrada',
    'entradas',
    'lista',
    'listas',
    'vip',
    'vips',
    'ticket',
    'tickets',
    'compra',
    'para',
    'por',
    'desde',
    'evento',
    'eventos',
    'madrid',
    'tardeo',
    'club',
    'rooftop',
    'brunch',
    'afterwork',
    'fiesta',
    'fiestas',
    ...venueWords,
  ])
  const words = normalizeEventSeriesText(row.title || 'evento')
    .split(' ')
    .filter((word) => word.length > 2 && !fillerWords.has(word))

  return [
    row.type || 'Tardeo',
    words.slice(0, 3).join(' ') || normalizeEventSeriesText(row.title || row.venue || 'evento'),
  ].join('__').toLowerCase()
}

type AdminTab = 'events' | 'research' | 'create' | 'profiles'

function getAdminTabFromPath(pathname: string): AdminTab {
  if (pathname.endsWith('/admin/listado')) return 'research'
  if (pathname.endsWith('/admin/crear-evento')) return 'create'
  if (pathname.endsWith('/admin/fichas')) return 'profiles'
  return 'events'
}

function getAdminTabHref(tab: AdminTab) {
  if (tab === 'research') return '/admin/listado'
  if (tab === 'create') return '/admin/crear-evento'
  if (tab === 'profiles') return '/admin/fichas'
  return '/admin/eventos'
}

function CompactDropdown({
  value,
  fallback,
  options,
  openKey,
  activeOpenKey,
  onOpenChange,
  onChange,
}: {
  value: string
  fallback: string
  options: string[]
  openKey: string
  activeOpenKey: string
  onOpenChange: (key: string) => void
  onChange: (value: string) => void
}) {
  const currentValue = compactValue(value, fallback)
  const mergedOptions = compactOptionsWithCurrent(options, value, fallback)
  const isOpen = activeOpenKey === openKey

  return (
    <div className="relative min-w-0">
      <button
        type="button"
        onClick={() => onOpenChange(isOpen ? '' : openKey)}
        className="flex h-8 w-full min-w-0 items-center justify-between gap-1 rounded-full border border-white/10 bg-slate-950/80 px-2 text-left text-[9px] font-semibold leading-none text-white hover:border-brand-500/50"
        title={currentValue}
      >
        <span className="truncate">{currentValue}</span>
        <span className="shrink-0 text-[10px] text-slate-300">v</span>
      </button>
      {isOpen && (
        <div className="absolute left-0 top-9 z-50 max-h-40 min-w-full overflow-auto rounded-xl border border-white/10 bg-slate-950 p-1 shadow-2xl shadow-black/50">
          {mergedOptions.map((option) => {
            const selected = option === currentValue

            return (
              <button
                key={option}
                type="button"
                onClick={() => {
                  onChange(option)
                  onOpenChange('')
                }}
                className={`block w-full rounded-lg px-2 py-1.5 text-left text-[10px] font-semibold ${
                  selected ? 'bg-brand-500 text-white' : 'text-slate-200 hover:bg-white/10'
                }`}
                title={option}
              >
                <span className="block truncate">{option}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function AdminPage() {
  const pathname = usePathname()
  const formRef = useRef<HTMLFormElement | null>(null)
  const bulkSectionRef = useRef<HTMLElement | null>(null)
  const [adminTab, setAdminTab] = useState<AdminTab>(getAdminTabFromPath(pathname))
  const [title, setTitle] = useState('')
  const [venue, setVenue] = useState('')
  const [area, setArea] = useState('')
  const [customArea, setCustomArea] = useState('')
  const [date, setDate] = useState('')
  const [type, setType] = useState('')
  const [address, setAddress] = useState('')
  const [mapsUrl, setMapsUrl] = useState('')
  const [ticketUrl, setTicketUrl] = useState('')
  const [startTime, setStartTime] = useState('17:00')
  const [endTime, setEndTime] = useState('23:00')
  const [priceFrom, setPriceFrom] = useState('')
  const [music, setMusic] = useState<string[]>([])
  const [audience, setAudience] = useState('25-35')
  const [cover, setCover] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [reelUrl, setReelUrl] = useState('')
  const [message, setMessage] = useState('')
  const [description, setDescription] = useState('')
  const [perks, setPerks] = useState('')
  const [events, setEvents] = useState<any[]>([])
  const [eventListTab, setEventListTab] = useState<'created' | 'past'>('created')
  const [pendingEvents, setPendingEvents] = useState<any[]>([])
  const [eventClaims, setEventClaims] = useState<any[]>([])
  const [scoutEvents, setScoutEvents] = useState<any[]>([])
  const [scoutTypeFilter, setScoutTypeFilter] = useState('Todos')
  const [selectedScoutEventIds, setSelectedScoutEventIds] = useState<string[]>([])
  const [scoutSearchStartDate, setScoutSearchStartDate] = useState(formatInputDate(new Date()))
  const [scoutSearchEndDate, setScoutSearchEndDate] = useState(formatInputDate(addDays(new Date(), 6)))
  const [scoutSearchType, setScoutSearchType] = useState('Todos')
  const [scoutSearching, setScoutSearching] = useState(false)
  const [scoutDryRun, setScoutDryRun] = useState(false)
  const [scoutSearchReport, setScoutSearchReport] = useState<any | null>(null)
  const [scoutPingLoading, setScoutPingLoading] = useState(false)
  const [eventTypeFilter, setEventTypeFilter] = useState('Todos')
  const [eventSearchQuery, setEventSearchQuery] = useState('')
  const [editingEvent, setEditingEvent] = useState<any | null>(null)
  const [bulkRows, setBulkRows] = useState<BulkEventRow[]>([createBulkRow()])
  const [bulkDuplicateRowId, setBulkDuplicateRowId] = useState('')
  const [bulkDuplicateDate, setBulkDuplicateDate] = useState('')
  const [bulkDuplicateDates, setBulkDuplicateDates] = useState<string[]>([])
  const [bulkExtractingRowId, setBulkExtractingRowId] = useState('')
  const [researchRows, setResearchRows] = useState<ResearchRow[]>([])
  const [researchSearchQuery, setResearchSearchQuery] = useState('')
  const [researchTypeFilter, setResearchTypeFilter] = useState('Todos')
  const [researchStatusFilter, setResearchStatusFilter] = useState('Todos')
  const [researchSaving, setResearchSaving] = useState(false)
  const [researchExtractingKey, setResearchExtractingKey] = useState('')
  const [activeResearchDropdown, setActiveResearchDropdown] = useState('')
  const [profileSearchQuery, setProfileSearchQuery] = useState('')
  const [profileTypeFilter, setProfileTypeFilter] = useState('Todos')
  const [profileReviewFilter, setProfileReviewFilter] = useState<'review' | 'created' | 'all'>('review')

  useEffect(() => {
    setAdminTab(getAdminTabFromPath(pathname))
  }, [pathname])

  useEffect(() => {
    async function checkAdmin() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        window.location.href = '/login'
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!profile || profile.role !== 'admin') {
        window.location.href = '/dashboard'
        return
      }

      fetchEvents()
      fetchResearchRows()
    }

    checkAdmin()
  }, [])

  async function fetchResearchRows() {
    const { data, error } = await supabase
      .from('event_research_items')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
      return
    }

    setResearchRows(
      (data || []).map((row: any) => createResearchRow({
        id: row.id,
        source_url: row.source_url || '',
        title: row.title || '',
        type: row.type || 'Tardeo',
        music: Array.isArray(row.music) ? row.music.join(', ') : row.music || 'Comercial',
        audience: row.audience || 'Mixto',
        venue: row.venue || '',
        area: row.area || 'Madrid',
        date: row.date || '',
        start_time: row.start_time || '18:00',
        end_time: row.end_time || '23:00',
        price_from: row.price_from?.toString() || '0',
        maps_url: row.maps_url || '',
        status: row.status || 'nuevo',
        notes: row.notes || '',
      }))
    )
  }

  async function fetchEvents() {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'approved')
      .order('date', { ascending: true })

    const { data: pendingData, error: pendingError } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'pending')
      .or('needs_review.is.null,needs_review.eq.false')
      .order('date', { ascending: true })

    const { data: scoutData, error: scoutError } = await supabase
      .from('events')
      .select('*')
      .eq('imported_by_agent', true)
      .eq('needs_review', true)
      .order('date', { ascending: true })

    if (error || pendingError || scoutError) {
      console.error(error || pendingError || scoutError)
      return
    }

    setEvents(data || [])
    setPendingEvents(pendingData || [])
    setScoutEvents(scoutData || [])
    fetchEventClaims()
  }

  async function fetchEventClaims() {
    const { data, error } = await supabase
      .from('event_claims')
      .select('*, events(*)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })

    if (error) {
      console.error(error)
      return
    }

    setEventClaims(data || [])
  }

  async function approveEvent(eventId: string) {
    const { error } = await supabase
      .from('events')
      .update({ status: 'approved', published: true })
      .eq('id', eventId)

    if (error) {
      setMessage('Error al aprobar evento')
      console.error(error)
      return
    }

    setMessage('Evento aprobado correctamente')
    fetchEvents()
  }

  async function approveClaim(claim: any) {
    const claimedEvent = claim.events

    if (!claimedEvent) {
      setMessage('No se pudo leer el evento reclamado')
      return
    }

    const eventProfileSlug = getPromoterEventProfileSlug(claimedEvent)
    const musicList = Array.isArray(claimedEvent.music)
      ? claimedEvent.music
      : typeof claimedEvent.music === 'string'
        ? claimedEvent.music.split(',').map((item: string) => item.trim()).filter(Boolean)
        : ['Comercial']

    let eventProfileId = claimedEvent.event_profile_id || ''

    if (!eventProfileId) {
      const { data: existingProfile, error: existingProfileError } = await supabase
        .from('promoter_event_profiles')
        .select('id')
        .eq('user_id', claim.promoter_user_id)
        .eq('slug', eventProfileSlug)
        .maybeSingle()

      if (existingProfileError) {
        setMessage(`No se pudo comprobar la ficha del promotor: ${existingProfileError.message}`)
        return
      }

      eventProfileId = existingProfile?.id || ''
    }

    if (!eventProfileId) {
      const { data: newProfile, error: profileError } = await supabase
        .from('promoter_event_profiles')
        .insert({
          user_id: claim.promoter_user_id,
          name: claimedEvent.title || claim.company || 'Evento reclamado',
          slug: eventProfileSlug,
          logo_url: claimedEvent.cover || null,
          banner_url: claimedEvent.cover || null,
          description: claimedEvent.description || claim.message || null,
          type: claimedEvent.type || 'Tardeo',
          venue_name: claimedEvent.venue || null,
          area: claimedEvent.area || null,
          address: claimedEvent.address || null,
          maps_url: claimedEvent.maps_url || null,
          music: musicList.length ? musicList : ['Comercial'],
          audience: claimedEvent.audience || 'Mixto',
          price_from: claimedEvent.price_from || 0,
          website_url: claim.website || claimedEvent.source_url || null,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (profileError) {
        setMessage(`No se pudo crear la ficha del evento para el promotor: ${profileError.message}`)
        return
      }

      eventProfileId = newProfile.id
    }

    const { data: allEvents, error: allEventsError } = await supabase
      .from('events')
      .select('id, title, type, venue')

    if (allEventsError) {
      setMessage(`No se pudieron localizar las fechas relacionadas: ${allEventsError.message}`)
      return
    }

    const claimedSeriesSlug = getEventSeriesSlug(claimedEvent)
    const relatedEventIds = (allEvents || [])
      .filter((event) => getEventSeriesSlug(event) === claimedSeriesSlug)
      .map((event) => event.id)

    const { error: eventError } = await supabase
      .from('events')
      .update({
        user_id: claim.promoter_user_id,
        event_profile_id: eventProfileId,
        claimed_at: new Date().toISOString(),
      })
      .in('id', relatedEventIds.length ? relatedEventIds : [claim.event_id])

    if (eventError) {
      setMessage(`Error al asignar evento: ${eventError.message}`)
      return
    }

    const { error: claimError } = await supabase
      .from('event_claims')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', claim.id)

    if (claimError) {
      setMessage(`Evento asignado, pero no se pudo cerrar la solicitud: ${claimError.message}`)
      return
    }

    setMessage(`Reclamacion aprobada. Ficha creada/asignada y ${relatedEventIds.length || 1} fecha${(relatedEventIds.length || 1) === 1 ? '' : 's'} vinculada${(relatedEventIds.length || 1) === 1 ? '' : 's'} al promotor`)
    fetchEvents()
  }

  async function rejectClaim(claimId: string) {
    const { error } = await supabase
      .from('event_claims')
      .update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', claimId)

    if (error) {
      setMessage(`Error al rechazar solicitud: ${error.message}`)
      return
    }

    setMessage('Reclamacion rechazada')
    fetchEventClaims()
  }

  async function approveScoutEvent(eventId: string) {
    const { error } = await supabase
      .from('events')
      .update({
        status: 'approved',
        published: true,
        needs_review: false,
      })
      .eq('id', eventId)

    if (error) {
      setMessage(`Error al aprobar evento Scout: ${error.message}`)
      return
    }

    setMessage('Evento Scout aprobado y publicado')
    fetchEvents()
  }

  async function discardScoutEvent(eventId: string) {
    const confirmed = window.confirm('Quieres descartar este evento encontrado por Scout?')
    if (!confirmed) return

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId)

    if (error) {
      setMessage(`Error al descartar evento Scout: ${error.message}`)
      return
    }

    setMessage('Evento Scout descartado')
    fetchEvents()
  }

  async function searchScoutEvents() {
    if (!scoutSearchStartDate || !scoutSearchEndDate) {
      setMessage('Selecciona una semana para buscar eventos')
      return
    }

    setScoutSearching(true)
    setScoutSearchReport(null)
    setMessage('Buscando eventos en tiqueteras y redes publicas...')

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const debugUrl = `/api/scout/search?eventType=${encodeURIComponent(scoutSearchType)}&startDate=${encodeURIComponent(scoutSearchStartDate)}&endDate=${encodeURIComponent(scoutSearchEndDate)}`
      const debugResponse = await fetch(debugUrl, { cache: 'no-store' })
      const debugData = await debugResponse.json()

      const response = await fetch('/api/scout/search', {
        method: 'POST',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify({
          startDate: scoutSearchStartDate,
          endDate: scoutSearchEndDate,
          eventType: scoutSearchType,
          maxResults: 50,
          limitPerQuery: 10,
          maxQueries: 70,
          dryRun: scoutDryRun,
        }),
      })
      const data = await response.json()
      setScoutSearchReport({
        ...data,
        status: response.status,
        ok: response.ok,
        debug: debugData,
      })

      if (!response.ok) {
        setMessage(data.error || 'No se pudo buscar eventos')
        return
      }

      setMessage(data.message || `${data.imported || 0} eventos encontrados`)
      if (!scoutDryRun) fetchEvents()
    } catch (error) {
      setScoutSearchReport({
        error: error instanceof Error ? error.message : 'No se pudo buscar eventos',
        searchesRun: 0,
        resultsReceived: 0,
      })
      setMessage('No se pudo buscar eventos')
    } finally {
      setScoutSearching(false)
    }
  }

  async function pingScoutSearch() {
    setScoutPingLoading(true)
    setScoutSearchReport(null)
    setMessage('Probando conexion con Serper...')

    try {
      const response = await fetch('/api/scout/ping')
      const data = await response.json()
      setScoutSearchReport({
        ...data,
        searchesRun: 1,
        resultsReceived: data.results || 0,
        preview: 0,
        samples: data.examples?.map((item: any) => ({
          ...item,
          platform: 'Serper',
        })) || [],
        queriesRun: ['tardeo Madrid entradas'],
      })

      if (!response.ok) {
        setMessage(data.error || data.rawError || `Serper no responde correctamente. Estado ${data.status || response.status}`)
        return
      }

      setMessage(`Serper responde: ${data.results || 0} resultados en las pruebas`)
    } catch {
      setMessage('No se pudo probar Serper')
    } finally {
      setScoutPingLoading(false)
    }
  }

  function scoutEventToBulkRow(event: any) {
    return createBulkRow({
      title: event.title || '',
      type: event.type || 'Tardeo',
      music: Array.isArray(event.music) ? event.music.join(', ') : event.music || 'Comercial',
      audience: event.audience || 'Mixto',
      venue: event.venue || '',
      area: event.area || 'Madrid',
      date: event.date || '',
      startTime: event.start_time || '18:00',
      endTime: event.end_time || '23:00',
      priceFrom: event.price_from?.toString() || '0',
      ticketUrl: event.source_url || '',
      mapsUrl: event.maps_url || '',
      description: event.description || '',
    })
  }

  function scoutEventToResearchPayload(event: any) {
    const musicList = Array.isArray(event.music)
      ? event.music
      : typeof event.music === 'string'
        ? event.music.split(',').map((item: string) => item.trim()).filter(Boolean)
        : ['Comercial']

    return {
      source_url: event.source_url || null,
      title: event.title || null,
      type: event.type || 'Tardeo',
      music: musicList.length ? musicList : ['Comercial'],
      audience: event.audience || 'Mixto',
      venue: event.venue || null,
      area: event.area || 'Madrid',
      date: event.date || null,
      start_time: event.start_time || '18:00',
      end_time: event.end_time || '23:00',
      price_from: event.price_from ? Number(event.price_from) : 0,
      maps_url: event.maps_url || null,
      status: 'nuevo',
      notes: `Importado desde Scout. ${event.description || ''}`.trim(),
    }
  }

  function toggleScoutSelection(eventId: string) {
    setSelectedScoutEventIds((current) =>
      current.includes(eventId)
        ? current.filter((item) => item !== eventId)
        : [...current, eventId]
    )
  }

  function addScoutEventsToBulkRows(eventsToAdd: any[]) {
    if (eventsToAdd.length === 0) {
      setMessage('Selecciona al menos un evento encontrado')
      return
    }

    const rows = eventsToAdd.map(scoutEventToBulkRow)
    setBulkRows((current) => {
      const emptyInitialRow = current.length === 1 && !current[0].title && !current[0].ticketUrl
      return emptyInitialRow ? rows : [...current, ...rows]
    })
    setSelectedScoutEventIds([])
    setAdminTab('create')
    window.history.pushState(null, '', getAdminTabHref('create'))
    setMessage(`${rows.length} evento${rows.length === 1 ? '' : 's'} pasado${rows.length === 1 ? '' : 's'} a la tabla editorial para revisar y duplicar fechas.`)
    window.setTimeout(() => {
      bulkSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  function addSelectedScoutEventsToBulkRows() {
    addScoutEventsToBulkRows(scoutEvents.filter((event) => selectedScoutEventIds.includes(event.id)))
  }

  async function addScoutEventsToResearchList(eventsToAdd: any[]) {
    if (eventsToAdd.length === 0) {
      setMessage('Selecciona al menos un evento encontrado')
      return
    }

    const uniqueEvents = Array.from(
      new Map(eventsToAdd.map((event) => [getResearchSeriesKey(event), event])).values()
    )
    const rowsToInsert = uniqueEvents.map(scoutEventToResearchPayload)
    const { error } = await supabase
      .from('event_research_items')
      .upsert(rowsToInsert, { onConflict: 'source_url' })

    if (error) {
      setMessage(`Error pasando eventos al listado: ${error.message}`)
      return
    }

    setSelectedScoutEventIds([])
    setMessage(`${rowsToInsert.length} evento${rowsToInsert.length === 1 ? '' : 's'} guardado${rowsToInsert.length === 1 ? '' : 's'} en Listado de eventos. ${eventsToAdd.length - uniqueEvents.length} duplicado${eventsToAdd.length - uniqueEvents.length === 1 ? '' : 's'} evitado${eventsToAdd.length - uniqueEvents.length === 1 ? '' : 's'}.`)
    fetchResearchRows()
    setAdminTab('research')
    window.history.pushState(null, '', getAdminTabHref('research'))
  }

  function addSelectedScoutEventsToResearchList() {
    addScoutEventsToResearchList(scoutEvents.filter((event) => selectedScoutEventIds.includes(event.id)))
  }

  function updateResearchRow(index: number, field: keyof ResearchRow, value: string | boolean) {
    setResearchRows((rows) =>
      rows.map((row, rowIndex) => rowIndex === index ? { ...row, [field]: value } : row)
    )
  }

  function addResearchRow(values: Partial<ResearchRow> = {}) {
    setResearchRows((rows) => [createResearchRow(values), ...rows])
  }

  function researchRowToBulkRow(row: ResearchRow) {
    return createBulkRow({
      title: row.title,
      type: row.type || 'Tardeo',
      music: row.music || 'Comercial',
      audience: row.audience || 'Mixto',
      venue: row.venue,
      area: row.area || 'Madrid',
      date: row.date,
      startTime: row.start_time || '18:00',
      endTime: row.end_time || '23:00',
      priceFrom: row.price_from || '0',
      ticketUrl: row.source_url,
      mapsUrl: row.maps_url,
      description: row.notes,
    })
  }

  function researchRowToEventPayload(row: ResearchRow) {
    const musicList = (row.music || 'Comercial')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)

    return {
      title: row.title,
      slug: generateSlug(row.title, row.date),
      venue: row.venue || 'Pendiente de revisar',
      area: row.area || 'Madrid',
      address: row.venue || row.area || 'Madrid',
      maps_url: row.maps_url || null,
      date: row.date,
      start_time: row.start_time || '18:00',
      end_time: row.end_time || '23:00',
      type: row.type || 'Tardeo',
      music: musicList.length ? musicList : ['Comercial'],
      audience: row.audience || 'Mixto',
      price_from: row.price_from ? Number(row.price_from) : 0,
      cover: scoutCoverFor(row.type || 'Tardeo', musicList[0] || row.music || 'Comercial'),
      reel_url: null,
      featured: false,
      description: row.notes || 'Evento cargado desde el listado editorial de TARDEA. Pendiente de revision antes de publicar.',
      perks: [row.type, row.area, ...(musicList.length ? musicList : [row.music])].filter(Boolean),
      status: 'pending',
      published: false,
      source_name: 'Listado editorial',
      source_url: row.source_url || null,
      external_id: row.source_url || `${row.title}-${row.date}`,
      imported_by_agent: true,
      image_status: 'provisional',
      needs_review: true,
    }
  }

  function eventToResearchPayload(event: any) {
    const musicList = Array.isArray(event.music)
      ? event.music
      : typeof event.music === 'string'
        ? event.music.split(',').map((item: string) => item.trim()).filter(Boolean)
        : ['Comercial']

    return {
      source_url: event.source_url || (event.slug ? `https://tardea.com/eventos/${event.slug}` : null),
      title: event.title || null,
      type: event.type || 'Tardeo',
      music: musicList.length ? musicList : ['Comercial'],
      audience: event.audience || 'Mixto',
      venue: event.venue || null,
      area: event.area || 'Madrid',
      date: event.date || null,
      start_time: event.start_time || '18:00',
      end_time: event.end_time || '23:00',
      price_from: event.price_from ? Number(event.price_from) : 0,
      maps_url: event.maps_url || null,
      status: event.status === 'approved' ? 'listo' : 'revisando',
      notes: event.description || null,
    }
  }

  async function fillResearchListFromEvents() {
    const sourceEvents = [...events, ...pendingEvents, ...scoutEvents]
    const uniqueEvents = Array.from(
      new Map(sourceEvents.map((event) => [getResearchSeriesKey(event), event])).values()
    )

    if (uniqueEvents.length === 0) {
      setMessage('No hay eventos actuales para pasar al listado')
      return
    }

    const rowsToInsert = uniqueEvents.map(eventToResearchPayload)
    const { error } = await supabase
      .from('event_research_items')
      .upsert(rowsToInsert, { onConflict: 'source_url' })

    if (error) {
      setMessage(`Error rellenando listado: ${error.message}`)
      return
    }

    setMessage(`${rowsToInsert.length} eventos actuales guardados en Listado de eventos`)
    fetchResearchRows()
    setAdminTab('research')
  }

  async function saveResearchRow(row: ResearchRow) {
    if (!row.source_url && !row.title) {
      setMessage('Rellena al menos enlace o nombre del evento')
      return
    }

    setResearchSaving(true)
    const musicList = row.music
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
    const payload = {
      source_url: row.source_url || null,
      title: row.title || null,
      type: row.type || 'Tardeo',
      music: musicList,
      audience: row.audience || 'Mixto',
      venue: row.venue || null,
      area: row.area || 'Madrid',
      date: row.date || null,
      start_time: row.start_time || null,
      end_time: row.end_time || null,
      price_from: row.price_from ? Number(row.price_from) : 0,
      maps_url: row.maps_url || null,
      status: row.status || 'nuevo',
      notes: row.notes || null,
    }
    const query = row.id
      ? supabase.from('event_research_items').update(payload).eq('id', row.id)
      : supabase.from('event_research_items').insert(payload)
    const { error } = await query

    setResearchSaving(false)

    if (error) {
      setMessage(`Error guardando listado: ${error.message}`)
      return
    }

    setMessage('Fila guardada en listado de eventos')
    fetchResearchRows()
  }

  async function archiveResearchRow(row: ResearchRow, index: number) {
    if (!row.source_url && !row.title) {
      setMessage('Rellena al menos enlace o nombre del evento para archivarlo')
      return
    }

    const musicList = row.music
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
    const payload = {
      source_url: row.source_url || null,
      title: row.title || null,
      type: row.type || 'Tardeo',
      music: musicList,
      audience: row.audience || 'Mixto',
      venue: row.venue || null,
      area: row.area || 'Madrid',
      date: row.date || null,
      start_time: row.start_time || null,
      end_time: row.end_time || null,
      price_from: row.price_from ? Number(row.price_from) : 0,
      maps_url: row.maps_url || null,
      status: 'archivado',
      notes: row.notes || 'Archivado: evento real pendiente de nuevas fechas publicadas',
    }

    const query = row.id
      ? supabase.from('event_research_items').update(payload).eq('id', row.id)
      : supabase.from('event_research_items').insert(payload)
    const { error } = await query

    if (error) {
      setMessage(`No se pudo archivar: ${error.message}`)
      return
    }

    setResearchRows((rows) =>
      rows.map((item, rowIndex) =>
        rowIndex === index
          ? {
              ...item,
              status: 'archivado',
              notes: item.notes || 'Archivado: evento real pendiente de nuevas fechas publicadas',
            }
          : item
      )
    )
    setMessage('Evento archivado para revisarlo mas adelante')
    fetchResearchRows()
  }

  async function deleteResearchRow(row: ResearchRow, index: number) {
    if (!row.id) {
      setResearchRows((rows) => rows.filter((_, rowIndex) => rowIndex !== index))
      return
    }

    const { error } = await supabase.from('event_research_items').delete().eq('id', row.id)
    if (error) {
      setMessage(`Error eliminando fila: ${error.message}`)
      return
    }

    setMessage('Fila eliminada del listado')
    fetchResearchRows()
  }

  async function deleteEventProfile(profile: any) {
    const confirmed = window.confirm(`Eliminar la ficha "${profile.title}" y todos sus datos asociados?`)
    if (!confirmed) return

    const eventIds = [...events, ...pendingEvents, ...scoutEvents]
      .filter((event) => getResearchSeriesKey(event) === profile.key)
      .map((event) => event.id)
      .filter(Boolean)
    const researchIds = researchRows
      .filter((row) => row.id && getResearchSeriesKey(row) === profile.key)
      .map((row) => row.id)

    if (eventIds.length > 0) {
      const { error } = await supabase.from('events').delete().in('id', eventIds)
      if (error) {
        setMessage(`No se pudo eliminar la ficha: ${error.message}`)
        return
      }
    }

    if (researchIds.length > 0) {
      const { error } = await supabase.from('event_research_items').delete().in('id', researchIds)
      if (error) {
        setMessage(`No se pudo eliminar el listado de la ficha: ${error.message}`)
        return
      }
    }

    setMessage(`Ficha "${profile.title}" eliminada`)
    fetchEvents()
    fetchResearchRows()
  }

  async function extractResearchRow(index: number) {
    const row = researchRows[index]

    if (!row?.source_url) {
      setMessage('Pega primero un enlace')
      return
    }

    setResearchExtractingKey(row.id || index.toString())

    try {
      const response = await fetch('/api/scout/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: row.source_url }),
      })
      const data = await response.json()

      if (!response.ok) {
        setMessage(data.error || 'No se pudo leer el enlace')
        return
      }

      const extractedEvents = Array.isArray(data.events) && data.events.length > 0
        ? data.events
        : [data]

      setResearchRows((rows) => {
        const nextRows = [...rows]
        const currentRow = nextRows[index]
        const existingKeys = new Set(
          nextRows.map((item, rowIndex) => {
            if (rowIndex === index) return ''
            return item.source_url || `${item.title}__${item.date}`.toLowerCase()
          })
        )
        const rowsFromSource = extractedEvents
          .map((event: any, eventIndex: number) => {
            const nextRow = createResearchRow({
              ...currentRow,
              selected: true,
              source_url: event.sourceUrl || event.source_url || (event.date ? `${currentRow.source_url}#${event.date}` : currentRow.source_url),
              title: event.title || currentRow.title,
              type: event.type || currentRow.type,
              music: event.music || currentRow.music,
              venue: event.venue || currentRow.venue,
              area: event.area || currentRow.area,
              date: event.date || currentRow.date,
              start_time: event.startTime || currentRow.start_time,
              end_time: event.endTime || currentRow.end_time,
              price_from: event.priceFrom || currentRow.price_from,
              maps_url: event.mapsUrl || currentRow.maps_url,
              status: currentRow.status === 'nuevo' ? 'revisando' : currentRow.status,
              notes: event.description || currentRow.notes,
            })

            if (eventIndex === 0 && currentRow.id) nextRow.id = currentRow.id
            return nextRow
          })
          .filter((item: ResearchRow, eventIndex: number) => {
            if (eventIndex === 0) return true
            const key = item.source_url || `${item.title}__${item.date}`.toLowerCase()
            if (existingKeys.has(key)) return false
            existingKeys.add(key)
            return true
          })

        nextRows.splice(index, 1, ...rowsFromSource)
        return nextRows
      })

      setMessage(
        extractedEvents.length > 1
          ? `${extractedEvents.length} fechas leidas de ${data.sourceName || 'la fuente'}. Revisa y guarda o crea seleccionados en revision.`
          : `Informacion leida de ${data.sourceName || 'la fuente'}. Revisa antes de guardar.`
      )
    } catch {
      setMessage('No se pudo leer el enlace')
    } finally {
      setResearchExtractingKey('')
    }
  }

  async function createSelectedResearchEvents() {
    const selectedRows = researchRows.filter((row) => row.selected)

    if (selectedRows.length === 0) {
      setMessage('Selecciona filas del listado para crear eventos en revision')
      return
    }

    const rowsWithoutDate = selectedRows.filter((row) => !row.date)
    if (rowsWithoutDate.length > 0) {
      setMessage(`${rowsWithoutDate.length} evento${rowsWithoutDate.length === 1 ? '' : 's'} seleccionado${rowsWithoutDate.length === 1 ? '' : 's'} no tiene${rowsWithoutDate.length === 1 ? '' : 'n'} fecha. Completa la fecha antes de crearlo en revision.`)
      return
    }

    const rowsWithoutTitle = selectedRows.filter((row) => !row.title)
    if (rowsWithoutTitle.length > 0) {
      setMessage(`${rowsWithoutTitle.length} fila${rowsWithoutTitle.length === 1 ? '' : 's'} seleccionada${rowsWithoutTitle.length === 1 ? '' : 's'} no tiene${rowsWithoutTitle.length === 1 ? '' : 'n'} nombre de evento.`)
      return
    }

    const rowsToInsert = selectedRows.map(researchRowToEventPayload)
    const { error } = await supabase.from('events').upsert(rowsToInsert, { onConflict: 'slug' })

    if (error) {
      setMessage(`Error al crear eventos desde listado: ${error.message}`)
      return
    }

    const selectedIds = selectedRows.map((row) => row.id).filter(Boolean)
    if (selectedIds.length > 0) {
      await supabase.from('event_research_items').update({ status: 'pasado' }).in('id', selectedIds)
    }

    setResearchRows((current) => current.map((row) => row.selected ? { ...row, selected: false, status: 'pasado' } : row))
    setMessage(`${rowsToInsert.length} evento${rowsToInsert.length === 1 ? '' : 's'} creado${rowsToInsert.length === 1 ? '' : 's'} en revision desde el listado`)
    fetchEvents()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    let imageUrl = editingEvent?.cover || ''

    if (cover) {
      const fileName = `${Date.now()}-${cover.name}`

      const { error: uploadError } = await supabase.storage
        .from('events')
        .upload(fileName, cover)

      if (uploadError) {
        setMessage(`Error subiendo imagen: ${uploadError.message}`)
        return
      }

      const { data } = supabase.storage.from('events').getPublicUrl(fileName)
      imageUrl = data.publicUrl
    }

    const eventData = {
      title,
      slug: generateSlug(title, date),
      venue,
      area: area === 'Otra' ? customArea : area,
      address,
      maps_url: mapsUrl || null,
      source_url: ticketUrl || null,
      date,
      start_time: startTime,
      end_time: endTime,
      type,
      music,
      audience,
      price_from: priceFrom ? Number(priceFrom) : 0,
      cover: imageUrl,
      reel_url: reelUrl || null,
      featured: false,
      description,
      perks: perks ? perks.split(',').map((p) => p.trim()) : [],
      status: editingEvent?.status || 'approved',
      published: editingEvent ? Boolean(editingEvent.published) : true,
    }

    let error

    if (editingEvent) {
      const { error: updateError } = await supabase
        .from('events')
        .update(eventData)
        .eq('id', editingEvent.id)

      error = updateError
    } else {
      const { error: insertError } = await supabase.from('events').insert(eventData)
      error = insertError
    }

    if (error) {
      setMessage('Error al guardar evento')
      console.error(error)
      return
    }

    setMessage(
      editingEvent
        ? 'Evento actualizado correctamente'
        : 'Evento creado correctamente'
    )

    setEditingEvent(null)
    fetchEvents()

    setTitle('')
    setVenue('')
    setArea('')
    setCustomArea('')
    setDate('')
    setType('')
    setAddress('')
    setMapsUrl('')
    setTicketUrl('')
    setStartTime('17:00')
    setEndTime('23:00')
    setPriceFrom('')
    setMusic([])
    setAudience('25-35')
    setCover(null)
    setPreviewUrl('')
    setReelUrl('')
    setDescription('')
    setPerks('')
  }

  function loadEventForEdit(event: any) {
    const cleanCover = event.cover?.startsWith('blob:') ? '' : event.cover

    setEditingEvent({ ...event, cover: cleanCover })
    setTitle(event.title || '')
    setVenue(event.venue || '')
    setAddress(event.address || '')
    setMapsUrl(event.maps_url || '')
    setTicketUrl(event.source_url || '')
    setArea(event.area || '')
    setDate(event.date || '')
    setStartTime(event.start_time || '17:00')
    setEndTime(event.end_time || '23:00')
    setType(event.type || '')
    setMusic(event.music || [])
    setAudience(event.audience || '25-35')
    setPriceFrom(event.price_from?.toString() || '')
    setPreviewUrl(cleanCover || '')
    setCover(null)
    setReelUrl(event.reel_url || '')
    setDescription(event.description || '')
    setPerks(event.perks?.join(' - ') || '')
    setAdminTab('create')
    window.history.pushState(null, '', getAdminTabHref('create'))
    window.setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  function toggleMusicStyle(style: string) {
    setMusic((current) =>
      current.includes(style)
        ? current.filter((item) => item !== style)
        : [...current, style]
    )
  }
  function updateBulkRow(rowId: string, field: keyof BulkEventRow, value: string | boolean) {
    setBulkRows((rows) =>
      rows.map((row) => row.id === rowId ? { ...row, [field]: value } : row)
    )
  }

  function addBulkRow() {
    setBulkRows((rows) => [...rows, createBulkRow()])
  }

  function removeBulkRow(rowId: string) {
    setBulkRows((rows) => rows.length === 1 ? [createBulkRow()] : rows.filter((row) => row.id !== rowId))
  }

  function pasteBulkRows(text: string) {
    const rows = text
      .trim()
      .split(/\r?\n/)
      .map((line) => line.split('\t'))
      .filter((cells) => cells.some(Boolean))
      .map((cells) => createBulkRow({
        title: cells[0] || '',
        type: cells[1] || 'Tardeo',
        music: cells[2] || 'Comercial',
        audience: cells[3] || 'Mixto',
        venue: cells[4] || '',
        area: cells[5] || 'Madrid',
        date: cells[6] || '',
        startTime: cells[7] || '18:00',
        endTime: cells[8] || '23:00',
        priceFrom: cells[9] || '0',
        ticketUrl: cells[10] || '',
        mapsUrl: cells[11] || '',
        description: cells[12] || '',
      }))

    if (rows.length) setBulkRows(rows)
  }

  function addDuplicateDate() {
    if (!bulkDuplicateDate || bulkDuplicateDates.includes(bulkDuplicateDate)) return
    setBulkDuplicateDates((dates) => [...dates, bulkDuplicateDate].sort())
    setBulkDuplicateDate('')
  }

  function duplicateBulkRowOnDates() {
    const source = bulkRows.find((row) => row.id === bulkDuplicateRowId) || bulkRows[0]
    if (!source || bulkDuplicateDates.length === 0) return

    const duplicates = bulkDuplicateDates.map((dateValue) => createBulkRow({ ...source, date: dateValue }))
    setBulkRows((rows) => [...rows, ...duplicates])
    setBulkDuplicateDates([])
  }

  async function extractBulkRowFromUrl(rowId: string) {
    const row = bulkRows.find((item) => item.id === rowId)

    if (!row?.ticketUrl) {
      setMessage('Pega primero un enlace en la fila')
      return
    }

    setBulkExtractingRowId(rowId)

    try {
      const response = await fetch('/api/scout/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: row.ticketUrl }),
      })
      const data = await response.json()

      if (!response.ok) {
        setMessage(data.error || 'No se pudo extraer informacion del enlace')
        return
      }

      setBulkRows((rows) =>
        rows.map((item) =>
          item.id === rowId
            ? {
                ...item,
                title: data.title || item.title,
                description: data.description || item.description,
                date: data.date || item.date,
                startTime: data.startTime || item.startTime,
                endTime: data.endTime || item.endTime,
                type: data.type || item.type,
                music: data.music || item.music,
                venue: data.venue || item.venue,
                area: data.area || item.area,
                priceFrom: data.priceFrom || item.priceFrom,
                mapsUrl: data.mapsUrl || item.mapsUrl,
              }
            : item
        )
      )

      setMessage(
        data.confidence === 'low'
          ? `He leido ${data.sourceName || 'la fuente'}, pero esa pagina da pocos datos. Revisa y completa la fila antes de crear el evento.`
          : `Informacion extraida de ${data.sourceName || 'la fuente'}. Revisala antes de crear el evento.`
      )
    } catch {
      setMessage('No se pudo extraer informacion del enlace')
    } finally {
      setBulkExtractingRowId('')
    }
  }

  async function createBulkEvents() {
    const validRows = bulkRows.filter((row) => row.active && row.title && row.date)

    if (validRows.length === 0) {
      setMessage('No hay filas activas con evento y fecha')
      return
    }

    const rowsToInsert = validRows.map((row) => {
      const musicList = row.music
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)

      return {
        title: row.title,
        slug: generateSlug(row.title, row.date),
        venue: row.venue || 'Pendiente de revisar',
        area: row.area || 'Madrid',
        address: row.venue || row.area || 'Madrid',
        maps_url: row.mapsUrl || null,
        date: row.date,
        start_time: row.startTime || '18:00',
        end_time: row.endTime || '23:00',
        type: row.type || 'Tardeo',
        music: musicList.length ? musicList : ['Comercial'],
        audience: row.audience || 'Mixto',
        price_from: row.priceFrom ? Number(row.priceFrom) : 0,
        cover: scoutCoverFor(row.type, musicList[0] || row.music),
        reel_url: null,
        featured: false,
        description: row.description || 'Evento cargado desde la tabla editorial de TARDEA. Pendiente de revision antes de publicar.',
        perks: [row.type, row.area, ...(musicList.length ? musicList : [row.music])].filter(Boolean),
        status: 'pending',
        published: false,
        source_name: 'Carga admin',
        source_url: row.ticketUrl || null,
        external_id: row.ticketUrl || row.title + '-' + row.date,
        imported_by_agent: true,
        image_status: 'provisional',
        needs_review: true,
      }
    })

    const { error } = await supabase.from('events').upsert(rowsToInsert, { onConflict: 'slug' })

    if (error) {
      setMessage(`Error al crear eventos desde tabla: ${error.message}`)
      return
    }

    setMessage(`${rowsToInsert.length} eventos enviados a revision`)
    setBulkRows([createBulkRow()])
    fetchEvents()
  }

  const todayDate = new Date().toISOString().split('T')[0]
  const createdEvents = events.filter((event) => !event.date || event.date >= todayDate)
  const pastEvents = events
    .filter((event) => event.date && event.date < todayDate)
    .slice()
    .reverse()
  const scoutTypes = ['Todos', ...Array.from(new Set(scoutEvents.map((event) => event.type || 'Tardeo')))]
  const eventTypes = ['Todos', ...Array.from(new Set(events.map((event) => event.type || 'Tardeo')))]
  const researchTypes = ['Todos', ...compactOptions([...EVENT_TYPE_OPTIONS, ...researchRows.map((row) => row.type || 'Tardeo')])]
  const researchTypeOptions = researchTypes.filter((option) => option !== 'Todos')
  const researchMusicOptions = compactOptions([
    ...MUSIC_OPTIONS,
    ...researchRows.flatMap((row) => (row.music || '').split(',').map((option) => option.trim())),
    ...researchRows.map((row) => row.music || ''),
  ])
  const researchAudienceOptions = compactOptions(['Mixto', ...AUDIENCE_OPTIONS, ...researchRows.map((row) => row.audience || '')])
  const researchAreaOptions = compactOptions([...AREA_OPTIONS, ...researchRows.map((row) => row.area || '')])
  const researchPriceOptions = compactOptions([...PRICE_OPTIONS, ...researchRows.map((row) => row.price_from || '')])
  const researchStatuses = ['Todos', 'nuevo', 'revisando', 'listo', 'archivado', 'pasado', 'descartado']
  const researchStatusOptions = researchStatuses.filter((option) => option !== 'Todos')
  const normalizedResearchSearch = researchSearchQuery.trim().toLowerCase()
  const filteredResearchRows = researchRows.filter((row) => {
    const typeMatches = researchTypeFilter === 'Todos' || compactValue(row.type, 'Tardeo') === researchTypeFilter
    const statusMatches = researchStatusFilter === 'Todos' || compactValue(row.status, 'nuevo') === researchStatusFilter
    const searchMatches = !normalizedResearchSearch || [
      row.title,
      row.venue,
      row.area,
      row.music,
      row.audience,
      row.source_url,
      row.notes,
      row.status,
      row.type,
    ].some((value) => (value || '').toLowerCase().includes(normalizedResearchSearch))
    return typeMatches && statusMatches && searchMatches
  })
  const visibleResearchRows = Array.from(
    new Map(filteredResearchRows.map((row) => [getResearchSeriesKey(row), row])).values()
  )
  const profileSourceRank: Record<string, number> = {
    Publicado: 0,
    Pendiente: 1,
    Listado: 2,
    Scout: 3,
  }
  const profileSources = [
    ...events.map((event) => ({ ...event, source_kind: 'Publicado' })),
    ...pendingEvents.map((event) => ({ ...event, source_kind: 'Pendiente' })),
    ...scoutEvents.map((event) => ({ ...event, source_kind: 'Scout' })),
    ...researchRows.map((row) => ({ ...row, source_kind: 'Listado' })),
  ]
    .filter((item) => item.title || item.venue)
    .sort((a, b) => {
      const aFuture = !a.date || a.date >= todayDate
      const bFuture = !b.date || b.date >= todayDate
      if (aFuture !== bFuture) return aFuture ? -1 : 1
      const sourceDiff = (profileSourceRank[a.source_kind] ?? 9) - (profileSourceRank[b.source_kind] ?? 9)
      if (sourceDiff !== 0) return sourceDiff
      return (a.date || '').localeCompare(b.date || '')
    })
  const profileMap = new Map<string, any>()
  profileSources.forEach((item) => {
    const key = getResearchSeriesKey(item)
    const current = profileMap.get(key)
    const summary = current || {
      key,
      title: item.title || item.venue || 'Evento sin nombre',
      type: item.type || 'Tardeo',
      venue: item.venue || '',
      area: item.area || 'Madrid',
      slug: getEventSeriesSlug({ title: item.title || item.venue || 'evento', type: item.type || 'Tardeo', venue: item.venue || '' }),
      sourceKinds: new Set<string>(),
      sourceUrl: item.source_url || '',
      count: 0,
      profileReviewed: Boolean(item.profile_reviewed),
    }

    if (!current || (current.sourceKinds.has('Listado') && item.source_kind !== 'Listado')) {
      summary.title = item.title || summary.title
      summary.type = item.type || summary.type
      summary.venue = item.venue || summary.venue
      summary.area = item.area || summary.area
      summary.slug = getEventSeriesSlug({ title: summary.title, type: summary.type, venue: summary.venue })
      summary.profileReviewed = Boolean(item.profile_reviewed)
    }

    if (!summary.sourceUrl && item.source_url) {
      summary.sourceUrl = item.source_url
    }
    summary.sourceKinds.add(item.source_kind)
    summary.count += 1
    profileMap.set(key, summary)
  })
  const profileTypes = ['Todos', ...compactOptions([...EVENT_TYPE_OPTIONS, ...Array.from(profileMap.values()).map((profile) => profile.type || 'Tardeo')])]
  const normalizedProfileSearch = profileSearchQuery.trim().toLowerCase()
  const visibleProfiles = Array.from(profileMap.values())
    .filter((profile) => {
      const typeMatches = profileTypeFilter === 'Todos' || profile.type === profileTypeFilter
      const isReviewed = Boolean(profile.profileReviewed)
      const reviewMatches =
        profileReviewFilter === 'all'
        || (profileReviewFilter === 'created' && isReviewed)
        || (profileReviewFilter === 'review' && !isReviewed)
      const searchMatches = !normalizedProfileSearch || [
        profile.title,
        profile.venue,
        profile.type,
        profile.sourceUrl,
        Array.from(profile.sourceKinds).join(' '),
      ].some((value) => (value || '').toLowerCase().includes(normalizedProfileSearch))
      return typeMatches && reviewMatches && searchMatches
    })
    .sort((a, b) => a.title.localeCompare(b.title, 'es', { sensitivity: 'base' }))
  const filteredScoutEvents = scoutTypeFilter === 'Todos'
    ? scoutEvents
    : scoutEvents.filter((event) => (event.type || 'Tardeo') === scoutTypeFilter)
  const filteredVisibleEvents = eventTypeFilter === 'Todos'
    ? (eventListTab === 'past' ? pastEvents : createdEvents)
    : (eventListTab === 'past' ? pastEvents : createdEvents).filter((event) => (event.type || 'Tardeo') === eventTypeFilter)
  const normalizedEventSearch = eventSearchQuery.trim().toLowerCase()
  const searchedVisibleEvents = filteredVisibleEvents.filter((event) => {
    if (!normalizedEventSearch) return true
    return [
      event.title,
      event.venue,
      event.address,
      event.area,
      event.type,
      event.audience,
      Array.isArray(event.music) ? event.music.join(' ') : event.music,
    ].some((value) => (value || '').toLowerCase().includes(normalizedEventSearch))
  })
  const eventGroupMap = new Map<string, any>()
  searchedVisibleEvents.forEach((event) => {
    const key = getResearchSeriesKey(event)
    const current = eventGroupMap.get(key)
    const summary = current || {
      key,
      title: event.title || 'Evento sin nombre',
      type: event.type || 'Tardeo',
      venue: event.venue || '',
      area: event.area || '',
      slug: getEventSeriesSlug(event),
      events: [],
      sourceUrl: event.source_url || '',
      mapsUrl: event.maps_url || '',
    }

    if (!summary.sourceUrl && event.source_url) summary.sourceUrl = event.source_url
    if (!summary.mapsUrl && event.maps_url) summary.mapsUrl = event.maps_url
    summary.events.push(event)
    eventGroupMap.set(key, summary)
  })
  const visibleEventGroups = Array.from(eventGroupMap.values())
    .map((group) => ({
      ...group,
      events: group.events.slice().sort((a: any, b: any) => (a.date || '').localeCompare(b.date || '')),
    }))
    .sort((a, b) => a.title.localeCompare(b.title, 'es', { sensitivity: 'base' }))

  return (
    <main className="container-page py-16">
      <section className="mb-10 flex items-start justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold">Panel admin TARDEA</h1>
          <p className="mt-3 text-slate-400">Crear y editar eventos</p>
        </div>

        <button
          onClick={async () => {
            await supabase.auth.signOut()
            window.location.href = '/login'
          }}
          className="shrink-0 text-sm text-slate-400 hover:text-white"
        >
          Cerrar sesion
        </button>
      </section>

      <div className="mb-8 flex flex-wrap gap-2 rounded-full border border-white/10 bg-slate-900/80 p-1">
        <Link
          href={getAdminTabHref('events')}
          className={`rounded-full px-4 py-2 text-sm font-bold transition ${adminTab === 'events' ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'}`}
        >
          Admin eventos
        </Link>
        <Link
          href={getAdminTabHref('research')}
          className={`rounded-full px-4 py-2 text-sm font-bold transition ${adminTab === 'research' ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'}`}
        >
          Listado de eventos
        </Link>
        <Link
          href={getAdminTabHref('create')}
          className={`rounded-full px-4 py-2 text-sm font-bold transition ${adminTab === 'create' ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'}`}
        >
          Crear evento
        </Link>
        <Link
          href={getAdminTabHref('profiles')}
          className={`rounded-full px-4 py-2 text-sm font-bold transition ${adminTab === 'profiles' ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'}`}
        >
          Fichas
        </Link>
      </div>

      {adminTab === 'profiles' && (
        <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-500">Fichas por evento</p>
              <h2 className="text-2xl font-bold">Indice de fichas</h2>
              <p className="mt-2 text-sm text-slate-400">Una entrada por evento o marca, ordenada para entrar rapido a sus fechas y datos.</p>
            </div>

            <label className="relative block w-full lg:max-w-sm">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                className="input h-11 rounded-full pl-11 pr-10 text-sm"
                placeholder="Buscar ficha..."
                value={profileSearchQuery}
                onChange={(event) => setProfileSearchQuery(event.target.value)}
              />
              {profileSearchQuery && (
                <button
                  type="button"
                  onClick={() => setProfileSearchQuery('')}
                  className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-slate-300 hover:bg-white/15 hover:text-white"
                  aria-label="Limpiar busqueda"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </label>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {[
              { id: 'review', label: 'Por revisar' },
              { id: 'created', label: 'Creadas' },
              { id: 'all', label: 'Todas' },
            ].map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setProfileReviewFilter(option.id as 'review' | 'created' | 'all')}
                className={`rounded-full px-4 py-2 text-sm font-bold transition ${profileReviewFilter === option.id ? 'bg-brand-500 text-white' : 'bg-white/10 text-slate-300 hover:bg-white/15'}`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="mb-5 flex flex-col gap-2 lg:flex-row lg:items-center">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Segmentar por tipo</p>
            <div className="flex flex-wrap gap-2">
              {profileTypes.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setProfileTypeFilter(option)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${profileTypeFilter === option ? 'bg-brand-500 text-white' : 'bg-white/10 text-slate-300 hover:bg-white/15'}`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-3 flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>{visibleProfiles.length} fichas</span>
            <span>Orden alfabetico</span>
          </div>

          {visibleProfiles.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-slate-400">
              No hay fichas con este filtro.
            </div>
          ) : (
            <div className="divide-y divide-white/5 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/35">
              {visibleProfiles.map((profile) => (
                <div
                  key={profile.key}
                  className="grid gap-2 px-4 py-3 text-sm transition hover:bg-white/[0.03] md:grid-cols-[minmax(220px,1fr)_110px_minmax(150px,0.8fr)_80px_80px_105px_90px] md:items-center"
                >
                  <Link href={`/admin/eventos/${profile.slug}`} className="font-bold text-white hover:text-brand-300">
                    {profile.title}
                  </Link>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-300 md:justify-self-start">{profile.type || 'Tardeo'}</span>
                  <span className="text-slate-400">{profile.venue || 'Lugar por revisar'}</span>
                  <span className="text-right text-xs font-semibold text-brand-200 md:text-left">
                    {profile.count} dato{profile.count === 1 ? '' : 's'}
                  </span>
                  {profile.sourceUrl ? (
                    <a
                      href={profile.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="justify-self-start rounded-full border border-white/10 px-3 py-1 text-xs font-bold text-slate-200 hover:border-brand-500/60"
                    >
                      Fuente
                    </a>
                  ) : (
                    <span className="text-xs font-semibold text-slate-600">Sin fuente</span>
                  )}
                  <span className={`rounded-full px-3 py-1 text-xs font-bold md:justify-self-start ${profile.profileReviewed ? 'bg-emerald-500/15 text-emerald-200' : 'bg-yellow-500/15 text-yellow-200'}`}>
                    {profile.profileReviewed ? 'Creada' : 'Por revisar'}
                  </span>
                  <button
                    type="button"
                    onClick={() => deleteEventProfile(profile)}
                    className="justify-self-start rounded-full px-3 py-1 text-xs font-semibold text-slate-500 hover:bg-red-500/10 hover:text-red-300 md:justify-self-end"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {adminTab === 'research' && (
        <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-500">Recopilacion</p>
              <h2 className="text-2xl font-bold">Listado de eventos</h2>
              <p className="mt-2 text-sm text-slate-400">Mesa tipo Excel para enlaces de tiqueteras, webs e Instagram antes de pasarlos al Admin.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => addResearchRow()} className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-brand-500/60">Nueva fila</button>
              <button type="button" onClick={createSelectedResearchEvents} className="rounded-full bg-brand-500 px-4 py-2 text-sm font-bold text-white hover:bg-brand-600">Crear seleccionados en revision</button>
            </div>
          </div>

          <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <label className="relative block w-full lg:max-w-md">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                className="input h-11 rounded-full pl-11 pr-10 text-sm"
                placeholder="Buscar evento, sala, zona, musica..."
                value={researchSearchQuery}
                onChange={(event) => setResearchSearchQuery(event.target.value)}
              />
              {researchSearchQuery && (
                <button
                  type="button"
                  onClick={() => setResearchSearchQuery('')}
                  className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-slate-300 hover:bg-white/15 hover:text-white"
                  aria-label="Limpiar busqueda"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </label>
            <p className="text-xs font-semibold text-slate-500">
              {visibleResearchRows.length} de {researchRows.length} filas
            </p>
          </div>

          <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-center">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Segmentar por tipo</p>
            <div className="flex flex-wrap gap-2">
              {researchTypes.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setResearchTypeFilter(option)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${researchTypeFilter === option ? 'bg-brand-500 text-white' : 'bg-white/10 text-slate-300 hover:bg-white/15'}`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {researchStatuses.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setResearchStatusFilter(option)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${researchStatusFilter === option ? 'bg-slate-200 text-slate-950' : 'bg-white/10 text-slate-300 hover:bg-white/15'}`}
              >
                {option}
              </button>
            ))}
          </div>

          {visibleResearchRows.length === 0 && (
            <div className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-slate-400">
              No hay filas en este filtro. Pulsa Nueva fila y pega un enlace.
            </div>
          )}

          <div className="overflow-visible rounded-2xl border border-white/10 bg-slate-950/40">
            <div className="min-w-[980px]">
              <div className="grid grid-cols-[28px_72px_minmax(150px,1.2fr)_100px_105px_70px_115px_95px_75px_135px_128px] gap-1.5 border-b border-white/10 px-2 py-1.5 text-[9px] font-bold uppercase tracking-[0.1em] text-slate-500">
                <span></span>
                <span>Fuente</span>
                <span>Evento</span>
                <span>Tipo</span>
                <span>Musica</span>
                <span>Edad</span>
                <span>Lugar</span>
                <span>Zona</span>
                <span>Precio</span>
                <span>Estado / notas</span>
                <span className="text-right">Acciones</span>
              </div>

              {visibleResearchRows.map((row) => {
                const rowIndex = researchRows.indexOf(row)
                const rowKey = row.id || rowIndex.toString()
                const rowType = compactValue(row.type, 'Tardeo')
                const rowMusic = compactValue(row.music, 'Comercial')
                const rowAudience = compactValue(row.audience, 'Mixto')
                const rowArea = compactValue(row.area, 'Madrid')
                const rowPrice = compactValue(row.price_from, '0')
                const rowStatus = compactValue(row.status, 'nuevo')

                return (
                  <div key={rowKey} className="grid grid-cols-[28px_72px_minmax(150px,1.2fr)_100px_105px_70px_115px_95px_75px_135px_128px] gap-1.5 border-b border-white/5 px-2 py-1.5 text-[9px] last:border-b-0">
                    <input type="checkbox" className="mt-2 h-2.5 w-2.5 justify-self-center accent-brand-500" checked={Boolean(row.selected)} onChange={(event) => updateResearchRow(rowIndex, 'selected', event.target.checked)} />
                    {row.source_url ? (
                      <a href={row.source_url} target="_blank" rel="noreferrer" className="inline-flex h-7 items-center justify-center rounded-full border border-white/10 px-2 text-[9px] font-bold text-slate-200 hover:border-brand-500/60">
                        Fuente
                      </a>
                    ) : (
                      <input className="input h-7 px-2 text-[10px]" value={row.source_url} onChange={(event) => updateResearchRow(rowIndex, 'source_url', event.target.value)} placeholder="URL" />
                    )}
                    {row.title ? (
                      <Link href={`/admin/eventos/${getEventSeriesSlug({ title: row.title, type: row.type, venue: row.venue })}`} className="truncate pt-1.5 font-bold text-white hover:text-brand-300">
                        {row.title}
                      </Link>
                    ) : (
                      <input className="input h-7 px-2 text-[9px]" value={row.title} onChange={(event) => updateResearchRow(rowIndex, 'title', event.target.value)} placeholder="Nombre" />
                    )}
                    <CompactDropdown
                      value={rowType}
                      fallback="Tardeo"
                      options={researchTypeOptions}
                      openKey={`${rowKey}-type`}
                      activeOpenKey={activeResearchDropdown}
                      onOpenChange={setActiveResearchDropdown}
                      onChange={(value) => updateResearchRow(rowIndex, 'type', value)}
                    />
                    <CompactDropdown
                      value={rowMusic}
                      fallback="Comercial"
                      options={researchMusicOptions}
                      openKey={`${rowKey}-music`}
                      activeOpenKey={activeResearchDropdown}
                      onOpenChange={setActiveResearchDropdown}
                      onChange={(value) => updateResearchRow(rowIndex, 'music', value)}
                    />
                    <CompactDropdown
                      value={rowAudience}
                      fallback="Mixto"
                      options={researchAudienceOptions}
                      openKey={`${rowKey}-audience`}
                      activeOpenKey={activeResearchDropdown}
                      onOpenChange={setActiveResearchDropdown}
                      onChange={(value) => updateResearchRow(rowIndex, 'audience', value)}
                    />
                    <input className="input h-7 px-2 !text-[9px] leading-none" value={row.venue} onChange={(event) => updateResearchRow(rowIndex, 'venue', event.target.value)} placeholder="Sala" />
                    <CompactDropdown
                      value={rowArea}
                      fallback="Madrid"
                      options={researchAreaOptions}
                      openKey={`${rowKey}-area`}
                      activeOpenKey={activeResearchDropdown}
                      onOpenChange={setActiveResearchDropdown}
                      onChange={(value) => updateResearchRow(rowIndex, 'area', value)}
                    />
                    <CompactDropdown
                      value={rowPrice}
                      fallback="0"
                      options={researchPriceOptions}
                      openKey={`${rowKey}-price`}
                      activeOpenKey={activeResearchDropdown}
                      onOpenChange={setActiveResearchDropdown}
                      onChange={(value) => updateResearchRow(rowIndex, 'price_from', value)}
                    />
                    <div className="grid gap-1">
                      <CompactDropdown
                        value={rowStatus}
                        fallback="nuevo"
                        options={researchStatusOptions}
                        openKey={`${rowKey}-status`}
                        activeOpenKey={activeResearchDropdown}
                        onOpenChange={setActiveResearchDropdown}
                        onChange={(value) => updateResearchRow(rowIndex, 'status', value)}
                      />
                      <input className="input h-6 px-2 !text-[8px] leading-none" value={row.notes} onChange={(event) => updateResearchRow(rowIndex, 'notes', event.target.value)} placeholder="Notas" />
                    </div>
                    <div className="grid justify-end gap-1">
                      <button type="button" onClick={() => extractResearchRow(rowIndex)} disabled={researchExtractingKey === rowKey} className="rounded-full border border-white/10 px-2 py-1 text-[9px] font-semibold text-slate-200 hover:border-brand-500/60 disabled:opacity-50">
                        {researchExtractingKey === rowKey ? 'Leyendo' : 'Extraer'}
                      </button>
                      <button type="button" onClick={() => archiveResearchRow(row, rowIndex)} className="rounded-full border border-white/10 px-2 py-1 text-[9px] font-semibold text-slate-400 hover:border-brand-500/60 hover:text-white">
                        Archivar
                      </button>
                      <button type="button" onClick={() => saveResearchRow(row)} disabled={researchSaving} className="rounded-full bg-brand-500 px-2 py-1 text-[9px] font-bold text-white hover:bg-brand-600 disabled:opacity-50">Guardar</button>
                      <button type="button" onClick={() => deleteResearchRow(row, rowIndex)} className="rounded-full px-2 py-1 text-[9px] font-semibold text-slate-500 hover:text-red-300">Borrar</button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {adminTab === 'create' && (
      <>
      <form ref={formRef} onSubmit={handleSubmit} className="mt-8 rounded-3xl border border-white/10 bg-slate-900/70 p-5">
        <div className="mb-5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-500">Crear evento</p>
          <h2 className="text-2xl font-bold">{editingEvent ? 'Editar evento' : 'Nuevo evento'}</h2>
          <p className="mt-2 text-sm text-slate-400">Rellena los datos principales a izquierda y derecha antes de publicar o revisar.</p>
        </div>

        {editingEvent && (
          <div className="mb-5 rounded-2xl border border-brand-500/30 bg-brand-500/10 p-4 text-sm text-brand-100">
            Editando: {editingEvent.title}. Si era pendiente, seguira pendiente hasta que pulses Aprobar.
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <input className="input lg:col-span-2" placeholder="Nombre del evento" value={title} onChange={(e) => setTitle(e.target.value)} />

          <select className="select" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">Tipo de evento</option>
            <option>Tardeo</option>
            <option>Rooftop</option>
            <option>Brunch</option>
            <option>Fitness Party</option>
            <option>Afterwork</option>
          </select>

          <select className="select" value={audience} onChange={(e) => setAudience(e.target.value)}>
            <option value="">Edad recomendada</option>
            {AUDIENCE_OPTIONS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>

          <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 lg:col-span-2">
            <p className="mb-3 text-sm font-semibold text-slate-300">Estilos musicales</p>
            <div className="flex flex-wrap gap-2">
              {MUSIC_OPTIONS.map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => toggleMusicStyle(style)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    music.includes(style)
                      ? 'bg-brand-500 text-white'
                      : 'bg-white/10 text-slate-300 hover:bg-white/15'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          <select className="select" value={area} onChange={(e) => setArea(e.target.value)}>
            <option value="">Zona</option>
            <option>Centro</option>
            <option>Salamanca</option>
            <option>Retiro</option>
            <option value="Otra">Otra</option>
          </select>

          {area === 'Otra' && (
            <input className="input" placeholder="Zona personalizada" value={customArea} onChange={(e) => setCustomArea(e.target.value)} />
          )}

          <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <input type="time" className="input" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            <input type="time" className="input" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </div>

          <input className="input" placeholder="Precio (EUR)" value={priceFrom} onChange={(e) => setPriceFrom(e.target.value)} />
          <input className="input" placeholder="Lugar" value={venue} onChange={(e) => setVenue(e.target.value)} />
          <input className="input" placeholder="Direccion" value={address} onChange={(e) => setAddress(e.target.value)} />
          <input className="input" placeholder="Link de Google Maps" value={mapsUrl} onChange={(e) => setMapsUrl(e.target.value)} />
          <input className="input lg:col-span-2" placeholder="Link de compra / tiquetera" value={ticketUrl} onChange={(e) => setTicketUrl(e.target.value)} />

          <textarea className="input min-h-28 lg:col-span-2" placeholder="Descripcion" value={description} onChange={(e) => setDescription(e.target.value)} />
          <input className="input lg:col-span-2" placeholder="Extras" value={perks} onChange={(e) => setPerks(e.target.value)} />

          <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 lg:col-span-2">
            <p className="text-sm font-semibold text-slate-300">Cartel del evento</p>
            <p className="mt-1 text-xs text-slate-500">
              Imagen principal del evento. Recomendado 4:5 o cuadrado.
            </p>
            <input
              type="file"
              accept="image/*"
              className="input mt-4"
              onChange={(e) => {
                const file = e.target.files?.[0] || null
                setCover(file)
                setPreviewUrl(file ? URL.createObjectURL(file) : '')
              }}
            />
          </div>

          {previewUrl && (
            <img src={previewUrl} alt="Preview del cartel" className="max-h-[520px] w-full rounded-xl object-contain lg:col-span-2" />
          )}

          <input
            className="input lg:col-span-2"
            placeholder="Link del reel o video"
            value={reelUrl}
            onChange={(e) => setReelUrl(e.target.value)}
          />

          <button className="btn-primary w-full lg:col-span-2" type="submit">
            {editingEvent ? 'Guardar cambios' : 'Crear evento'}
          </button>
        </div>

        {message && <p className="text-sm text-brand-500">{message}</p>}
      </form>
      </>
      )}

      {false && (
      <section ref={bulkSectionRef} className="mt-12 rounded-3xl border border-white/10 bg-slate-900/70 p-5">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-500">Bandeja editorial</p>
            <h2 className="text-2xl font-bold">Eventos preparados para revisar</h2>
            <p className="mt-2 text-sm text-slate-400">Importa enlaces o eventos Scout, edita lo necesario, duplica fechas y mandalo todo a revision.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={addBulkRow} className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-brand-500/60">Nuevo evento</button>
            <button type="button" onClick={createBulkEvents} className="rounded-full bg-brand-500 px-4 py-2 text-sm font-bold text-white hover:bg-brand-600">Crear en revision</button>
          </div>
        </div>

        <details className="mb-4 rounded-2xl border border-white/10 bg-slate-950/50 p-4">
          <summary className="cursor-pointer text-sm font-semibold text-slate-200">Importar varios desde Excel, Sheets o enlaces</summary>
          <textarea
            className="input mt-4 min-h-20 text-sm"
            placeholder="Pega aqui varias filas: evento, tipo, musica, edad, sala, zona, fecha, inicio, fin, precio, link entradas, maps, descripcion"
            onPaste={(event) => {
              const text = event.clipboardData.getData('text')
              if (text.includes('\t')) {
                event.preventDefault()
                pasteBulkRows(text)
              }
            }}
          />
          <p className="mt-2 text-xs text-slate-500">Tambien puedes crear un evento nuevo, pegar solo el enlace de la tiquetera y pulsar Extraer.</p>
        </details>

        <div className="mb-4 rounded-2xl border border-white/10 bg-slate-950/50 p-4">
          <p className="mb-3 text-sm font-semibold text-slate-300">Duplicar evento por varios dias</p>
          <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto] lg:items-center">
            <select className="select" value={bulkDuplicateRowId} onChange={(event) => setBulkDuplicateRowId(event.target.value)}>
              <option value="">Selecciona evento de la bandeja</option>
              {bulkRows.map((row) => (
                <option key={row.id} value={row.id}>{row.title || 'Evento sin titulo'} {row.date ? `- ${row.date}` : ''}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <input type="date" className="input" value={bulkDuplicateDate} onChange={(event) => setBulkDuplicateDate(event.target.value)} />
              <button type="button" onClick={addDuplicateDate} className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-brand-500/60">Anadir fecha</button>
            </div>
            <button type="button" onClick={duplicateBulkRowOnDates} className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/15">Duplicar</button>
          </div>
          {bulkDuplicateDates.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {bulkDuplicateDates.map((dateValue) => (
                <button key={dateValue} type="button" onClick={() => setBulkDuplicateDates((dates) => dates.filter((item) => item !== dateValue))} className="rounded-full bg-brand-500/20 px-3 py-1 text-xs font-semibold text-brand-100">
                  {new Date(dateValue).toLocaleDateString('es-ES')} x
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          {bulkRows.map((row, index) => (
            <details key={row.id} open={!row.title && index === 0} className={`rounded-2xl border p-4 ${row.active ? 'border-white/10 bg-slate-950/50' : 'border-white/5 bg-slate-950/25 opacity-60'}`}>
              <summary className="cursor-pointer list-none">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="checkbox"
                        checked={row.active}
                        onClick={(event) => event.stopPropagation()}
                        onChange={(event) => updateBulkRow(row.id, 'active', event.target.checked)}
                      />
                      <p className="truncate text-base font-bold text-white">{row.title || 'Evento sin titulo'}</p>
                      <span className="rounded-full bg-brand-500/15 px-2 py-0.5 text-[11px] font-semibold text-brand-100">{row.type || 'Tardeo'}</span>
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-slate-300">{row.music || 'Musica por revisar'}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-400">
                      {[row.date ? new Date(row.date).toLocaleDateString('es-ES') : 'Sin fecha', row.venue || 'Sala por revisar', row.area || 'Madrid', row.priceFrom ? `Desde ${row.priceFrom} EUR` : null].filter(Boolean).join(' - ')}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault()
                        extractBulkRowFromUrl(row.id)
                      }}
                      disabled={bulkExtractingRowId === row.id}
                      className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-brand-500/60 disabled:cursor-wait disabled:opacity-60"
                    >
                      {bulkExtractingRowId === row.id ? 'Leyendo...' : 'Extraer'}
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault()
                        setBulkDuplicateRowId(row.id)
                      }}
                      className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-brand-500/60"
                    >
                      Duplicar fechas
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault()
                        removeBulkRow(row.id)
                      }}
                      className="rounded-full px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-red-300"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </summary>

              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                <input className="input" value={row.title} onChange={(event) => updateBulkRow(row.id, 'title', event.target.value)} placeholder="Nombre del evento" />
                <input className="input" value={row.ticketUrl} onChange={(event) => updateBulkRow(row.id, 'ticketUrl', event.target.value)} placeholder="Link de compra / tiquetera" />
                <select className="select" value={row.type} onChange={(event) => updateBulkRow(row.id, 'type', event.target.value)}>
                  {EVENT_TYPE_OPTIONS.map((option) => <option key={option}>{option}</option>)}
                </select>
                <input className="input" value={row.music} onChange={(event) => updateBulkRow(row.id, 'music', event.target.value)} placeholder="Musica: Comercial, Pop..." />
                <select className="select" value={row.audience} onChange={(event) => updateBulkRow(row.id, 'audience', event.target.value)}>
                  {['Mixto', ...AUDIENCE_OPTIONS].map((option) => <option key={option}>{option}</option>)}
                </select>
                <input className="input" value={row.priceFrom} onChange={(event) => updateBulkRow(row.id, 'priceFrom', event.target.value)} placeholder="Precio desde" />
                <input className="input" value={row.venue} onChange={(event) => updateBulkRow(row.id, 'venue', event.target.value)} placeholder="Sala o lugar" />
                <input className="input" value={row.area} onChange={(event) => updateBulkRow(row.id, 'area', event.target.value)} placeholder="Zona" />
                <input type="date" className="input" value={row.date} onChange={(event) => updateBulkRow(row.id, 'date', event.target.value)} />
                <div className="grid grid-cols-2 gap-3">
                  <input type="time" className="input" value={row.startTime} onChange={(event) => updateBulkRow(row.id, 'startTime', event.target.value)} />
                  <input type="time" className="input" value={row.endTime} onChange={(event) => updateBulkRow(row.id, 'endTime', event.target.value)} />
                </div>
                <input className="input lg:col-span-2" value={row.mapsUrl} onChange={(event) => updateBulkRow(row.id, 'mapsUrl', event.target.value)} placeholder="Link de Google Maps" />
                <textarea className="input lg:col-span-2" value={row.description} onChange={(event) => updateBulkRow(row.id, 'description', event.target.value)} placeholder="Descripcion" />
              </div>
            </details>
          ))}
        </div>
      </section>
      )}
      {adminTab === 'events' && (
      <>
      <div className="mt-12">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Eventos</h2>
            <p className="mt-1 text-xs text-slate-500">Agrupados por ficha para revisar muchas fechas rapido.</p>
          </div>

          <div className="flex rounded-full border border-white/10 bg-slate-900/80 p-1 text-sm">
            <button
              type="button"
              onClick={() => setEventListTab('created')}
              className={`rounded-full px-4 py-2 font-semibold transition ${eventListTab === 'created' ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Eventos creados ({createdEvents.length})
            </button>
            <button
              type="button"
              onClick={() => setEventListTab('past')}
              className={`rounded-full px-4 py-2 font-semibold transition ${eventListTab === 'past' ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Eventos pasados ({pastEvents.length})
            </button>
          </div>
        </div>

        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <label className="relative block w-full lg:max-w-sm">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              className="input h-10 rounded-full pl-11 pr-10 text-xs"
              placeholder="Buscar evento, sala, zona..."
              value={eventSearchQuery}
              onChange={(event) => setEventSearchQuery(event.target.value)}
            />
            {eventSearchQuery && (
              <button
                type="button"
                onClick={() => setEventSearchQuery('')}
                className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-slate-300 hover:bg-white/15 hover:text-white"
                aria-label="Limpiar busqueda"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </label>

          <div className="flex flex-wrap gap-2">
            {eventTypes.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setEventTypeFilter(option)}
                className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition ${eventTypeFilter === option ? 'bg-brand-500 text-white' : 'bg-white/10 text-slate-300 hover:bg-white/15'}`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {visibleEventGroups.length === 0 ? (
          <p className="text-sm text-slate-400">
            {eventListTab === 'past' ? 'No hay eventos pasados con este filtro' : 'No hay eventos publicados activos con este filtro'}
          </p>
        ) : (
          <div className="divide-y divide-white/5 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70">
            {visibleEventGroups.map((group) => {
              const firstEvent = group.events[0]
              const dates = group.events
                .map((event: any) => event.date)
                .filter(Boolean)
                .slice(0, 10)

              return (
                <div
                  key={group.key}
                  className="grid gap-2 px-3 py-2 text-[11px] transition hover:bg-white/[0.03] xl:grid-cols-[minmax(220px,1fr)_90px_100px_minmax(260px,1fr)_auto] xl:items-center"
                >
                  <div className="min-w-0">
                    <Link href={`/admin/eventos/${group.slug}`} className="block truncate text-xs font-bold text-white hover:text-brand-300">
                      {group.title}
                    </Link>
                    <p className="mt-0.5 truncate text-[10px] text-slate-500">{[group.venue, group.area].filter(Boolean).join(' - ') || 'Lugar por revisar'}</p>
                  </div>

                  <span className="w-fit rounded-full bg-white/10 px-2 py-1 text-[10px] font-semibold text-slate-300">{group.type || 'Tardeo'}</span>
                  <span className="text-[10px] font-semibold text-brand-200">{group.events.length} fecha{group.events.length === 1 ? '' : 's'}</span>

                  <div className="flex min-w-0 flex-wrap gap-1">
                    {dates.map((date: string) => (
                      <span key={`${group.key}-${date}`} className="rounded-full bg-slate-950/80 px-2 py-1 text-[10px] font-semibold text-slate-300">
                        {new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}
                      </span>
                    ))}
                    {group.events.length > dates.length && (
                      <span className="rounded-full bg-brand-500/15 px-2 py-1 text-[10px] font-bold text-brand-200">+{group.events.length - dates.length}</span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5 xl:justify-end">
                    {group.sourceUrl && (
                      <a href={group.sourceUrl} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-semibold text-slate-200 hover:border-brand-500/60">
                        Tiquetera
                      </a>
                    )}
                    {group.mapsUrl && (
                      <a href={group.mapsUrl} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-semibold text-slate-200 hover:border-brand-500/60">
                        Maps
                      </a>
                    )}
                    {firstEvent?.slug && (
                      <Link href={`/eventos/${firstEvent.slug}?from=admin`} className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-semibold text-slate-200 hover:border-brand-500/60">
                        Vista
                      </Link>
                    )}
                    {firstEvent && (
                      <button className="rounded-full bg-brand-500 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-brand-600" onClick={() => loadEventForEdit(firstEvent)}>
                        Editar
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="mt-12">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-500">TARDEA Scout</p>
            <h2 className="text-2xl font-bold">Eventos encontrados para revisar</h2>
          </div>
          <p className="text-sm text-slate-400">Se publican solo despues de revisar datos, imagen y fuente.</p>
        </div>

        <div className="mb-4 rounded-2xl border border-brand-500/20 bg-brand-500/10 p-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
            <label className="text-sm font-semibold text-slate-300">
              Desde
              <input
                type="date"
                className="input mt-2"
                value={scoutSearchStartDate}
                onChange={(event) => {
                  const nextStart = event.target.value
                  setScoutSearchStartDate(nextStart)
                  if (nextStart) setScoutSearchEndDate(formatInputDate(addDays(new Date(`${nextStart}T12:00:00`), 6)))
                }}
              />
            </label>
            <label className="text-sm font-semibold text-slate-300">
              Hasta
              <input
                type="date"
                className="input mt-2"
                value={scoutSearchEndDate}
                onChange={(event) => setScoutSearchEndDate(event.target.value)}
              />
            </label>
            <label className="text-sm font-semibold text-slate-300">
              Tipo
              <select
                className="select mt-2"
                value={scoutSearchType}
                onChange={(event) => setScoutSearchType(event.target.value)}
              >
                <option>Todos</option>
                {EVENT_TYPE_OPTIONS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={searchScoutEvents}
              disabled={scoutSearching}
              className="rounded-full bg-brand-500 px-5 py-3 text-sm font-bold text-white hover:bg-brand-600 disabled:cursor-wait disabled:opacity-60"
            >
              {scoutSearching ? 'Buscando...' : 'Buscar eventos'}
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={pingScoutSearch}
              disabled={scoutPingLoading}
              className="rounded-full border border-white/10 px-4 py-2 text-xs font-bold text-slate-200 hover:border-brand-500/60 disabled:cursor-wait disabled:opacity-60"
            >
              {scoutPingLoading ? 'Probando...' : 'Probar conexion Serper'}
            </button>
          </div>
          <p className="mt-3 text-xs text-slate-400">
            Busca candidatos publicos en tiqueteras, Instagram, TikTok y Facebook. Quedan en revision y nunca se publican solos.
          </p>
          <label className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-300">
            <input
              type="checkbox"
              checked={scoutDryRun}
              onChange={(event) => setScoutDryRun(event.target.checked)}
            />
            Solo probar busqueda, sin guardar
          </label>
          {scoutSearchReport && (
            <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-xs text-slate-300">
              <div className="grid gap-2 sm:grid-cols-4">
                <p><span className="text-slate-500">Busquedas:</span> {scoutSearchReport.searchesRun ?? 0}</p>
                <p><span className="text-slate-500">Resultados:</span> {scoutSearchReport.resultsReceived ?? 0}</p>
                <p><span className="text-slate-500">Preparados:</span> {scoutSearchReport.preview ?? scoutSearchReport.imported ?? 0}</p>
                <p><span className="text-slate-500">Fecha revisar:</span> {scoutSearchReport.needsDateReview ?? 0}</p>
              </div>
              {scoutSearchReport.status && (
                <p className="mt-2 text-slate-400">
                  <span className="text-slate-500">Estado API:</span> {scoutSearchReport.status}
                  {scoutSearchReport.error ? ` - ${scoutSearchReport.error}` : ''}
                  {scoutSearchReport.rawError ? ` - ${scoutSearchReport.rawError}` : ''}
                </p>
              )}
              {scoutSearchReport.version && (
                <p className="mt-2 text-slate-500">Scout: {scoutSearchReport.version}</p>
              )}
              {scoutSearchReport.debug && (
                <div className="mt-2 text-slate-400">
                  <p>
                    <span className="text-slate-500">Diagnostico:</span> {scoutSearchReport.debug.queryCount ?? 0} consultas preparadas, {scoutSearchReport.debug.platforms ?? 0} fuentes, clave {scoutSearchReport.debug.hasKey ? 'activa' : 'no detectada'}
                  </p>
                  {scoutSearchReport.debug.examples?.length > 0 && (
                    <p className="mt-1 truncate text-slate-500">Primera busqueda: {scoutSearchReport.debug.examples[0]}</p>
                  )}
                </div>
              )}
              {scoutSearchReport.checks?.length > 0 && (
                <div className="mt-3 space-y-1">
                  <p className="font-semibold text-slate-200">Pruebas Serper</p>
                  {scoutSearchReport.checks.map((check: any) => (
                    <p key={check.query} className="text-slate-400">
                      {check.query}: {check.results} resultados, estado {check.status}, claves {check.responseKeys?.join(', ') || 'sin datos'}
                    </p>
                  ))}
                </div>
              )}
              {scoutSearchReport.samples?.length > 0 && (
                <div className="mt-3 space-y-1">
                  <p className="font-semibold text-slate-200">Ejemplos recibidos</p>
                  {scoutSearchReport.samples.slice(0, 5).map((sample: any, index: number) => (
                    <a
                      key={`${sample.link}-${index}`}
                      href={sample.link}
                      target="_blank"
                      rel="noreferrer"
                      className="block truncate text-brand-300 hover:text-brand-200"
                    >
                      {sample.platform}: {sample.title}
                    </a>
                  ))}
                </div>
              )}
              {scoutSearchReport.queriesRun?.length > 0 && (
                <details className="mt-3">
                  <summary className="cursor-pointer font-semibold text-slate-200">Busquedas ejecutadas</summary>
                  <div className="mt-2 space-y-1 text-slate-500">
                    {scoutSearchReport.queriesRun.map((query: string, index: number) => (
                      <p key={`${query}-${index}`} className="truncate">{query}</p>
                    ))}
                  </div>
                </details>
              )}
            </div>
          )}
        </div>

        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {scoutTypes.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setScoutTypeFilter(option)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${scoutTypeFilter === option ? 'bg-brand-500 text-white' : 'bg-white/10 text-slate-300 hover:bg-white/15'}`}
              >
                {option}
              </button>
            ))}
          </div>

          {selectedScoutEventIds.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={addSelectedScoutEventsToResearchList}
                className="rounded-full bg-brand-500 px-4 py-2 text-sm font-bold text-white hover:bg-brand-600"
              >
                Pasar {selectedScoutEventIds.length} al listado
              </button>
            </div>
          )}
        </div>

        {filteredScoutEvents.length === 0 && (
          <p className="text-slate-400">No hay eventos encontrados para este filtro</p>
        )}

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70">
          <div className="hidden grid-cols-[30px_76px_minmax(220px,1.4fr)_96px_110px_minmax(130px,1fr)_auto] gap-2 border-b border-white/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 xl:grid">
            <span></span>
            <span>Fecha</span>
            <span>Evento</span>
            <span>Tipo</span>
            <span>Zona</span>
            <span>Fuente</span>
            <span className="text-right">Acciones</span>
          </div>

          {filteredScoutEvents.map((event) => (
            <div
              key={event.id}
              className="grid gap-2 border-b border-white/5 px-3 py-2.5 last:border-b-0 xl:grid-cols-[30px_76px_minmax(220px,1.4fr)_96px_110px_minmax(130px,1fr)_auto] xl:items-center"
            >
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedScoutEventIds.includes(event.id)}
                  onChange={() => toggleScoutSelection(event.id)}
                />
              </label>

              <div className="text-xs font-semibold text-slate-300">
                {event.perks?.includes('Fecha por revisar') ? 'Revisar' : event.date ? new Date(event.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }) : 'Sin fecha'}
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/admin/eventos/${getEventSeriesSlug(event)}`} className="truncate text-sm font-semibold text-white hover:text-brand-300">
                    {event.title}
                  </Link>
                  <span className="rounded-full bg-brand-500/15 px-2 py-0.5 text-[11px] font-semibold text-brand-200">Scout</span>
                  {event.perks?.includes('Fecha por revisar') && (
                    <span className="rounded-full bg-yellow-500/15 px-2 py-0.5 text-[11px] font-semibold text-yellow-200">Fecha por revisar</span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-xs text-slate-500">{event.venue || "Sala por revisar"}</p>
              </div>

              <p className="text-xs text-slate-400">{event.type || "Tardeo"}</p>
              <p className="text-xs text-slate-400">{event.area || "Madrid"}</p>

              <div className="min-w-0 text-xs text-slate-400">
                <p className="truncate">{event.source_name || "No indicada"}</p>
                {event.source_url && (
                  <a href={event.source_url} target="_blank" rel="noreferrer" className="text-[11px] text-brand-500 hover:text-brand-400">
                    Fuente
                  </a>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5 xl:justify-end">
                {event.slug && (
                  <Link href={`/eventos/${event.slug}?from=admin`} className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:border-brand-500/60">
                    Vista
                  </Link>
                )}
                <button className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:border-brand-500/60" onClick={() => loadEventForEdit(event)}>
                  Editar
                </button>
                <button className="rounded-full border border-sky-500/40 px-2.5 py-1 text-[11px] font-semibold text-sky-100 hover:bg-sky-500/10" onClick={() => addScoutEventsToResearchList([event])}>
                  Al listado
                </button>
                <button className="rounded-full bg-brand-500 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-brand-600" onClick={() => approveScoutEvent(event.id)}>
                  Aprobar
                </button>
                <button className="rounded-full px-2.5 py-1 text-[11px] font-semibold text-slate-500 hover:text-red-300" onClick={() => discardScoutEvent(event.id)}>
                  Descartar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-12">
        <h2 className="mb-4 text-2xl font-bold">Reclamaciones de eventos</h2>

        {eventClaims.length === 0 && (
          <p className="text-slate-400">No hay reclamaciones pendientes</p>
        )}

        <div className="space-y-4">
          {eventClaims.map((claim) => (
            <div key={claim.id} className="rounded-2xl border border-white/10 bg-slate-900/80 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-500">
                    Solicitud pendiente
                  </p>
                  <h3 className="mt-2 text-xl font-bold">
                    {claim.events?.title || 'Evento sin titulo'}
                  </h3>
                  <p className="mt-1 text-sm text-slate-400">
                    {[claim.events?.venue, claim.events?.date ? new Date(claim.events.date).toLocaleDateString('es-ES') : null].filter(Boolean).join(' - ')}
                  </p>
                  <div className="mt-4 grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
                    <p><span className="text-slate-500">Contacto:</span> {claim.contact_name}</p>
                    <p><span className="text-slate-500">Empresa:</span> {claim.company}</p>
                    <p><span className="text-slate-500">Email:</span> {claim.email}</p>
                    <p><span className="text-slate-500">Telefono:</span> {claim.phone || 'No indicado'}</p>
                    <p className="sm:col-span-2"><span className="text-slate-500">Web/Instagram:</span> {claim.website || 'No indicado'}</p>
                    {claim.message && (
                      <p className="sm:col-span-2"><span className="text-slate-500">Mensaje:</span> {claim.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  {claim.events?.slug && (
                    <Link href={`/eventos/${claim.events.slug}?from=admin`} className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-brand-500/60">
                      Ver evento
                    </Link>
                  )}
                  <button className="rounded-full bg-brand-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-600" onClick={() => approveClaim(claim)}>
                    Aprobar
                  </button>
                  <button className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-brand-500/60" onClick={() => rejectClaim(claim.id)}>
                    Rechazar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-12">
        <h2 className="mb-4 text-2xl font-bold">Eventos pendientes</h2>

        {pendingEvents.length === 0 && (
          <p className="text-slate-400">No hay eventos pendientes</p>
        )}

        <div className="space-y-3">
          {pendingEvents.map((event) => (
            <div
              key={event.id}
              className="flex flex-col gap-3 rounded-xl border border-yellow-500/20 bg-yellow-900/20 px-4 py-3 lg:flex-row lg:items-center lg:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/admin/eventos/${getEventSeriesSlug(event)}`} className="font-semibold text-white hover:text-brand-300 lg:truncate">
                    {event.title}
                  </Link>
                  <span className="rounded-full bg-yellow-500/20 px-3 py-1 text-xs text-yellow-300">
                    Pendiente
                  </span>
                  {event.promotion_package_name && (
                    <span className="rounded-full bg-brand-500/20 px-3 py-1 text-xs font-semibold text-brand-200">
                      Promo: {event.promotion_package_name}
                    </span>
                  )}
                </div>

                <p className="mt-1 text-sm text-slate-400">
                  {[new Date(event.date).toLocaleDateString('es-ES'), event.venue, event.address].filter(Boolean).join(' - ')}
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
                {event.maps_url && (
                  <a
                    href={event.maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-brand-500/60"
                  >
                    Maps
                  </a>
                )}

                <Link href={`/eventos/${event.slug}?from=admin`} className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-brand-500/60">
                  Vista previa
                </Link>

                <button className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-brand-500/60" onClick={() => loadEventForEdit(event)}>
                  Editar
                </button>

                <button className="rounded-full bg-brand-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-600" onClick={() => approveEvent(event.id)}>
                  Aprobar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      </>
      )}
    </main>
  )
}
