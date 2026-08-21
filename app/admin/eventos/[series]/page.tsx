'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const MUSIC_OPTIONS = ['Comercial', 'Show en directo', 'Electronica', 'Reguetón', 'Pop', 'Indie', 'Flamenquito', 'Remember']
const AUDIENCE_OPTIONS = ['18-25', '25-35', '30+', 'Mixto']
const EVENT_TYPE_OPTIONS = ['Tardeo', 'Rooftop', 'Brunch', 'Afterwork', 'Fitness Party']
const CUSTOM_AREA_OPTION = 'Otra zona'
const AREA_OPTIONS = [
  'Madrid',
  'Centro',
  'Salamanca',
  'Malasana',
  'Retiro',
  'Chamberi',
  'Gran Via',
  'Ponzano',
  'La Latina',
  'Carabanchel',
  'Chamartín',
  'Tetuan',
  'Fuencarral-El Pardo',
  'Fuencarral',
  'Alcorcon',
  'Mostoles',
  CUSTOM_AREA_OPTION,
]
const FIXED_AREA_OPTIONS = AREA_OPTIONS.filter((option) => option !== CUSTOM_AREA_OPTION)

function generateSlug(title: string, date: string) {
  const cleanTitle = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return date ? `${cleanTitle}-${date}` : cleanTitle
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

function formatDate(date: string) {
  if (!date) return 'Sin fecha'
  return new Date(date).toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  })
}

function formatTime(time: string) {
  if (!time) return ''
  return time.split(':').slice(0, 2).join(':')
}

function formatPosterDate(date: string) {
  if (!date) return 'Fecha por confirmar'
  const [year, month, day] = date.split('-').map(Number)
  const localDate = new Date(year, month - 1, day)
  return localDate.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function formatCalendarMonth(date: Date) {
  return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
}

function formatCalendarDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getCalendarDays(monthDate: Date) {
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const leadingBlanks = (firstDay.getDay() + 6) % 7
  return [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => new Date(year, month, index + 1)),
  ]
}

function moveMonth(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1)
}

function firstMusic(event: any) {
  return Array.isArray(event.music) ? event.music[0] || 'Comercial' : event.music || 'Comercial'
}

function getMusicList(value: any) {
  if (Array.isArray(value)) return value.filter(Boolean)
  if (typeof value === 'string') {
    return value.split(',').map((item) => item.trim()).filter(Boolean)
  }
  return ['Comercial']
}

function getAreaSelectValue(area: string) {
  if (!area) return 'Madrid'
  return FIXED_AREA_OPTIONS.includes(area) ? area : CUSTOM_AREA_OPTION
}

function getAreaFromSelect(selectedArea: string, currentArea: string) {
  if (selectedArea !== CUSTOM_AREA_OPTION) return selectedArea
  return currentArea && !FIXED_AREA_OPTIONS.includes(currentArea) ? currentArea : CUSTOM_AREA_OPTION
}

function getEventExtras(event: any) {
  const music = getMusicList(event.music)
  const automaticLabels = new Set([
    event.type,
    event.area,
    event.venue,
    event.audience,
    ...music,
    ...MUSIC_OPTIONS,
    ...EVENT_TYPE_OPTIONS,
    ...AREA_OPTIONS,
    ...AUDIENCE_OPTIONS,
  ].filter(Boolean))

  return Array.isArray(event.perks)
    ? event.perks.filter((item: string) => item && !automaticLabels.has(item))
    : []
}

function buildPerks(event: any) {
  const music = getMusicList(event.music)
  const extras = getEventExtras(event)
  return [event.type, event.area, ...music, ...extras].filter(Boolean)
}

function buildPerksWithExtras(event: any, extrasValue: string) {
  const music = getMusicList(event.music)
  const extras = extrasValue
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  return [event.type, event.area, ...music, ...extras].filter(Boolean)
}

function getUrlsFromText(text: string) {
  return Array.from(text.matchAll(/https?:\/\/[^\s)"']+/g)).map((match) => match[0])
}

function getHost(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

function isTicketUrl(url: string) {
  const host = getHost(url)
  return ['fourvenues', 'feverup', 'entradium', 'xceed', 'eventbrite', 'ticketmaster', 'dice.fm', 'ra.co'].some((domain) => host.includes(domain))
}

function getFirstUrl(...urls: string[]) {
  return urls.find(Boolean) || ''
}

function loadCanvasImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('No se pudo cargar el cartel base'))
    image.src = url
  })
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('No se pudo generar la imagen'))
    }, 'image/jpeg', 0.92)
  })
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  )
}

function TicketIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8Z" />
      <path d="M9 8v8" />
    </svg>
  )
}

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M16.6 4.1c.4 2.2 1.7 3.6 3.8 4v3.2a7.2 7.2 0 0 1-3.7-1.1v5.6c0 3.1-2.2 5.4-5.4 5.4-3 0-5.3-2-5.3-4.9 0-3.1 2.4-5.1 5.8-5.1.4 0 .7 0 1 .1v3.3a4 4 0 0 0-1.1-.2c-1.4 0-2.3.7-2.3 1.8 0 1.1.8 1.8 1.9 1.8 1.3 0 2-.8 2-2.3V4.1h3.3Z" />
    </svg>
  )
}

function WebIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3Z" />
    </svg>
  )
}

export default function AdminEventSeriesPage() {
  const params = useParams()
  const router = useRouter()
  const series = decodeURIComponent(params.series as string)
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<any[]>([])
  const [researchItems, setResearchItems] = useState<any[]>([])
  const [message, setMessage] = useState('')
  const [editingEventId, setEditingEventId] = useState('')
  const [editingExtrasDraft, setEditingExtrasDraft] = useState('')
  const [duplicateDates, setDuplicateDates] = useState<string[]>([])
  const [calendarMonth, setCalendarMonth] = useState(() => new Date())
  const [isEditingBase, setIsEditingBase] = useState(false)
  const [baseForm, setBaseForm] = useState<any>({})
  const [baseCoverFile, setBaseCoverFile] = useState<File | null>(null)
  const [baseCoverPreview, setBaseCoverPreview] = useState('')
  const [baseSaving, setBaseSaving] = useState(false)
  const [uploadingEventCoverId, setUploadingEventCoverId] = useState('')
  const [reviewSaving, setReviewSaving] = useState(false)
  const [applyEditToSeries, setApplyEditToSeries] = useState(false)
  const [approvingAll, setApprovingAll] = useState(false)
  const [generatingPosters, setGeneratingPosters] = useState(false)
  const [extractUrl, setExtractUrl] = useState('')
  const [extractingDates, setExtractingDates] = useState(false)

  async function loadEvents() {
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

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: true })

    if (error) {
      setMessage(`No se pudieron cargar eventos: ${error.message}`)
      setLoading(false)
      return
    }

    setEvents((data || []).filter((event) => getEventSeriesSlug(event) === series))

    const { data: researchData } = await supabase
      .from('event_research_items')
      .select('*')
      .order('created_at', { ascending: false })

    setResearchItems((researchData || []).filter((item) => getEventSeriesSlug(item) === series))
    setLoading(false)
  }

  useEffect(() => {
    loadEvents()
  }, [series])

  const mainEvent = events[0] || researchItems[0]
  const isProfileReviewed = Boolean(mainEvent?.profile_reviewed)
  const upcomingEvents = useMemo(
    () => events.filter((event) => !event.date || event.date >= new Date().toISOString().slice(0, 10)),
    [events]
  )
  const pendingEventsInSeries = useMemo(
    () => events.filter((event) => event.status !== 'approved' || !event.published || event.needs_review),
    [events]
  )
  const pastEvents = useMemo(
    () => events.filter((event) => event.date && event.date < new Date().toISOString().slice(0, 10)),
    [events]
  )
  const editingEvent = events.find((event) => event.id === editingEventId)
  const existingDates = useMemo(() => new Set(events.map((event) => event.date).filter(Boolean)), [events])
  const calendarDays = useMemo(() => getCalendarDays(calendarMonth), [calendarMonth])
  const relatedUrls = useMemo(() => {
    const urls = [...events, ...researchItems].flatMap((event) => [
      event.source_url,
      event.website_url,
      event.instagram_url,
      event.tiktok_url,
      ...getUrlsFromText(event.description || ''),
    ]).filter(Boolean) as string[]
    return Array.from(new Set(urls))
  }, [events, researchItems])
  const instagramUrl = relatedUrls.find((url) => getHost(url).includes('instagram.com')) || ''
  const tiktokUrl = relatedUrls.find((url) => getHost(url).includes('tiktok.com')) || ''
  const ticketUrl = relatedUrls.find(isTicketUrl) || mainEvent?.source_url || ''
  const websiteUrl = relatedUrls.find((url) => {
    const host = getHost(url)
    return host && !host.includes('instagram.com') && !host.includes('tiktok.com') && !isTicketUrl(url)
  }) || ''
  const monitorUrl = getFirstUrl(mainEvent?.website_url, websiteUrl, ticketUrl, mainEvent?.source_url)

  function openBaseEditor() {
    const currentCover = mainEvent.cover || ''
    setBaseForm({
      title: mainEvent.title || '',
      type: mainEvent.type || 'Tardeo',
      music: Array.isArray(mainEvent.music)
        ? mainEvent.music
        : (mainEvent.music || 'Comercial').split(',').map((item: string) => item.trim()).filter(Boolean),
      audience: mainEvent.audience || 'Mixto',
      venue: mainEvent.venue || '',
      area: mainEvent.area || 'Madrid',
      address: mainEvent.address || '',
      maps_url: mainEvent.maps_url || '',
      price_from: mainEvent.price_from?.toString() || '0',
      website_url: getFirstUrl(mainEvent.website_url, websiteUrl),
      source_url: getFirstUrl(mainEvent.source_url, ticketUrl),
      instagram_url: getFirstUrl(mainEvent.instagram_url, instagramUrl),
      tiktok_url: getFirstUrl(mainEvent.tiktok_url, tiktokUrl),
      cover: currentCover,
      description: mainEvent.description || '',
    })
    setBaseCoverFile(null)
    setBaseCoverPreview(currentCover)
    setIsEditingBase(true)
  }

  function updateBaseForm(field: string, value: string) {
    setBaseForm((current: any) => ({ ...current, [field]: value }))
  }

  function toggleBaseMusic(style: string) {
    setBaseForm((current: any) => {
      const currentMusic = Array.isArray(current.music)
        ? current.music
        : (current.music || '').split(',').map((item: string) => item.trim()).filter(Boolean)
      const nextMusic = currentMusic.includes(style)
        ? currentMusic.filter((item: string) => item !== style)
        : [...currentMusic, style]
      return { ...current, music: nextMusic }
    })
  }

  function handleBaseCoverChange(file: File | null) {
    setBaseCoverFile(file)
    if (file) {
      const preview = URL.createObjectURL(file)
      setBaseCoverPreview(preview)
      return
    }
    setBaseCoverPreview(baseForm.cover || '')
  }

  function closeBaseEditor() {
    setIsEditingBase(false)
    setBaseCoverFile(null)
    setBaseCoverPreview('')
  }

  async function saveBaseProfile() {
    setBaseSaving(true)
    const musicList = Array.isArray(baseForm.music)
      ? baseForm.music
      : (baseForm.music || '')
        .split(',')
        .map((item: string) => item.trim())
        .filter(Boolean)
    let coverUrl = baseForm.cover || null

    if (baseCoverFile) {
      const safeName = baseCoverFile.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9.]+/g, '-')
        .replace(/^-+|-+$/g, '')
      const fileName = `series/${series}/${Date.now()}-${safeName}`
      const { error: uploadError } = await supabase.storage
        .from('events')
        .upload(fileName, baseCoverFile, { upsert: true })

      if (uploadError) {
        setBaseSaving(false)
        setMessage(`No se pudo subir el cartel: ${uploadError.message}`)
        return
      }

      const { data } = supabase.storage.from('events').getPublicUrl(fileName)
      coverUrl = data.publicUrl
    }

    const payload = {
      title: baseForm.title || mainEvent.title,
      venue: baseForm.venue || null,
      area: baseForm.area || null,
      address: baseForm.address || null,
      maps_url: baseForm.maps_url || null,
      type: baseForm.type || 'Tardeo',
      music: musicList.length ? musicList : ['Comercial'],
      audience: baseForm.audience || 'Mixto',
      price_from: baseForm.price_from ? Number(baseForm.price_from) : 0,
      website_url: baseForm.website_url || null,
      source_url: baseForm.source_url || null,
      instagram_url: baseForm.instagram_url || null,
      tiktok_url: baseForm.tiktok_url || null,
      cover: coverUrl,
      description: baseForm.description || null,
      profile_reviewed: true,
    }

    if (events.length > 0) {
      const { error } = await supabase
        .from('events')
        .update(payload)
        .in('id', events.map((event) => event.id))

      if (error) {
        setBaseSaving(false)
        setMessage(`No se pudieron guardar los datos base: ${error.message}`)
        return
      }
    }

    const researchIds = researchItems.map((item) => item.id).filter(Boolean)
    if (researchIds.length > 0) {
      const { error } = await supabase
        .from('event_research_items')
        .update({
          title: payload.title,
          venue: payload.venue,
          area: payload.area,
          maps_url: payload.maps_url,
          type: payload.type,
          music: payload.music,
          audience: payload.audience,
          price_from: payload.price_from,
          notes: payload.description,
          profile_reviewed: true,
        })
        .in('id', researchIds)

      if (error) {
        setBaseSaving(false)
        setMessage(`Datos guardados en eventos, pero no en listado: ${error.message}`)
        return
      }
    }

    const newSeries = getEventSeriesSlug({ title: payload.title, type: payload.type, venue: payload.venue })
    setIsEditingBase(false)
    setBaseCoverFile(null)
    setBaseCoverPreview('')
    setBaseSaving(false)
    setMessage('Datos base de la ficha guardados')
    if (newSeries !== series) {
      router.replace(`/admin/eventos/${newSeries}`)
      return
    }
    loadEvents()
  }

  async function approveEvent(eventId: string) {
    const { error } = await supabase
      .from('events')
      .update({ status: 'approved', published: true, needs_review: false })
      .eq('id', eventId)

    if (error) {
      setMessage(`No se pudo aprobar: ${error.message}`)
      return
    }

    setMessage('Evento aprobado')
    loadEvents()
  }

  async function approveAllPendingEvents() {
    if (pendingEventsInSeries.length === 0) return

    const confirmed = window.confirm(`Aprobar ${pendingEventsInSeries.length} fecha${pendingEventsInSeries.length === 1 ? '' : 's'} pendiente${pendingEventsInSeries.length === 1 ? '' : 's'} de esta ficha?`)
    if (!confirmed) return

    setApprovingAll(true)
    const { error } = await supabase
      .from('events')
      .update({ status: 'approved', published: true, needs_review: false })
      .in('id', pendingEventsInSeries.map((event) => event.id))

    setApprovingAll(false)

    if (error) {
      setMessage(`No se pudieron aprobar todas: ${error.message}`)
      return
    }

    setMessage(`${pendingEventsInSeries.length} fecha${pendingEventsInSeries.length === 1 ? '' : 's'} aprobada${pendingEventsInSeries.length === 1 ? '' : 's'}`)
    loadEvents()
  }

  async function deleteEventDate(event: any) {
    const confirmed = window.confirm(`Eliminar la fecha ${formatDate(event.date)} de "${event.title}"?`)
    if (!confirmed) return

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', event.id)

    if (error) {
      setMessage(`No se pudo eliminar la fecha: ${error.message}`)
      return
    }

    if (editingEventId === event.id) {
      setEditingEventId('')
      setEditingExtrasDraft('')
    }
    setMessage(`Fecha eliminada: ${formatDate(event.date)}`)
    loadEvents()
  }

  async function setProfileReviewed(reviewed: boolean) {
    setReviewSaving(true)
    const eventIds = events.map((event) => event.id).filter(Boolean)
    const researchIds = researchItems.map((item) => item.id).filter(Boolean)

    if (eventIds.length > 0) {
      const { error } = await supabase
        .from('events')
        .update({ profile_reviewed: reviewed })
        .in('id', eventIds)

      if (error) {
        setReviewSaving(false)
        setMessage(`No se pudo actualizar la revision de la ficha: ${error.message}`)
        return
      }
    }

    if (researchIds.length > 0) {
      const { error } = await supabase
        .from('event_research_items')
        .update({ profile_reviewed: reviewed })
        .in('id', researchIds)

      if (error) {
        setReviewSaving(false)
        setMessage(`No se pudo actualizar la revision en listado: ${error.message}`)
        return
      }
    }

    setReviewSaving(false)
    setMessage(reviewed ? 'Ficha marcada como creada/revisada' : 'Ficha marcada por revisar')
    loadEvents()
  }

  async function updateEvent(event: any) {
    const buildPayload = (targetEvent: any, useTargetDate: boolean) => {
      const targetDate = useTargetDate ? targetEvent.date : event.date
      return {
        title: event.title,
        slug: generateSlug(event.title, targetDate),
        venue: event.venue,
        area: event.area,
        address: event.address,
        maps_url: event.maps_url || null,
        source_url: useTargetDate ? targetEvent.source_url || null : event.source_url || null,
        date: targetDate,
        start_time: event.start_time,
        end_time: event.end_time,
        type: event.type,
        music: Array.isArray(event.music) ? event.music : [event.music || 'Comercial'],
        audience: event.audience,
        price_from: event.price_from ? Number(event.price_from) : 0,
        cover: event.cover,
        description: event.description,
        perks: buildPerks(event),
        website_url: event.website_url || null,
        instagram_url: event.instagram_url || null,
        tiktok_url: event.tiktok_url || null,
      }
    }

    if (applyEditToSeries) {
      const updates = await Promise.all(
        events.map((targetEvent) =>
          supabase
            .from('events')
            .update(buildPayload(targetEvent, true))
            .eq('id', targetEvent.id)
        )
      )
      const failed = updates.find((result) => result.error)
      if (failed?.error) {
        setMessage(`No se pudieron guardar todas las fechas: ${failed.error.message}`)
        return
      }
    } else {
      const { error } = await supabase
        .from('events')
        .update(buildPayload(event, false))
        .eq('id', event.id)

      if (error) {
        setMessage(`No se pudo guardar: ${error.message}`)
        return
      }
    }

    setEditingEventId('')
    setEditingExtrasDraft('')
    setApplyEditToSeries(false)
    setMessage(applyEditToSeries ? 'Cambios aplicados a todas las fechas' : 'Fecha actualizada')
    loadEvents()
  }

  async function uploadEventCover(event: any, file: File | null) {
    if (!file) return

    setUploadingEventCoverId(event.id)
    const safeName = file.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9.]+/g, '-')
      .replace(/^-+|-+$/g, '')
    const fileName = `series/${series}/dates/${event.id}-${Date.now()}-${safeName}`

    const { error: uploadError } = await supabase.storage
      .from('events')
      .upload(fileName, file, { upsert: true })

    if (uploadError) {
      setUploadingEventCoverId('')
      setMessage(`No se pudo subir el cartel: ${uploadError.message}`)
      return
    }

    const { data } = supabase.storage.from('events').getPublicUrl(fileName)
    const { error } = await supabase
      .from('events')
      .update({ cover: data.publicUrl })
      .eq('id', event.id)

    setUploadingEventCoverId('')

    if (error) {
      setMessage(`Cartel subido, pero no se pudo guardar: ${error.message}`)
      return
    }

    setMessage(`Cartel actualizado para ${formatDate(event.date)}`)
    loadEvents()
  }

  async function generateDatedPosters() {
    const baseCover = mainEvent?.cover
    const datedEvents = events.filter((event) => event.date)

    if (!baseCover) {
      setMessage('Sube primero un cartel generico en Datos base')
      return
    }

    if (datedEvents.length === 0) {
      setMessage('Crea primero alguna fecha para generar carteles')
      return
    }

    const confirmed = window.confirm(`Generar cartel con fecha para ${datedEvents.length} evento${datedEvents.length === 1 ? '' : 's'} usando el cartel base?`)
    if (!confirmed) return

    setGeneratingPosters(true)

    try {
      const baseImage = await loadCanvasImage(baseCover)
      const generated: { id: string; cover: string }[] = []

      for (const event of datedEvents) {
        const canvas = document.createElement('canvas')
        canvas.width = 1080
        canvas.height = 1920
        const context = canvas.getContext('2d')
        if (!context) throw new Error('No se pudo preparar el cartel')

        const scale = Math.max(canvas.width / baseImage.width, canvas.height / baseImage.height)
        const width = baseImage.width * scale
        const height = baseImage.height * scale
        const x = (canvas.width - width) / 2
        const y = (canvas.height - height) / 2
        context.drawImage(baseImage, x, y, width, height)

        const gradient = context.createLinearGradient(0, 0, 0, 420)
        gradient.addColorStop(0, 'rgba(2, 6, 23, 0.34)')
        gradient.addColorStop(0.72, 'rgba(2, 6, 23, 0.16)')
        gradient.addColorStop(1, 'rgba(2, 6, 23, 0)')
        context.fillStyle = gradient
        context.fillRect(0, 0, canvas.width, 420)

        context.fillStyle = 'rgba(244, 63, 94, 0.78)'
        context.roundRect(270, 255, 540, 88, 26)
        context.fill()

        context.fillStyle = 'rgba(2, 6, 23, 0.18)'
        context.roundRect(284, 267, 512, 64, 20)
        context.fill()

        context.fillStyle = '#ffffff'
        context.textAlign = 'center'
        context.textBaseline = 'middle'
        context.font = '900 25px Arial'
        context.fillText(formatPosterDate(event.date).toUpperCase(), 540, 290)

        context.font = '800 18px Arial'
        const timeText = [formatTime(event.start_time), formatTime(event.end_time)].filter(Boolean).join(' - ')
        const typeText = String(event.type || mainEvent.type || 'Evento').toUpperCase()
        context.fillText([typeText, timeText].filter(Boolean).join(' · '), 540, 318)

        const blob = await canvasToBlob(canvas)
        const fileName = `series/${series}/generated/${event.id}-${Date.now()}.jpg`
        const { error: uploadError } = await supabase.storage
          .from('events')
          .upload(fileName, blob, { contentType: 'image/jpeg', upsert: true })

        if (uploadError) throw uploadError

        const { data } = supabase.storage.from('events').getPublicUrl(fileName)
        generated.push({ id: event.id, cover: data.publicUrl })
      }

      const updates = await Promise.all(
        generated.map((poster) =>
          supabase
            .from('events')
            .update({ cover: poster.cover, image_status: 'generated' })
            .eq('id', poster.id)
        )
      )
      const failed = updates.find((result) => result.error)
      if (failed?.error) throw failed.error

      setMessage(`${generated.length} cartel${generated.length === 1 ? '' : 'es'} con fecha generado${generated.length === 1 ? '' : 's'}`)
      loadEvents()
    } catch (error: any) {
      setMessage(`No se pudieron generar los carteles: ${error.message || 'revisa que el cartel base este subido a Tardea'}`)
    } finally {
      setGeneratingPosters(false)
    }
  }

  function toggleDuplicateDate(date: string) {
    const exists = events.some((item) => item.date === date)
    if (exists) {
      setMessage(`La fecha ${formatDate(date)} ya esta creada`)
      return
    }

    setDuplicateDates((current) =>
      current.includes(date)
        ? current.filter((item) => item !== date)
        : [...current, date].sort()
    )
  }

  async function duplicateEvent(event: any) {
    if (duplicateDates.length === 0) {
      setMessage('Selecciona una o varias fechas para duplicar')
      return
    }

    const title = event.title || mainEvent.title || 'Evento pendiente'
    const type = event.type || mainEvent.type || 'Tardeo'
    const area = event.area || mainEvent.area || 'Madrid'
    const musicList = getMusicList(event.music || mainEvent.music)
    const rowsToInsert = duplicateDates.map((date) => ({
      title,
      slug: generateSlug(title, date),
      venue: event.venue || mainEvent.venue || 'Pendiente de revisar',
      area,
      address: event.address || mainEvent.address || event.venue || mainEvent.venue || area,
      maps_url: event.maps_url || mainEvent.maps_url || null,
      source_url: event.source_url || mainEvent.source_url || null,
      date,
      start_time: event.start_time || mainEvent.start_time || '18:00',
      end_time: event.end_time || mainEvent.end_time || '23:00',
      type,
      music: musicList.length ? musicList : ['Comercial'],
      audience: event.audience || mainEvent.audience || 'Mixto',
      price_from: event.price_from ? Number(event.price_from) : Number(mainEvent.price_from || 0),
      cover: event.cover || mainEvent.cover || null,
      reel_url: event.reel_url || mainEvent.reel_url || null,
      featured: false,
      description: event.description || mainEvent.description || event.notes || mainEvent.notes || 'Evento cargado desde ficha interna de TARDEA. Pendiente de revision antes de publicar.',
      perks: [type, area, ...musicList].filter(Boolean),
      status: 'pending',
      published: false,
      source_name: event.source_name || mainEvent.source_name || 'Ficha interna',
      external_id: `${event.source_url || mainEvent.source_url || title}-${date}`,
      imported_by_agent: true,
      image_status: event.image_status || mainEvent.image_status || 'provisional',
      needs_review: true,
      website_url: event.website_url || mainEvent.website_url || null,
      instagram_url: event.instagram_url || mainEvent.instagram_url || null,
      tiktok_url: event.tiktok_url || mainEvent.tiktok_url || null,
      profile_reviewed: event.profile_reviewed || mainEvent.profile_reviewed || false,
    }))
    const { error } = await supabase.from('events').insert(rowsToInsert)

    if (error) {
      setMessage(`No se pudo duplicar: ${error.message}`)
      return
    }

    const createdCount = duplicateDates.length
    setDuplicateDates([])
    setMessage(`${createdCount} fecha${createdCount === 1 ? '' : 's'} creada${createdCount === 1 ? '' : 's'} como pendiente${createdCount === 1 ? '' : 's'}`)
    loadEvents()
  }

  async function extractDatesIntoSeries(sourceUrl?: string) {
    const url = (sourceUrl || extractUrl).trim()
    if (!url) {
      setMessage('Guarda primero una web o tiquetera en Datos base, o pega un enlace manualmente')
      return
    }

    setExtractingDates(true)
    setMessage('')

    try {
      const response = await fetch('/api/scout/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const data = await response.json()

      if (!response.ok) {
        setMessage(data.error || 'No se pudo leer ese enlace')
        return
      }

      const extractedEvents = Array.isArray(data.events) && data.events.length > 0 ? data.events : [data]
      const datedEvents = extractedEvents.filter((event: any) => event.date)
      const newEvents = datedEvents.filter((event: any) => !existingDates.has(event.date))
      const existingEventsToUpdate = datedEvents.filter((event: any) => existingDates.has(event.date) && (event.sourceUrl || event.source_url))

      const baseTitle = mainEvent.title || data.title || 'Evento pendiente'
      const baseType = mainEvent.type || data.type || 'Tardeo'
      const baseArea = mainEvent.area || data.area || 'Madrid'
      const baseMusic = getMusicList(mainEvent.music || data.music)

      const rowsToInsert = newEvents.map((event: any) => ({
        title: baseTitle,
        slug: generateSlug(baseTitle, event.date),
        venue: event.venue || data.venue || mainEvent.venue || 'Pendiente de revisar',
        area: event.area || data.area || baseArea,
        address: event.address || data.address || event.venue || data.venue || mainEvent.address || mainEvent.venue || baseArea,
        maps_url: event.mapsUrl || event.maps_url || data.mapsUrl || data.maps_url || mainEvent.maps_url || null,
        source_url: event.sourceUrl || event.source_url || url,
        date: event.date,
        start_time: event.startTime || event.start_time || mainEvent.start_time || data.startTime || '18:00',
        end_time: event.endTime || event.end_time || mainEvent.end_time || data.endTime || '23:00',
        type: baseType,
        music: baseMusic.length ? baseMusic : ['Comercial'],
        audience: mainEvent.audience || data.audience || 'Mixto',
        price_from: mainEvent.price_from ? Number(mainEvent.price_from) : Number(data.priceFrom || data.price_from || 0),
        cover: event.cover || event.image || event.imageUrl || mainEvent.cover || data.cover || null,
        reel_url: mainEvent.reel_url || null,
        featured: false,
        description: mainEvent.description || data.description || 'Evento importado desde enlace. Pendiente de revision antes de publicar.',
        perks: [baseType, baseArea, ...baseMusic].filter(Boolean),
        status: 'pending',
        published: false,
        source_name: event.sourceName || event.source_name || data.sourceName || data.source_name || 'Fuente externa',
        external_id: `${event.sourceUrl || event.source_url || url}-${event.date}`,
        imported_by_agent: true,
        image_status: mainEvent.image_status || 'provisional',
        needs_review: true,
        website_url: mainEvent.website_url || data.website_url || null,
        instagram_url: mainEvent.instagram_url || data.instagram_url || null,
        tiktok_url: mainEvent.tiktok_url || data.tiktok_url || null,
        profile_reviewed: mainEvent.profile_reviewed || false,
      }))

      if (rowsToInsert.length > 0) {
        const { error } = await supabase.from('events').insert(rowsToInsert)

        if (error) {
          setMessage(`No se pudieron crear las fechas: ${error.message}`)
          return
        }
      }

      if (existingEventsToUpdate.length > 0) {
        const updates = await Promise.all(
          existingEventsToUpdate.flatMap((extractedEvent: any) =>
            events
              .filter((currentEvent) => {
                const sameDate = currentEvent.date === extractedEvent.date
                const extractedVenue = (extractedEvent.venue || '').trim().toLowerCase()
                const sameVenue = !extractedVenue || (currentEvent.venue || '').trim().toLowerCase() === extractedVenue
                return sameDate && sameVenue
              })
              .map((currentEvent) =>
                supabase
                  .from('events')
                  .update({
                    source_url: extractedEvent.sourceUrl || extractedEvent.source_url || currentEvent.source_url || url,
                    source_name: extractedEvent.sourceName || extractedEvent.source_name || data.sourceName || data.source_name || currentEvent.source_name || 'Fuente externa',
                    external_id: `${extractedEvent.sourceUrl || extractedEvent.source_url || url}-${extractedEvent.date}`,
                    start_time: extractedEvent.startTime || extractedEvent.start_time || currentEvent.start_time,
                    end_time: extractedEvent.endTime || extractedEvent.end_time || currentEvent.end_time,
                    cover: extractedEvent.cover || currentEvent.cover,
                  })
                  .eq('id', currentEvent.id)
              )
          )
        )
        const failed = updates.find((result) => result.error)
        if (failed?.error) {
          setMessage(`Fechas creadas, pero no se pudieron corregir algunos enlaces: ${failed.error.message}`)
          return
        }
      }

      if (rowsToInsert.length === 0 && existingEventsToUpdate.length === 0) {
        setMessage('No se detectaron fechas claras en ese enlace')
        return
      }

      if (!sourceUrl) setExtractUrl('')
      setMessage([
        rowsToInsert.length > 0 ? `${rowsToInsert.length} fecha${rowsToInsert.length === 1 ? '' : 's'} creada${rowsToInsert.length === 1 ? '' : 's'}` : '',
        existingEventsToUpdate.length > 0 ? `${existingEventsToUpdate.length} enlace${existingEventsToUpdate.length === 1 ? '' : 's'} de tiquetera corregido${existingEventsToUpdate.length === 1 ? '' : 's'}` : '',
      ].filter(Boolean).join(' y '))
      loadEvents()
    } catch (error: any) {
      setMessage(`No se pudo extraer desde el enlace: ${error.message || 'revisa que el enlace sea publico'}`)
    } finally {
      setExtractingDates(false)
    }
  }

  function updateEditingEvent(field: string, value: any) {
    setEvents((current) =>
      current.map((event) =>
        event.id === editingEventId ? { ...event, [field]: value } : event
      )
    )
  }

  function toggleEditingMusic(style: string) {
    if (!editingEventId) return

    setEvents((current) =>
      current.map((event) => {
        if (event.id !== editingEventId) return event
        const currentMusic = getMusicList(event.music)
        const nextMusic = currentMusic.includes(style)
          ? currentMusic.filter((item) => item !== style)
          : [...currentMusic, style]
        return { ...event, music: nextMusic.length ? nextMusic : ['Comercial'] }
      })
    )
  }

  function updateEditingExtras(value: string) {
    setEditingExtrasDraft(value)
    setEvents((current) =>
      current.map((event) =>
        event.id === editingEventId
          ? { ...event, perks: buildPerksWithExtras(event, value) }
          : event
      )
    )
  }

  function startEditingEvent(eventId: string) {
    const eventToEdit = events.find((event) => event.id === eventId)
    setApplyEditToSeries(false)
    setEditingExtrasDraft(eventToEdit ? getEventExtras(eventToEdit).join(', ') : '')
    setEditingEventId(eventId)
  }

  if (loading) {
    return (
      <main className="container-page py-16">
        <p className="text-slate-400">Cargando ficha del evento...</p>
      </main>
    )
  }

  if (!mainEvent) {
    return (
      <main className="container-page py-16">
        <Link href="/admin/fichas" className="text-sm font-bold uppercase tracking-[0.18em] text-brand-500">← Volver a fichas</Link>
        <h1 className="mt-6 text-3xl font-bold">Evento no encontrado</h1>
      </main>
    )
  }

  return (
    <main className="container-page py-10">
      <Link href="/admin/fichas" className="text-sm font-bold uppercase tracking-[0.18em] text-brand-500">← Volver a fichas</Link>

      <section className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {mainEvent.cover && (
              <img src={mainEvent.cover} alt="" className="h-16 w-16 rounded-2xl object-cover" />
            )}
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-500">Ficha interna</p>
              <h1 className="text-4xl font-black">{mainEvent.title}</h1>
              <p className="mt-2 text-slate-400">
                {[mainEvent.venue, mainEvent.area, mainEvent.type].filter(Boolean).join(' - ')}
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
              <p className="text-xs text-slate-500">Total fechas</p>
              <p className="text-3xl font-black">{events.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
              <p className="text-xs text-slate-500">Aprobadas</p>
              <p className="text-3xl font-black text-emerald-300">{events.filter((event) => event.status === 'approved').length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
              <p className="text-xs text-slate-500">Pendientes</p>
              <p className="text-3xl font-black text-yellow-300">{events.filter((event) => event.status !== 'approved').length}</p>
            </div>
          </div>
        </div>

        <aside className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold">Datos base</h2>
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setProfileReviewed(!isProfileReviewed)}
                disabled={reviewSaving}
                className={`rounded-full px-3 py-1.5 text-xs font-bold disabled:opacity-60 ${isProfileReviewed ? 'bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/20' : 'bg-yellow-500/15 text-yellow-100 hover:bg-yellow-500/20'}`}
              >
                {reviewSaving ? 'Guardando' : isProfileReviewed ? 'Revisada' : 'Marcar revisada'}
              </button>
              <button type="button" onClick={openBaseEditor} className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-bold text-slate-200 hover:border-brand-500/60">
                Editar
              </button>
            </div>
          </div>
          <div className="mt-4 space-y-2 text-sm text-slate-300">
            <p><span className="text-slate-500">Tipo:</span> {mainEvent.type || 'Tardeo'}</p>
            <p><span className="text-slate-500">Musica:</span> {Array.isArray(mainEvent.music) ? mainEvent.music.join(', ') : mainEvent.music || 'Comercial'}</p>
            <p><span className="text-slate-500">Edad:</span> {mainEvent.audience || 'Mixto'}</p>
            <p><span className="text-slate-500">Precio:</span> Desde {mainEvent.price_from || 0} EUR</p>
            <p><span className="text-slate-500">Fuente:</span> {mainEvent.source_name || 'No indicada'}</p>
          </div>
          {mainEvent.source_url && (
            <a
              href={mainEvent.source_url}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex rounded-full border border-brand-500/40 px-4 py-2 text-xs font-bold text-brand-100 hover:border-brand-500 hover:text-white"
            >
              Ver fuente original
            </a>
          )}
          {mainEvent.description && (
            <p className="mt-4 text-sm leading-6 text-slate-400">{mainEvent.description}</p>
          )}
        </aside>
      </section>

      {message && (
        <div className="mt-6 rounded-2xl border border-brand-500/30 bg-brand-500/10 p-4 text-sm text-brand-100">
          {message}
        </div>
      )}

      {isEditingBase && (
        <section className="mt-10 rounded-3xl border border-white/10 bg-slate-900/80 p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-500">Editar ficha</p>
              <h2 className="text-2xl font-bold">Datos base y enlaces</h2>
              <p className="mt-1 text-sm text-slate-400">Estos cambios se aplican a todas las fechas de esta ficha.</p>
            </div>
            <button type="button" onClick={closeBaseEditor} className="text-sm font-semibold text-slate-400 hover:text-white">Cerrar</button>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <input className="input" value={baseForm.title || ''} onChange={(event) => updateBaseForm('title', event.target.value)} placeholder="Nombre del evento" />
            <select className="select" value={baseForm.type || 'Tardeo'} onChange={(event) => updateBaseForm('type', event.target.value)}>
              {EVENT_TYPE_OPTIONS.map((option) => <option key={option}>{option}</option>)}
            </select>
            <input className="input" value={baseForm.venue || ''} onChange={(event) => updateBaseForm('venue', event.target.value)} placeholder="Lugar" />
            <select className="select" value={getAreaSelectValue(baseForm.area || '')} onChange={(event) => updateBaseForm('area', getAreaFromSelect(event.target.value, baseForm.area || ''))}>
              {AREA_OPTIONS.map((option) => <option key={option}>{option}</option>)}
            </select>
            {getAreaSelectValue(baseForm.area || '') === CUSTOM_AREA_OPTION && (
              <input
                className="input"
                value={baseForm.area === CUSTOM_AREA_OPTION ? '' : baseForm.area || ''}
                onChange={(event) => updateBaseForm('area', event.target.value)}
                placeholder="Municipio o zona: Mostoles, Leganes, Pozuelo..."
              />
            )}
            <input className="input" value={baseForm.address || ''} onChange={(event) => updateBaseForm('address', event.target.value)} placeholder="Direccion" />
            <input className="input" value={baseForm.maps_url || ''} onChange={(event) => updateBaseForm('maps_url', event.target.value)} placeholder="Link de Google Maps" />
            <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4 lg:col-span-2">
              <p className="mb-3 text-sm font-bold text-white">Musica</p>
              <div className="flex flex-wrap gap-2">
                {MUSIC_OPTIONS.map((style) => {
                  const selectedMusic = Array.isArray(baseForm.music)
                    ? baseForm.music
                    : (baseForm.music || '').split(',').map((item: string) => item.trim()).filter(Boolean)
                  const isSelected = selectedMusic.includes(style)
                  return (
                    <button
                      key={style}
                      type="button"
                      onClick={() => toggleBaseMusic(style)}
                      className={`rounded-full px-3 py-2 text-xs font-bold transition ${
                        isSelected
                          ? 'bg-brand-500 text-white'
                          : 'border border-white/10 bg-slate-800 text-slate-200 hover:border-brand-500/60'
                      }`}
                    >
                      {style}
                    </button>
                  )
                })}
              </div>
            </div>
            <select className="select" value={baseForm.audience || 'Mixto'} onChange={(event) => updateBaseForm('audience', event.target.value)}>
              {['Mixto', ...AUDIENCE_OPTIONS].map((option) => <option key={option}>{option}</option>)}
            </select>
            <input className="input" value={baseForm.price_from || ''} onChange={(event) => updateBaseForm('price_from', event.target.value)} placeholder="Precio desde" />
            <input className="input" value={baseForm.website_url || ''} onChange={(event) => updateBaseForm('website_url', event.target.value)} placeholder="Web oficial" />
            <input className="input" value={baseForm.source_url || ''} onChange={(event) => updateBaseForm('source_url', event.target.value)} placeholder="Tiquetera" />
            <input className="input" value={baseForm.instagram_url || ''} onChange={(event) => updateBaseForm('instagram_url', event.target.value)} placeholder="Instagram" />
            <input className="input" value={baseForm.tiktok_url || ''} onChange={(event) => updateBaseForm('tiktok_url', event.target.value)} placeholder="TikTok" />
            <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4 lg:col-span-2">
              <div className="grid gap-4 md:grid-cols-[140px_1fr] md:items-center">
                <div className="aspect-square overflow-hidden rounded-2xl bg-slate-950">
                  {baseCoverPreview ? (
                    <img src={baseCoverPreview} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center px-3 text-center text-xs font-semibold text-slate-600">
                      Sin cartel
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Cartel principal</p>
                  <p className="mt-1 text-xs text-slate-500">Sube el cartel desde tu ordenador. Se guardara como imagen base de todas las fechas de esta ficha.</p>
                  <label className="mt-3 inline-flex cursor-pointer rounded-full border border-white/10 px-4 py-2 text-xs font-bold text-slate-200 hover:border-brand-500/60">
                    Subir cartel
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => handleBaseCoverChange(event.target.files?.[0] || null)}
                    />
                  </label>
                  {baseCoverFile && (
                    <p className="mt-2 truncate text-xs text-brand-200">{baseCoverFile.name}</p>
                  )}
                </div>
              </div>
            </div>
            <textarea className="input lg:col-span-2" value={baseForm.description || ''} onChange={(event) => updateBaseForm('description', event.target.value)} placeholder="Descripcion base de la ficha" />
          </div>

          <button type="button" onClick={saveBaseProfile} disabled={baseSaving} className="mt-4 rounded-full bg-brand-500 px-5 py-3 text-sm font-bold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60">
            {baseSaving ? 'Guardando...' : 'Guardar ficha'}
          </button>
        </section>
      )}

      <section className="mt-10">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Próximas fechas</h2>
            <p className="mt-1 text-sm text-slate-400">Edita, aprueba o duplica fechas desde una sola ficha.</p>
          </div>
          <div className="flex flex-col gap-3 sm:items-end">
            {events.some((event) => event.date) && (
              <button
                type="button"
                onClick={generateDatedPosters}
                disabled={generatingPosters}
                className="rounded-full border border-brand-500/40 px-4 py-2 text-xs font-bold text-brand-100 hover:border-brand-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {generatingPosters ? 'Generando carteles...' : `Generar carteles con fecha (${events.filter((event) => event.date).length})`}
              </button>
            )}
            {pendingEventsInSeries.length > 0 && (
              <button
                type="button"
                onClick={approveAllPendingEvents}
                disabled={approvingAll}
                className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {approvingAll ? 'Aprobando...' : `Aprobar todas (${pendingEventsInSeries.length})`}
              </button>
            )}
          </div>
          {mainEvent && (
            <div className="w-full rounded-2xl border border-white/10 bg-slate-950/40 p-3 sm:max-w-[440px]">
              <div className="mb-4 rounded-2xl border border-brand-500/20 bg-brand-500/5 p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-200">Extraer fechas</p>
                    <p className="mt-1 text-[11px] leading-4 text-slate-500">Busca novedades en la fuente guardada de esta ficha.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => extractDatesIntoSeries(monitorUrl)}
                    disabled={extractingDates || !monitorUrl}
                    className="rounded-full border border-brand-500/40 px-4 py-2 text-xs font-bold text-brand-100 hover:border-brand-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {extractingDates ? 'Buscando...' : 'Buscar nuevas fechas'}
                  </button>
                </div>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                  <input
                    className="input min-h-0 flex-1 px-3 py-2 text-xs"
                    value={extractUrl}
                    onChange={(event) => setExtractUrl(event.target.value)}
                    placeholder={monitorUrl ? 'Pega otra fuente si quieres revisar una distinta' : 'Pega Linktree, web o tiquetera'}
                  />
                  <button
                    type="button"
                    onClick={() => extractDatesIntoSeries()}
                    disabled={extractingDates}
                    className="rounded-full bg-brand-500 px-4 py-2 text-xs font-bold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {extractingDates ? 'Leyendo...' : 'Importar'}
                  </button>
                </div>
                <p className="mt-2 text-[11px] leading-4 text-slate-500">Crea solo fechas nuevas en esta ficha. Las repetidas se saltan o corrigen enlace/cartel.</p>
              </div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <button type="button" onClick={() => setCalendarMonth((current) => moveMonth(current, -1))} className="rounded-full border border-white/10 px-3 py-1 text-sm font-bold text-slate-300 hover:border-brand-500/60">
                  ←
                </button>
                <p className="text-sm font-black capitalize text-white">{formatCalendarMonth(calendarMonth)}</p>
                <button type="button" onClick={() => setCalendarMonth((current) => moveMonth(current, 1))} className="rounded-full border border-white/10 px-3 py-1 text-sm font-bold text-slate-300 hover:border-brand-500/60">
                  →
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day) => <span key={day}>{day}</span>)}
              </div>

              <div className="mt-2 grid grid-cols-7 gap-1">
                {calendarDays.map((date, index) => {
                  if (!date) return <span key={`blank-${index}`} className="h-8" />
                  const dateKey = formatCalendarDate(date)
                  const isExisting = existingDates.has(dateKey)
                  const isSelected = duplicateDates.includes(dateKey)

                  return (
                    <button
                      key={dateKey}
                      type="button"
                      disabled={isExisting}
                      onClick={() => toggleDuplicateDate(dateKey)}
                      className={`h-8 rounded-full text-xs font-bold transition ${
                        isExisting
                          ? 'cursor-not-allowed bg-white/5 text-slate-600 line-through'
                          : isSelected
                            ? 'bg-brand-500 text-white shadow-[0_0_0_2px_rgba(244,63,94,0.25)]'
                            : 'text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {date.getDate()}
                    </button>
                  )
                })}
              </div>

              {duplicateDates.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {duplicateDates.map((date) => (
                    <button
                      key={date}
                      type="button"
                      onClick={() => toggleDuplicateDate(date)}
                      className="rounded-full bg-brand-500/15 px-2.5 py-1 text-[11px] font-bold text-brand-100 hover:bg-red-500/20 hover:text-red-100"
                    >
                      {formatDate(date)} x
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-3 flex items-center justify-between gap-2">
                <button type="button" onClick={() => setDuplicateDates([])} className={`text-[11px] font-semibold text-slate-500 hover:text-white ${duplicateDates.length === 0 ? 'invisible' : ''}`}>
                  Limpiar
                </button>
                <button type="button" onClick={() => duplicateEvent(mainEvent)} className="rounded-full bg-brand-500 px-4 py-2 text-xs font-bold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50" disabled={duplicateDates.length === 0}>
                  Crear fecha{duplicateDates.length === 1 ? '' : 's'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          {websiteUrl && (
            <a href={websiteUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs font-bold text-slate-200 hover:border-brand-500/60">
              <WebIcon /> Web
            </a>
          )}
          {instagramUrl && (
            <a href={instagramUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs font-bold text-slate-200 hover:border-brand-500/60">
              <InstagramIcon /> Instagram
            </a>
          )}
          {tiktokUrl && (
            <a href={tiktokUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs font-bold text-slate-200 hover:border-brand-500/60">
              <TikTokIcon /> TikTok
            </a>
          )}
          {ticketUrl && (
            <a href={ticketUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs font-bold text-slate-200 hover:border-brand-500/60">
              <TicketIcon /> Tiquetera
            </a>
          )}
        </div>

        {upcomingEvents.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-slate-400">
            Esta ficha todavia no tiene fechas creadas en Admin. Selecciona una o varias fechas en el calendario de arriba para crear los eventos.
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {upcomingEvents.map((event) => (
            <article
              key={event.id}
              role="link"
              tabIndex={0}
              onClick={() => router.push(`/eventos/${event.slug}?from=admin`)}
              onKeyDown={(keyEvent) => {
                if (keyEvent.key === 'Enter' || keyEvent.key === ' ') {
                  keyEvent.preventDefault()
                  router.push(`/eventos/${event.slug}?from=admin`)
                }
              }}
              className="group relative aspect-[9/16] cursor-pointer overflow-hidden rounded-3xl border border-white/10 bg-slate-900 outline-none transition hover:border-brand-500/50 focus:border-brand-500/70"
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105"
                style={{
                  backgroundImage: `url(${event.cover || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80'})`,
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/5" />

              <div className="relative z-10 flex h-full flex-col justify-between p-3">
                <div className="flex flex-wrap gap-1.5">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${event.status === 'approved' ? 'bg-emerald-500/25 text-emerald-100' : 'bg-yellow-500/25 text-yellow-100'}`}>
                    {event.status === 'approved' ? 'Aprobado' : 'Pendiente'}
                  </span>
                  <span className="rounded-full bg-black/35 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur">
                    {event.type || 'Tardeo'}
                  </span>
                </div>

                <div>
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">{formatDate(event.date)}</span>
                    <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">
                      {formatTime(event.start_time)} - {formatTime(event.end_time)}
                    </span>
                  </div>
                  <h3 className="line-clamp-2 text-base font-black leading-tight text-white">{event.title}</h3>
                  <p className="mt-1 line-clamp-1 text-xs font-semibold text-slate-200">{event.venue || mainEvent.venue}</p>
                  {getEventExtras(event).length > 0 && (
                    <p className="mt-1 line-clamp-2 text-[11px] font-semibold leading-4 text-brand-100">
                      {getEventExtras(event).join(' · ')}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-1.5" onClick={(clickEvent) => clickEvent.stopPropagation()}>
                  <label className={`cursor-pointer rounded-full border border-white/10 px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:border-brand-500/60 ${uploadingEventCoverId === event.id ? 'pointer-events-none opacity-60' : ''}`}>
                    {uploadingEventCoverId === event.id ? 'Subiendo' : 'Subir cartel'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onClick={(clickEvent) => clickEvent.stopPropagation()}
                      onChange={(inputEvent) => uploadEventCover(event, inputEvent.target.files?.[0] || null)}
                    />
                  </label>
                  <button type="button" onClick={() => startEditingEvent(event.id)} className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:border-brand-500/60">
                    Editar
                  </button>
                  {event.status !== 'approved' && (
                    <button type="button" onClick={() => approveEvent(event.id)} className="rounded-full bg-brand-500 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-brand-600">
                      Aprobar
                    </button>
                  )}
                  <button type="button" onClick={() => deleteEventDate(event)} className="rounded-full border border-red-400/30 px-2.5 py-1 text-[11px] font-semibold text-red-200 hover:border-red-400/70 hover:text-white">
                    Eliminar
                  </button>
                  {event.source_url && (
                    <a
                      href={event.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex rounded-full border border-white/10 px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:border-brand-500/60 hover:text-white"
                    >
                      Revisar tiquetera
                    </a>
                  )}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {editingEvent && (
        <section className="mt-10 rounded-3xl border border-white/10 bg-slate-900/80 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Editar fecha</h2>
            <button type="button" onClick={() => {
              setApplyEditToSeries(false)
              setEditingEventId('')
              setEditingExtrasDraft('')
            }} className="text-sm font-semibold text-slate-400 hover:text-white">Cerrar</button>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <input className="input" value={editingEvent.title || ''} onChange={(event) => updateEditingEvent('title', event.target.value)} placeholder="Nombre" />
            <input className="input" value={editingEvent.source_url || ''} onChange={(event) => updateEditingEvent('source_url', event.target.value)} placeholder="Link entradas" />
            <select className="select" value={editingEvent.type || 'Tardeo'} onChange={(event) => updateEditingEvent('type', event.target.value)}>
              {EVENT_TYPE_OPTIONS.map((option) => <option key={option}>{option}</option>)}
            </select>
            <select className="select" value={editingEvent.audience || 'Mixto'} onChange={(event) => updateEditingEvent('audience', event.target.value)}>
              {['Mixto', ...AUDIENCE_OPTIONS].map((option) => <option key={option}>{option}</option>)}
            </select>
            <input className="input" value={editingEvent.price_from || ''} onChange={(event) => updateEditingEvent('price_from', event.target.value)} placeholder="Precio desde" />
            <input className="input" value={editingEvent.venue || ''} onChange={(event) => updateEditingEvent('venue', event.target.value)} placeholder="Lugar" />
            <select className="select" value={getAreaSelectValue(editingEvent.area || '')} onChange={(event) => updateEditingEvent('area', getAreaFromSelect(event.target.value, editingEvent.area || ''))}>
              {AREA_OPTIONS.map((option) => <option key={option}>{option}</option>)}
            </select>
            {getAreaSelectValue(editingEvent.area || '') === CUSTOM_AREA_OPTION && (
              <input
                className="input"
                value={editingEvent.area === CUSTOM_AREA_OPTION ? '' : editingEvent.area || ''}
                onChange={(event) => updateEditingEvent('area', event.target.value)}
                placeholder="Municipio o zona: Mostoles, Leganes, Pozuelo..."
              />
            )}
            <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4 lg:col-span-2">
              <p className="mb-3 text-sm font-bold text-white">Musica</p>
              <div className="flex flex-wrap gap-2">
                {MUSIC_OPTIONS.map((style) => {
                  const selectedMusic = getMusicList(editingEvent.music)
                  const isSelected = selectedMusic.includes(style)
                  return (
                    <button
                      key={style}
                      type="button"
                      onClick={() => toggleEditingMusic(style)}
                      className={`rounded-full px-3 py-2 text-xs font-bold transition ${
                        isSelected
                          ? 'bg-brand-500 text-white'
                          : 'border border-white/10 bg-slate-800 text-slate-200 hover:border-brand-500/60'
                      }`}
                    >
                      {style}
                    </button>
                  )
                })}
              </div>
            </div>
            <input
              type="date"
              className="input disabled:cursor-not-allowed disabled:opacity-50"
              value={editingEvent.date || ''}
              onChange={(event) => updateEditingEvent('date', event.target.value)}
              disabled={applyEditToSeries}
            />
            <div className="grid grid-cols-2 gap-3">
              <input type="time" className="input" value={editingEvent.start_time || '18:00'} onChange={(event) => updateEditingEvent('start_time', event.target.value)} />
              <input type="time" className="input" value={editingEvent.end_time || '23:00'} onChange={(event) => updateEditingEvent('end_time', event.target.value)} />
            </div>
            <input className="input lg:col-span-2" value={editingEvent.maps_url || ''} onChange={(event) => updateEditingEvent('maps_url', event.target.value)} placeholder="Google Maps" />
            <input className="input lg:col-span-2" value={editingEvent.cover || ''} onChange={(event) => updateEditingEvent('cover', event.target.value)} placeholder="URL cartel" />
            <input
              className="input lg:col-span-2"
              value={editingExtrasDraft}
              onChange={(event) => updateEditingExtras(event.target.value)}
              placeholder="Extras / artistas: DJ invitado, banda, directo, saxofonista..."
            />
            <textarea className="input lg:col-span-2" value={editingEvent.description || ''} onChange={(event) => updateEditingEvent('description', event.target.value)} placeholder="Descripcion" />
          </div>

          <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-slate-950/35 p-4 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={applyEditToSeries}
              onChange={(event) => setApplyEditToSeries(event.target.checked)}
              className="mt-1 h-4 w-4 accent-brand-500"
            />
            <span>
              <span className="block font-bold text-white">Aplicar estos cambios a todas las fechas de esta ficha</span>
              <span className="mt-1 block text-xs leading-5 text-slate-500">La fecha y el enlace de tiquetera de cada dia se mantienen. Se actualizan datos como hora, precio, lugar, cartel, extras y descripcion.</span>
            </span>
          </label>

          <button type="button" onClick={() => updateEvent(editingEvent)} className="mt-4 rounded-full bg-brand-500 px-5 py-3 text-sm font-bold text-white hover:bg-brand-600">
            {applyEditToSeries ? 'Guardar en todas las fechas' : 'Guardar cambios'}
          </button>
        </section>
      )}

      {pastEvents.length > 0 && (
        <section className="mt-12">
          <details className="rounded-2xl border border-white/10 bg-slate-950/35">
            <summary className="cursor-pointer list-none px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500 hover:text-slate-300">
              Fechas pasadas ({pastEvents.length})
            </summary>
            <div className="border-t border-white/10">
              {pastEvents.map((event) => (
                <div key={event.id} className="flex flex-col gap-2 border-b border-white/5 px-4 py-2 text-xs last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-semibold text-slate-300">{formatDate(event.date)} · {formatTime(event.start_time)} - {formatTime(event.end_time)} · {event.title}</p>
                  <div className="flex items-center gap-3">
                    <Link href={`/eventos/${event.slug}?from=admin`} className="font-semibold text-brand-500">Vista</Link>
                    <button type="button" onClick={() => deleteEventDate(event)} className="font-semibold text-red-300 hover:text-white">Eliminar</button>
                  </div>
                </div>
              ))}
            </div>
          </details>
        </section>
      )}
    </main>
  )
}
