'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  Euro,
  MapPin,
  Music4,
  Sparkles,
  Users,
} from 'lucide-react'
import { Footer } from '@/components/Footer'
import { Navbar } from '@/components/Navbar'
import { supabase } from '@/lib/supabase'

function WhatsAppIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      <path d="M16 3.2A12.6 12.6 0 0 0 5.3 22.5L4 29l6.7-1.2A12.6 12.6 0 1 0 16 3.2Zm0 2.3a10.3 10.3 0 0 1 8.8 15.7 10.3 10.3 0 0 1-13.4 4.2l-.4-.2-4 .7.8-3.8-.2-.4A10.3 10.3 0 0 1 16 5.5Zm-4.4 5.2c-.2 0-.5 0-.8.4-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.2 4.9 4.4 2.4 1 2.9.8 3.4.8.5 0 1.7-.7 1.9-1.4.2-.7.2-1.3.2-1.4 0-.1-.2-.2-.5-.4l-1.8-.9c-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1a8.4 8.4 0 0 1-2.5-1.5 9.4 9.4 0 0 1-1.7-2.1c-.2-.3 0-.5.1-.6l.5-.6.3-.5c.1-.2 0-.4 0-.5l-.8-1.9c-.2-.5-.5-.5-.7-.5h-.3Z" />
    </svg>
  )
}

function normalizeEventText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function getProfileMatchScore(event: any, profile: any) {
  const eventTitle = normalizeEventText(event.title || '')
  const eventVenue = normalizeEventText(event.venue || '')
  const eventArea = normalizeEventText(event.area || '')
  const profileName = normalizeEventText(profile.name || '')
  const profileSlug = normalizeEventText(profile.slug || '')
  const profileVenue = normalizeEventText(profile.venue_name || '')
  const profileArea = normalizeEventText(profile.area || '')

  let score = 0

  if (eventTitle && profileName === eventTitle) score += 10
  else if (eventTitle && profileName && profileName.includes(eventTitle)) score += 7
  else if (eventTitle && profileName && eventTitle.includes(profileName)) score += 5
  else if (eventTitle && profileSlug.includes(eventTitle)) score += 4

  if (eventVenue && profileVenue === eventVenue) score += 5
  else if (
    eventVenue &&
    profileVenue &&
    (profileVenue.includes(eventVenue) || eventVenue.includes(profileVenue))
  ) {
    score += 3
  }

  if (eventArea && profileArea === eventArea) score += 2

  return score
}

export default function EventDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const slug = params.slug as string
  const from = searchParams.get('from')
  const backHref = from === 'admin' ? '/admin' : from === 'dashboard' ? '/dashboard' : '/'
  const backLabel = from === 'admin' ? 'Volver al admin' : from === 'dashboard' ? 'Volver al panel' : 'Volver'

  const [event, setEvent] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEventFavorite, setIsEventFavorite] = useState(false)
  const [isProfileFavorite, setIsProfileFavorite] = useState(false)
  const [eventProfileId, setEventProfileId] = useState('')
  const [favoriteStatus, setFavoriteStatus] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState('')
  const [claimOpen, setClaimOpen] = useState(false)
  const [claimName, setClaimName] = useState('')
  const [claimCompany, setClaimCompany] = useState('')
  const [claimPhone, setClaimPhone] = useState('')
  const [claimWebsite, setClaimWebsite] = useState('')
  const [claimMessage, setClaimMessage] = useState('')
  const [claimStatus, setClaimStatus] = useState('')
  const [claimSubmitting, setClaimSubmitting] = useState(false)

  useEffect(() => {
    async function loadEvent() {
      const { data } = await supabase
        .from('events')
        .select('*')
        .eq('slug', slug)
        .single()

      setEvent(data)
      setLoading(false)

      let resolvedProfileId = data?.event_profile_id || ''

      if (data) {
        if (resolvedProfileId) {
          const { data: eventProfile } = await supabase
            .from('promoter_event_profiles')
            .select('id, name')
            .eq('id', resolvedProfileId)
            .maybeSingle()

          resolvedProfileId = eventProfile?.id || resolvedProfileId
        } else if (data.title) {
          const { data: directMatch } = await supabase
            .from('promoter_event_profiles')
            .select('id, name')
            .ilike('name', `%${data.title}%`)
            .limit(1)
            .maybeSingle()

          resolvedProfileId = directMatch?.id || ''

          if (!resolvedProfileId) {
            const { data: candidateProfiles } = await supabase
              .from('promoter_event_profiles')
              .select('id, name, slug, venue_name, area, type')
              .eq('type', data.type || 'Tardeo')
              .limit(250)

            const bestProfile = (candidateProfiles || [])
              .map((profile) => ({
                profile,
                score: getProfileMatchScore(data, profile),
              }))
              .filter((item) => item.score >= 7)
              .sort((a, b) => b.score - a.score)[0]?.profile

            resolvedProfileId = bestProfile?.id || ''
          }
        }

        setEventProfileId(resolvedProfileId)
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user || !data) return

      setUserId(user.id)
      setUserEmail(user.email ?? '')

      const { data: existingClaim } = await supabase
        .from('event_claims')
        .select('status')
        .eq('event_id', data.id)
        .eq('promoter_user_id', user.id)
        .maybeSingle()

      if (existingClaim?.status) setClaimStatus(existingClaim.status)

      const { data: eventFavorite } = await supabase
        .from('favorites')
        .select('event_id')
        .eq('user_id', user.id)
        .eq('event_id', data.id)
        .maybeSingle()

      if (eventFavorite) setIsEventFavorite(true)

      if (resolvedProfileId) {
        const { data: profileFavorite } = await supabase
          .from('event_profile_favorites')
          .select('event_profile_id')
          .eq('user_id', user.id)
          .eq('event_profile_id', resolvedProfileId)
          .maybeSingle()

        if (profileFavorite) setIsProfileFavorite(true)
      }
    }

    loadEvent()
  }, [slug])

  async function toggleEventFavorite() {
    if (!userId) {
      window.location.href = '/login?type=user'
      return
    }

    if (!event) return

    if (isEventFavorite) {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('event_id', event.id)

      if (error) {
        setFavoriteStatus(`No se pudo quitar el evento: ${error.message}`)
        return
      }

      setIsEventFavorite(false)
    } else {
      const { error } = await supabase.from('favorites').insert({
        user_id: userId,
        event_id: event.id,
      })

      if (error) {
        setFavoriteStatus(`No se pudo guardar el evento: ${error.message}`)
        return
      }

      setIsEventFavorite(true)
    }

    setFavoriteStatus('')
  }

  async function toggleProfileFavorite() {
    if (!userId) {
      window.location.href = '/login?type=user'
      return
    }

    if (!eventProfileId) return

    if (isProfileFavorite) {
      const { error } = await supabase
        .from('event_profile_favorites')
        .delete()
        .eq('user_id', userId)
        .eq('event_profile_id', eventProfileId)

      if (error) {
        setFavoriteStatus(`No se pudo quitar la ficha: ${error.message}`)
        return
      }

      setIsProfileFavorite(false)
    } else {
      const { error } = await supabase.from('event_profile_favorites').insert({
        user_id: userId,
        event_profile_id: eventProfileId,
      })

      if (error) {
        setFavoriteStatus(`No se pudo guardar la ficha: ${error.message}`)
        return
      }

      setIsProfileFavorite(true)
    }

    setFavoriteStatus('')
  }

  async function submitClaim(e: React.FormEvent) {
    e.preventDefault()

    if (!event) return

    if (!userId) {
      window.location.href = '/login?type=venue'
      return
    }

    setClaimSubmitting(true)
    setClaimStatus('')

    const { error } = await supabase.from('event_claims').insert({
      event_id: event.id,
      promoter_user_id: userId,
      contact_name: claimName,
      company: claimCompany,
      email: userEmail,
      phone: claimPhone || null,
      website: claimWebsite || null,
      message: claimMessage || null,
      status: 'pending',
    })

    setClaimSubmitting(false)

    if (error) {
      setClaimStatus(`error:${error.message}`)
      return
    }

    setClaimStatus('pending')
    setClaimOpen(false)
    setClaimName('')
    setClaimCompany('')
    setClaimPhone('')
    setClaimWebsite('')
    setClaimMessage('')
  }

  if (loading) {
    return (
      <main>
        <Navbar />
        <section className="container-page py-16">
          <p className="text-slate-400">Cargando evento...</p>
        </section>
        <Footer />
      </main>
    )
  }

  if (!event) {
    return (
      <main>
        <Navbar />
        <section className="container-page py-16">
          <h1 className="text-3xl font-bold">Evento no encontrado</h1>
          <Link href={backHref} className="btn-secondary mt-6 inline-flex">
            Volver
          </Link>
        </section>
        <Footer />
      </main>
    )
  }

  const eventUrl = `https://tardea.com/eventos/${event.slug ?? slug}`
  const whatsappText = encodeURIComponent(
    `Mira este plan en TARDEA: ${event.title} ${eventUrl}`
  )
  const whatsappShareUrl = `https://wa.me/?text=${whatsappText}`

  return (
    <main>
      <Navbar />

      <section className="relative overflow-hidden border-b border-white/10">
        {event.cover && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-25"
            style={{ backgroundImage: `url(${event.cover})` }}
          />
        )}

        <div className="container-page relative py-16 md:py-24">
          <Link href={backHref} className="btn-secondary mb-8 inline-flex">
            <ArrowLeft className="mr-2 h-4 w-4" /> {backLabel}
          </Link>

          {event.status === 'pending' && (
            <div className="mb-4 rounded-xl bg-yellow-500/20 px-4 py-2 text-sm text-yellow-200">
              Evento pendiente de aprobación
            </div>
          )}

          <div className="max-w-3xl">
            <span className="badge mb-4">{event.type}</span>

            <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
              {event.title}
            </h1>

            <p className="mt-5 text-lg text-slate-300">
              {event.description}
            </p>
          </div>
        </div>
      </section>

      <section className="container-page grid gap-8 py-16 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-2xl font-semibold">Detalles del evento</h2>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <CalendarDays className="mb-2 h-5 w-5 text-brand-500" />
                <p className="font-medium">Fecha</p>
                <p className="text-sm text-slate-400">
                  {new Date(event.date).toLocaleDateString('es-ES')}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <Clock3 className="mb-2 h-5 w-5 text-brand-500" />
                <p className="font-medium">Horario</p>
                <p className="text-sm text-slate-400">
                  {event.start_time?.slice(0, 5)} - {event.end_time?.slice(0, 5)}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <MapPin className="mb-2 h-5 w-5 text-brand-500" />
                <p className="font-medium">Ubicación</p>
                <p className="text-sm text-slate-400">
                  {event.venue}, {event.address}
                </p>

                {event.maps_url && (
                  <a
                    href={event.maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block text-sm font-medium text-brand-500 hover:underline"
                  >
                    Ver en Google Maps →
                  </a>
                )}
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <Euro className="mb-2 h-5 w-5 text-brand-500" />
                <p className="font-medium">Precio</p>
                <p className="text-sm text-slate-400">
                  {event.price_from === 0
                    ? 'Entrada gratis o con invitación'
                    : `Desde ${event.price_from}€`}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <Music4 className="mb-2 h-5 w-5 text-brand-500" />
                <p className="font-medium">Música</p>
                <p className="text-sm text-slate-400">
                  {(event.music || []).join(', ')}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <Users className="mb-2 h-5 w-5 text-brand-500" />
                <p className="font-medium">Público</p>
                <p className="text-sm text-slate-400">{event.audience}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-2xl font-semibold">
              Qué hace especial este plan
            </h2>

            <div className="mt-5 flex flex-wrap gap-3">
              {(event.perks || []).map((perk: string) => (
                <span key={perk} className="badge">
                  <Sparkles className="mr-2 h-4 w-4" /> {perk}
                </span>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          {event.cover && (
            <div className="card overflow-hidden p-0">
              <img
                src={event.cover}
                alt={`Cartel de ${event.title}`}
                className="w-full object-cover"
              />
            </div>
          )}

          <div className="card p-6">
            <h3 className="text-xl font-semibold">Reserva o compra entradas</h3>
            <p className="mt-3 text-sm text-slate-400">
              {event.source_url
                ? 'Compra o reserva directamente en la tiquetera o web oficial del organizador.'
                : 'Estamos revisando el enlace de compra o reserva de este evento.'}
            </p>

            {event.source_url ? (
              <a href={event.source_url} target="_blank" rel="noopener noreferrer" className="btn-primary mt-6 w-full">
                Comprar entradas
              </a>
            ) : (
              <button type="button" disabled className="btn-primary mt-6 w-full opacity-50">
                Entradas por confirmar
              </button>
            )}
            <a
              href={whatsappShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-5 py-3 font-semibold text-slate-950 transition hover:bg-[#1fbd5a]"
            >
              <WhatsAppIcon className="h-5 w-5" />
              Compartir por WhatsApp
            </a>

            <button
              onClick={toggleEventFavorite}
              className="btn-secondary mt-3 w-full"
            >
              {isEventFavorite ? '❤️ Fecha guardada' : '🤍 Guardar esta fecha'}
            </button>

            {eventProfileId && (
              <button
                onClick={toggleProfileFavorite}
                className="btn-secondary mt-3 w-full"
              >
                {isProfileFavorite
                  ? `❤️ Plan seguido`
                  : `🤍 Seguir este plan`}
              </button>
            )}

            {favoriteStatus && (
              <p className="mt-3 rounded-2xl border border-brand-500/30 bg-brand-500/10 px-4 py-3 text-sm text-brand-200">
                {favoriteStatus}
              </p>
            )}
          </div>

          {event.reel_url && (
            <div className="card p-6">
              <h3 className="text-xl font-semibold">Video del evento</h3>
              <p className="mt-2 text-sm text-slate-400">
                Mira el reel o video que ha compartido el promotor.
              </p>
              <a
                href={event.reel_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary mt-5 w-full"
              >
                Ver reel
              </a>
            </div>
          )}

          {!event.user_id && (
            <div id="claim-event" className="card scroll-mt-24 p-6">
              <h3 className="text-xl font-semibold">¿Eres el promotor?</h3>
              <p className="mt-2 text-sm text-slate-400">
                Si este evento es tuyo, puedes reclamarlo para gestionarlo desde tu panel.
              </p>

              {claimStatus === 'pending' ? (
                <p className="mt-4 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
                  Solicitud enviada. TARDEA la revisara manualmente.
                </p>
              ) : claimStatus === 'approved' ? (
                <p className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                  Reclamacion aprobada.
                </p>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      if (!userId) {
                        window.location.href = '/login?type=venue'
                        return
                      }
                      setClaimOpen((open) => !open)
                    }}
                    className="btn-secondary mt-5 w-full"
                  >
                    Reclamar evento
                  </button>

                  {claimOpen && (
                    <form onSubmit={submitClaim} className="mt-5 space-y-3">
                      <input
                        className="input"
                        placeholder="Persona de contacto"
                        value={claimName}
                        onChange={(e) => setClaimName(e.target.value)}
                        required
                      />
                      <input
                        className="input"
                        placeholder="Empresa o promotora"
                        value={claimCompany}
                        onChange={(e) => setClaimCompany(e.target.value)}
                        required
                      />
                      <input
                        className="input"
                        placeholder="Telefono"
                        value={claimPhone}
                        onChange={(e) => setClaimPhone(e.target.value)}
                      />
                      <input
                        className="input"
                        placeholder="Web o Instagram oficial"
                        value={claimWebsite}
                        onChange={(e) => setClaimWebsite(e.target.value)}
                      />
                      <textarea
                        className="input min-h-24"
                        placeholder="Cuéntanos brevemente por qué puedes reclamar este evento"
                        value={claimMessage}
                        onChange={(e) => setClaimMessage(e.target.value)}
                      />
                      <button className="btn-primary w-full" type="submit" disabled={claimSubmitting}>
                        {claimSubmitting ? 'Enviando...' : 'Enviar reclamacion'}
                      </button>
                    </form>
                  )}

                  {claimStatus.startsWith('error:') && (
                    <p className="mt-4 text-sm text-brand-500">
                      No se pudo enviar: {claimStatus.replace('error:', '')}
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </aside>
      </section>

      <Footer />
    </main>
  )
}
