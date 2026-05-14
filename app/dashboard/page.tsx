'use client'

import { useEffect, useState } from 'react'
import {
  BadgeEuro,
  ChevronDown,
  CheckCircle2,
  Hourglass,
  ImagePlus,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Megaphone,
  MessageSquare,
  PencilLine,
  Plus,
  PartyPopper,
  ReceiptText,
  Sparkles,
  UploadCloud,
  UserCircle,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

const PROVINCE_OPTIONS = [
  'A Coruna',
  'Alava',
  'Albacete',
  'Alicante',
  'Almeria',
  'Asturias',
  'Avila',
  'Badajoz',
  'Barcelona',
  'Burgos',
  'Caceres',
  'Cadiz',
  'Cantabria',
  'Castellon',
  'Ciudad Real',
  'Cordoba',
  'Cuenca',
  'Girona',
  'Granada',
  'Guadalajara',
  'Gipuzkoa',
  'Huelva',
  'Huesca',
  'Illes Balears',
  'Jaen',
  'La Rioja',
  'Las Palmas',
  'Leon',
  'Lleida',
  'Lugo',
  'Madrid',
  'Malaga',
  'Murcia',
  'Navarra',
  'Ourense',
  'Palencia',
  'Pontevedra',
  'Salamanca',
  'Santa Cruz de Tenerife',
  'Segovia',
  'Sevilla',
  'Soria',
  'Tarragona',
  'Teruel',
  'Toledo',
  'Valencia',
  'Valladolid',
  'Vizcaya',
  'Zamora',
  'Zaragoza',
]

const MUSIC_OPTIONS = ['Comercial', 'Electrónica', 'Pop', 'Indie', 'Flamenquito', 'Remember']
const AUDIENCE_OPTIONS = ['18-25', '25-35', '30+', 'Mixto']

function generateSlug(title: string, date: string) {
  const cleanTitle = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return date ? `${cleanTitle}-${date}` : cleanTitle
}

export default function DashboardPage() {
  const [email, setEmail] = useState<string | null>(null)
  const [events, setEvents] = useState<any[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [profileMessage, setProfileMessage] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [panelMode, setPanelMode] = useState<'events' | 'data' | 'profile' | 'resources'>('events')
  const [eventView, setEventView] = useState<'all' | 'approved' | 'pending' | 'chat'>('all')

  const [promoterEventName, setPromoterEventName] = useState('')
  const [promoterContactName, setPromoterContactName] = useState('')
  const [promoterCompany, setPromoterCompany] = useState('')
  const [promoterTaxId, setPromoterTaxId] = useState('')
  const [promoterAddress, setPromoterAddress] = useState('')
  const [promoterMunicipality, setPromoterMunicipality] = useState('')
  const [promoterPostalCode, setPromoterPostalCode] = useState('')
  const [promoterProvince, setPromoterProvince] = useState('Madrid')
  const [promoterWebsite, setPromoterWebsite] = useState('')
  const [promoterDescription, setPromoterDescription] = useState('')
  const [promoterLogoUrl, setPromoterLogoUrl] = useState('')
  const [promoterLogoFile, setPromoterLogoFile] = useState<File | null>(null)
  const [promoterLogoPreview, setPromoterLogoPreview] = useState('')
  const [billingDifferent, setBillingDifferent] = useState(false)
  const [billingName, setBillingName] = useState('')
  const [billingTaxId, setBillingTaxId] = useState('')
  const [billingAddress, setBillingAddress] = useState('')
  const [billingMunicipality, setBillingMunicipality] = useState('')
  const [billingPostalCode, setBillingPostalCode] = useState('')
  const [billingProvince, setBillingProvince] = useState('Madrid')
  const [billingEmail, setBillingEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [title, setTitle] = useState('')
  const [venue, setVenue] = useState('')
  const [area, setArea] = useState('')
  const [customArea, setCustomArea] = useState('')
  const [date, setDate] = useState('')
  const [type, setType] = useState('')
  const [address, setAddress] = useState('')
  const [mapsUrl, setMapsUrl] = useState('')
  const [startTime, setStartTime] = useState('17:00')
  const [endTime, setEndTime] = useState('23:00')
  const [priceFrom, setPriceFrom] = useState('')
  const [isInvitation, setIsInvitation] = useState(false)
  const [music, setMusic] = useState<string[]>([])
  const [audience, setAudience] = useState('25-35')
  const [cover, setCover] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [description, setDescription] = useState('')
  const [perks, setPerks] = useState('')

  const profileComplete =
    promoterEventName &&
    promoterContactName &&
    promoterCompany &&
    promoterTaxId &&
    promoterAddress &&
    promoterMunicipality &&
    promoterPostalCode &&
    promoterProvince

  useEffect(() => {
    async function loadDashboard() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        window.location.href = '/login?type=venue'
        return
      }

      setEmail(user.email ?? null)
      setUserId(user.id)
      setBillingEmail(user.email ?? '')

      const { data: profile } = await supabase
        .from('profiles')
        .select(
          'venue_name, promoter_event_name, promoter_contact_name, promoter_company, promoter_tax_id, promoter_address, promoter_municipality, promoter_postal_code, promoter_province, promoter_website, promoter_description, promoter_logo_url, billing_different, billing_name, billing_tax_id, billing_address, billing_municipality, billing_postal_code, billing_province, billing_email'
        )
        .eq('id', user.id)
        .maybeSingle()

      if (profile) {
        const commercialName = profile.promoter_event_name ?? profile.venue_name ?? ''
        setPromoterEventName(commercialName)
        setPromoterContactName(profile.promoter_contact_name ?? '')
        setPromoterCompany(profile.promoter_company ?? '')
        setPromoterTaxId(profile.promoter_tax_id ?? '')
        setPromoterAddress(profile.promoter_address ?? '')
        setPromoterMunicipality(profile.promoter_municipality ?? '')
        setPromoterPostalCode(profile.promoter_postal_code ?? '')
        setPromoterProvince(profile.promoter_province ?? 'Madrid')
        setPromoterWebsite(profile.promoter_website ?? '')
        setPromoterDescription(profile.promoter_description ?? '')
        setPromoterLogoUrl(profile.promoter_logo_url ?? '')
        setBillingDifferent(Boolean(profile.billing_different))
        setBillingName(profile.billing_name ?? '')
        setBillingTaxId(profile.billing_tax_id ?? '')
        setBillingAddress(profile.billing_address ?? '')
        setBillingMunicipality(profile.billing_municipality ?? '')
        setBillingPostalCode(profile.billing_postal_code ?? '')
        setBillingProvince(profile.billing_province ?? 'Madrid')
        setBillingEmail(profile.billing_email ?? user.email ?? '')
        if (!commercialName || !profile.promoter_contact_name || !profile.promoter_company) {
          setPanelMode('data')
        }
      } else {
        setPanelMode('data')
      }

      const { data } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true })

      setEvents(data || [])
      setLoading(false)
    }

    loadDashboard()
  }, [])

  async function refreshEvents() {
    if (!userId) return

    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true })

    setEvents(data || [])
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  async function savePromoterProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!userId) return

    setSavingProfile(true)
    setProfileMessage('')

    const finalBillingName = billingDifferent ? billingName : promoterCompany
    const finalBillingTaxId = billingDifferent ? billingTaxId : promoterTaxId
    const finalBillingAddress = billingDifferent ? billingAddress : promoterAddress
    const finalBillingMunicipality = billingDifferent ? billingMunicipality : promoterMunicipality
    const finalBillingPostalCode = billingDifferent ? billingPostalCode : promoterPostalCode
    const finalBillingProvince = billingDifferent ? billingProvince : promoterProvince
    const finalBillingEmail = billingDifferent ? billingEmail : email ?? ''

    const { error } = await supabase.from('profiles').upsert(
      {
        id: userId,
        role: 'venue',
        venue_name: promoterEventName,
        promoter_event_name: promoterEventName,
        promoter_contact_name: promoterContactName,
        promoter_company: promoterCompany,
        promoter_tax_id: promoterTaxId,
        promoter_address: promoterAddress,
        promoter_municipality: promoterMunicipality,
        promoter_postal_code: promoterPostalCode,
        promoter_province: promoterProvince,
        promoter_website: promoterWebsite,
        promoter_description: promoterDescription,
        promoter_logo_url: promoterLogoUrl,
        billing_different: billingDifferent,
        billing_name: finalBillingName,
        billing_tax_id: finalBillingTaxId,
        billing_address: finalBillingAddress,
        billing_municipality: finalBillingMunicipality,
        billing_postal_code: finalBillingPostalCode,
        billing_province: finalBillingProvince,
        billing_email: finalBillingEmail,
      },
      { onConflict: 'id' }
    )

    setSavingProfile(false)

    if (error) {
      setProfileMessage(`Error al guardar: ${error.message}`)
      return
    }

    setBillingName(finalBillingName)
    setBillingTaxId(finalBillingTaxId)
    setBillingAddress(finalBillingAddress)
    setBillingMunicipality(finalBillingMunicipality)
    setBillingPostalCode(finalBillingPostalCode)
    setBillingProvince(finalBillingProvince)
    setBillingEmail(finalBillingEmail)
    setProfileMessage('Datos guardados correctamente')
    setPanelMode('events')
  }

  async function updatePassword() {
    setPasswordMessage('')

    if (newPassword.length < 6) {
      setPasswordMessage('La contrasena debe tener al menos 6 caracteres.')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage('Las contrasenas no coinciden.')
      return
    }

    setSavingPassword(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setSavingPassword(false)

    if (error) {
      setPasswordMessage(`No se pudo cambiar la contrasena: ${error.message}`)
      return
    }

    setNewPassword('')
    setConfirmPassword('')
    setPasswordMessage('Contrasena actualizada correctamente.')
  }

  async function savePublicProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!userId) return

    setSavingProfile(true)
    setProfileMessage('')

    let nextLogoUrl = promoterLogoUrl

    if (promoterLogoFile) {
      const fileName = `promoters/${userId}/${Date.now()}-${promoterLogoFile.name}`
      const { error: uploadError } = await supabase.storage
        .from('events')
        .upload(fileName, promoterLogoFile, { upsert: true })

      if (uploadError) {
        setProfileMessage(`Error subiendo imagen: ${uploadError.message}`)
        setSavingProfile(false)
        return
      }

      const { data } = supabase.storage.from('events').getPublicUrl(fileName)
      nextLogoUrl = data.publicUrl
    }

    const { error } = await supabase.from('profiles').upsert(
      {
        id: userId,
        role: 'venue',
        venue_name: promoterEventName,
        promoter_event_name: promoterEventName,
        promoter_website: promoterWebsite,
        promoter_description: promoterDescription,
        promoter_logo_url: nextLogoUrl,
      },
      { onConflict: 'id' }
    )

    setSavingProfile(false)

    if (error) {
      setProfileMessage(`Error al guardar: ${error.message}`)
      return
    }

    setPromoterLogoUrl(nextLogoUrl)
    setPromoterLogoFile(null)
    setPromoterLogoPreview('')
    setProfileMessage('Perfil guardado correctamente')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      window.location.href = '/login?type=venue'
      return
    }

    let imageUrl = ''

    if (cover) {
      const fileName = `${Date.now()}-${cover.name}`

      const { error: uploadError } = await supabase.storage
        .from('events')
        .upload(fileName, cover)

      if (uploadError) {
        setMessage(`Error subiendo imagen: ${uploadError.message}`)
        setSaving(false)
        return
      }

      const { data } = supabase.storage.from('events').getPublicUrl(fileName)
      imageUrl = data.publicUrl
    }

    const eventData = {
      title,
      slug: generateSlug(title, date),
      venue,
      area: area === 'Otra' ? customArea || null : area || null,
      address: address || null,
      maps_url: mapsUrl || null,
      date,
      start_time: startTime,
      end_time: endTime,
      type,
      music,
      audience,
      price_from: isInvitation ? 0 : priceFrom ? parseFloat(priceFrom) : 0,
      cover: imageUrl,
      featured: false,
      description,
      perks: perks ? perks.split(',').map((p) => p.trim()) : [],
      status: 'pending',
      published: false,
      user_id: user.id,
    }

    const { error } = await supabase.from('events').insert(eventData)

    if (error) {
      setMessage(`Error al crear evento: ${error.message}`)
      setSaving(false)
      return
    }

    setMessage('Evento enviado correctamente. Queda pendiente de revision.')
    setTitle('')
    setVenue('')
    setArea('')
    setCustomArea('')
    setDate('')
    setType('')
    setAddress('')
    setMapsUrl('')
    setStartTime('17:00')
    setEndTime('23:00')
    setPriceFrom('')
    setIsInvitation(false)
    setMusic([])
    setAudience('25-35')
    setCover(null)
    setPreviewUrl('')
    setDescription('')
    setPerks('')

    await refreshEvents()
    setSaving(false)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="container-page py-10">
          <p className="text-slate-400">Cargando panel...</p>
        </div>
      </main>
    )
  }

  const approvedEvents = events.filter((event) => event.status === 'approved')
  const pendingEvents = events.filter((event) => event.status === 'pending')
  const visibleEvents =
    eventView === 'approved'
      ? approvedEvents
      : eventView === 'pending'
        ? pendingEvents
        : events
  const greetingName = promoterEventName || promoterCompany || 'promotor'
  const showDataForm = panelMode === 'data' || !profileComplete
  const showProfileForm = panelMode === 'profile' && profileComplete
  const showResources = panelMode === 'resources' && profileComplete
  const logoDisplay = promoterLogoPreview || promoterLogoUrl

  function toggleMusicStyle(style: string) {
    setMusic((current) =>
      current.includes(style)
        ? current.filter((item) => item !== style)
        : [...current, style]
    )
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto min-h-screen w-full max-w-6xl pb-12">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/90 px-5 py-4 backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <a
              href="/"
              aria-label="Ir a TARDEA"
              className="inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5 transition hover:border-brand-500/60 hover:bg-brand-500/15"
            >
              <img src="/tardea-icon.svg" alt="TARDEA" className="h-full w-full object-cover" />
            </a>

            <div className="flex min-w-0 items-center gap-2 text-xl font-black text-white sm:text-2xl">
              <LockKeyhole className="h-5 w-5 shrink-0 text-slate-300" />
              <span className="truncate">
                {greetingName.toLowerCase().replace(/\s+/g, '_')}
              </span>
            </div>

            <div className="relative flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setPanelMode('events')
                  setEventView('chat')
                }}
                aria-label="Chat"
                className="relative inline-flex h-11 w-11 items-center justify-center rounded-full text-white transition hover:bg-white/10"
              >
                <MessageSquare className="h-8 w-8 fill-white" />
                <span className="absolute right-1 top-0 h-5 min-w-5 rounded-full bg-brand-500 px-1 text-xs font-bold leading-5 text-white">
                  0
                </span>
              </button>

            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full text-white transition hover:bg-white/10"
              aria-label="Abrir menu"
            >
              <ChevronDown className="h-8 w-8 text-slate-100" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-14 z-50 w-64 overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl">
                <button
                  type="button"
                  onClick={() => {
                    setPanelMode('events')
                    setEventView('all')
                    setMenuOpen(false)
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-200 hover:bg-white/5"
                >
                  <UploadCloud className="h-4 w-4 text-brand-500" />
                  Subir eventos
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPanelMode('events')
                    setEventView('all')
                    setMenuOpen(false)
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-200 hover:bg-white/5"
                >
                  <ReceiptText className="h-4 w-4 text-brand-500" />
                  Editar eventos
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPanelMode('profile')
                    setMenuOpen(false)
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-200 hover:bg-white/5"
                >
                  <PencilLine className="h-4 w-4 text-brand-500" />
                  Editar perfil
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPanelMode('resources')
                    setMenuOpen(false)
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-200 hover:bg-white/5"
                >
                  <Megaphone className="h-4 w-4 text-brand-500" />
                  Lanzamiento
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPanelMode('data')
                    setMenuOpen(false)
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-200 hover:bg-white/5"
                >
                  <ReceiptText className="h-4 w-4 text-brand-500" />
                  Datos y facturacion
                </button>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-3 border-t border-white/10 px-4 py-3 text-left text-sm text-slate-200 hover:bg-white/5"
                >
                  <LogOut className="h-4 w-4 text-brand-500" />
                  Cerrar sesion
                </button>
              </div>
            )}
          </div>
          </div>
        </header>

        <section className="px-5 py-8">
          <div className="grid grid-cols-[auto_1fr] items-center gap-6">
            <button
              type="button"
              onClick={() => {
                setPanelMode('profile')
                window.setTimeout(() => {
                  document.getElementById('promoter-profile-form')?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  })
                }, 50)
              }}
              className="relative flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 via-fuchsia-500 to-orange-400 p-1 sm:h-36 sm:w-36"
            >
              <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-slate-900 text-white">
                {logoDisplay ? (
                  <img src={logoDisplay} alt={greetingName} className="h-full w-full object-cover" />
                ) : (
                  <UserCircle className="h-12 w-12" />
                )}
              </span>
              <span className="absolute bottom-1 right-1 flex h-11 w-11 items-center justify-center rounded-full border-4 border-slate-950 bg-white text-slate-950">
                <Plus className="h-6 w-6" />
              </span>
            </button>

            <div className="min-w-0">
              <h1 className="truncate text-3xl font-black text-white md:text-5xl">
                {greetingName}
              </h1>
              <p className="mt-2 truncate text-sm text-slate-400">{email}</p>

              <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-4xl font-black text-white">{events.length}</p>
                  <p className="text-sm font-semibold text-slate-300">Total subidos</p>
                </div>
                <div>
                  <p className="text-4xl font-black text-emerald-400">{approvedEvents.length}</p>
                  <p className="text-sm font-semibold text-slate-300">Aprobados</p>
                </div>
                <div>
                  <p className="text-4xl font-black text-red-500">{pendingEvents.length}</p>
                  <p className="text-sm font-semibold text-slate-300">Pendientes</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setPanelMode('events')
                setEventView('all')
              }}
              className="rounded-2xl bg-white/10 px-5 py-4 text-center text-lg font-bold text-white transition hover:bg-white/15"
            >
              Crear evento
            </button>

            <button
              type="button"
              onClick={() => setPanelMode('resources')}
              className="rounded-2xl bg-white/10 px-5 py-4 text-center text-lg font-bold text-white transition hover:bg-white/15"
            >
              Lanzamiento
            </button>
          </div>

          <div className="mt-8 grid grid-cols-4 border-b border-white/10 text-center">
            {[
              { key: 'all', icon: PartyPopper, label: 'Todos' },
              { key: 'approved', icon: CheckCircle2, label: 'Aprobados' },
              { key: 'pending', icon: Hourglass, label: 'Pendientes' },
              { key: 'chat', icon: MessageSquare, label: 'Chat' },
            ].map((item) => {
              const Icon = item.icon
              const isActive = eventView === item.key && panelMode === 'events'

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    setPanelMode('events')
                    setEventView(item.key as 'all' | 'approved' | 'pending' | 'chat')
                  }}
                  aria-label={item.label}
                  className={`flex justify-center border-b-2 py-4 transition ${
                    isActive
                      ? 'border-white text-white'
                      : 'border-transparent text-slate-500 hover:text-white'
                  }`}
                >
                  <Icon className="h-9 w-9" />
                </button>
              )
            })}
          </div>
        </section>

        {showDataForm && (
          <form onSubmit={savePromoterProfile} className="card mx-5 mb-8 space-y-6 p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold">Editar datos</h2>
                <p className="mt-2 text-sm text-slate-400">
                  Datos de contacto, empresa y facturacion. Estos datos no son la pagina publica del promotor.
                </p>
              </div>

              {profileComplete && (
                <button
                  type="button"
                  onClick={() => setPanelMode('events')}
                  className="text-sm text-slate-400 hover:text-white"
                >
                  Volver a eventos
                </button>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-500">
                Acceso
              </p>
              <p className="mt-2 break-all text-lg font-semibold text-white">{email}</p>
              <p className="mt-1 text-sm text-slate-400">
                Este es el correo con el que entras al panel de promotor.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <input className="input" placeholder="Evento o nombre comercial" value={promoterEventName} onChange={(e) => setPromoterEventName(e.target.value)} required />
              <input className="input" placeholder="Persona de contacto" value={promoterContactName} onChange={(e) => setPromoterContactName(e.target.value)} required />
              <input className="input" placeholder="Empresa" value={promoterCompany} onChange={(e) => setPromoterCompany(e.target.value)} required />
              <input className="input" placeholder="NIF" value={promoterTaxId} onChange={(e) => setPromoterTaxId(e.target.value)} required />
              <input className="input md:col-span-2" placeholder="Direccion" value={promoterAddress} onChange={(e) => setPromoterAddress(e.target.value)} required />
              <input className="input" placeholder="Municipio" value={promoterMunicipality} onChange={(e) => setPromoterMunicipality(e.target.value)} required />
              <input className="input" placeholder="Codigo postal" inputMode="numeric" maxLength={5} value={promoterPostalCode} onChange={(e) => setPromoterPostalCode(e.target.value)} required />
              <select className="select md:col-span-2" value={promoterProvince} onChange={(e) => setPromoterProvince(e.target.value)} required>
                {PROVINCE_OPTIONS.map((province) => (
                  <option key={province} value={province}>{province}</option>
                ))}
              </select>
            </div>

            <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-slate-100">
              <input type="checkbox" checked={billingDifferent} onChange={(e) => setBillingDifferent(e.target.checked)} />
              Los datos de facturacion son diferentes a los datos de promotor
            </label>

            {billingDifferent && (
              <div className="grid gap-4 md:grid-cols-2">
                <input className="input" placeholder="Razon social o nombre fiscal" value={billingName} onChange={(e) => setBillingName(e.target.value)} required={billingDifferent} />
                <input className="input" placeholder="NIF / CIF" value={billingTaxId} onChange={(e) => setBillingTaxId(e.target.value)} required={billingDifferent} />
                <input className="input md:col-span-2" placeholder="Direccion fiscal" value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)} required={billingDifferent} />
                <input className="input" placeholder="Municipio fiscal" value={billingMunicipality} onChange={(e) => setBillingMunicipality(e.target.value)} required={billingDifferent} />
                <input className="input" placeholder="Codigo postal fiscal" inputMode="numeric" maxLength={5} value={billingPostalCode} onChange={(e) => setBillingPostalCode(e.target.value)} required={billingDifferent} />
                <select className="select" value={billingProvince} onChange={(e) => setBillingProvince(e.target.value)} required={billingDifferent}>
                  {PROVINCE_OPTIONS.map((province) => (
                    <option key={province} value={province}>{province}</option>
                  ))}
                </select>
                <input className="input" type="email" placeholder="Email de facturacion" value={billingEmail} onChange={(e) => setBillingEmail(e.target.value)} required={billingDifferent} />
              </div>
            )}

            {!billingDifferent && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                Se usaran los mismos datos del promotor para facturacion. Activa la casilla si necesitas otra razon social, direccion o email fiscal.
              </div>
            )}

            <button className="btn-primary w-full" type="submit" disabled={savingProfile}>
              {savingProfile ? 'Guardando...' : 'Guardar datos'}
            </button>

            {profileMessage && <p className="text-sm text-brand-500">{profileMessage}</p>}

            <div className="border-t border-white/10 pt-6">
              <h3 className="text-xl font-bold">Cambiar contrasena</h3>
              <p className="mt-2 text-sm text-slate-400">
                Usa una contrasena nueva para acceder con este correo.
              </p>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <input
                  className="input"
                  type="password"
                  placeholder="Nueva contrasena"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <input
                  className="input"
                  type="password"
                  placeholder="Repetir contrasena"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>

              <button
                type="button"
                onClick={updatePassword}
                disabled={savingPassword}
                className="btn-secondary mt-4 w-full md:w-auto"
              >
                {savingPassword ? 'Actualizando...' : 'Cambiar contrasena'}
              </button>

              {passwordMessage && <p className="mt-3 text-sm text-brand-500">{passwordMessage}</p>}
            </div>
          </form>
        )}

        {showProfileForm && (
          <form id="promoter-profile-form" onSubmit={savePublicProfile} className="card mx-5 mb-8 space-y-6 p-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-2xl font-bold">Editar perfil</h2>
                <p className="mt-2 max-w-2xl text-sm text-slate-400">
                  Esta sera la ficha publica de tu sala o promotora: imagen, nombre, web y una descripcion clara de lo que haces.
                </p>
              </div>

              <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-slate-900">
                  {logoDisplay ? (
                    <img src={logoDisplay} alt={greetingName} className="h-full w-full object-cover" />
                  ) : (
                    <ImagePlus className="h-8 w-8 text-slate-500" />
                  )}
                </div>
                <label className="cursor-pointer rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-100 hover:bg-white/10">
                  Subir logo o foto
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null
                      setPromoterLogoFile(file)
                      setPromoterLogoPreview(file ? URL.createObjectURL(file) : '')
                    }}
                  />
                </label>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <input className="input" placeholder="Nombre publico del evento, sala o promotora" value={promoterEventName} onChange={(e) => setPromoterEventName(e.target.value)} required />
              <input className="input" placeholder="Web o Instagram" value={promoterWebsite} onChange={(e) => setPromoterWebsite(e.target.value)} />
              <textarea
                className="input min-h-36 md:col-span-2"
                placeholder="A que se dedica, tipo de tardeos, musica, publico y propuesta del promotor"
                value={promoterDescription}
                onChange={(e) => setPromoterDescription(e.target.value)}
              />
            </div>

            <button className="btn-primary w-full" type="submit" disabled={savingProfile}>
              {savingProfile ? 'Guardando...' : 'Guardar perfil publico'}
            </button>

            {profileMessage && <p className="text-sm text-brand-500">{profileMessage}</p>}
          </form>
        )}

        {showResources && (
          <section className="space-y-6 px-5">
            <div className="card p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-500">
                Recursos para promotores
              </p>
              <h2 className="mt-2 text-3xl font-bold">Haz que tu tardeo destaque</h2>
              <p className="mt-3 max-w-3xl text-slate-400">
                Aqui podras contratar espacios destacados en la web, app y redes sociales. De momento queda preparado como escaparate comercial.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  title: 'Destacado web',
                  price: 'Desde 49 EUR',
                  text: 'Aparece en seleccion editorial y en posiciones preferentes del buscador.',
                  icon: LayoutDashboard,
                },
                {
                  title: 'Push app',
                  price: 'Proximamente',
                  text: 'Campanas para usuarios que encajen por edad, ciudad y gustos musicales.',
                  icon: Sparkles,
                },
                {
                  title: 'Redes sociales',
                  price: 'Desde 79 EUR',
                  text: 'Apoyo en publicaciones, stories y recomendaciones segmentadas.',
                  icon: Megaphone,
                },
                {
                  title: 'Pack completo',
                  price: 'A medida',
                  text: 'Web, app y redes coordinadas para fechas clave o lanzamientos.',
                  icon: BadgeEuro,
                },
              ].map((resource) => {
                const Icon = resource.icon
                return (
                  <article key={resource.title} className="card flex min-h-64 flex-col justify-between p-6">
                    <div>
                      <Icon className="h-7 w-7 text-brand-500" />
                      <h3 className="mt-5 text-xl font-bold">{resource.title}</h3>
                      <p className="mt-2 text-sm font-semibold text-slate-200">{resource.price}</p>
                      <p className="mt-4 text-sm text-slate-400">{resource.text}</p>
                    </div>
                    <button type="button" className="btn-secondary mt-6 w-full">
                      Solicitar informacion
                    </button>
                  </article>
                )
              })}
            </div>
          </section>
        )}

        {panelMode === 'events' && profileComplete && eventView === 'chat' && (
          <section className="px-5 pb-10">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
              <MessageSquare className="mx-auto h-10 w-10 text-brand-500" />
              <h2 className="mt-4 text-2xl font-bold text-white">
                Chat con usuarios y TARDEA
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-sm text-slate-400">
                Aqui centralizaremos conversaciones sobre reservas, dudas de eventos
                y campanas cuando activemos la parte de mensajeria.
              </p>
            </div>
          </section>
        )}

        {panelMode === 'events' && profileComplete && eventView !== 'chat' && (
          <>
            <section className="grid gap-8 px-5 lg:grid-cols-[0.9fr_1.1fr]">
              <form onSubmit={handleSubmit} className="card space-y-6 p-6">
                <div>
                  <h2 className="text-2xl font-bold">Crear evento</h2>
                  <p className="mt-2 text-sm text-slate-400">
                    El evento se enviara como pendiente para revision.
                  </p>
                </div>

                <input className="input" placeholder="Nombre del evento" value={title} onChange={(e) => setTitle(e.target.value)} required />
                <select className="select" value={type} onChange={(e) => setType(e.target.value)} required>
                  <option value="">Tipo de evento</option>
                  <option>Tardeo</option>
                  <option>Rooftop</option>
                  <option>Brunch</option>
                  <option>Fitness Party</option>
                  <option>Afterwork</option>
                </select>
                <select className="select" value={audience} onChange={(e) => setAudience(e.target.value)} required>
                  <option value="">Edad recomendada</option>
                  {AUDIENCE_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
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
                <select className="select" value={area} onChange={(e) => setArea(e.target.value)} required>
                  <option value="">Zona</option>
                  <option>Centro</option>
                  <option>Salamanca</option>
                  <option>Retiro</option>
                  <option value="Otra">Otra</option>
                </select>
                {area === 'Otra' && <input className="input" placeholder="Zona personalizada" value={customArea} onChange={(e) => setCustomArea(e.target.value)} required />}
                <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} required />
                <input type="time" className="input" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
                <input type="time" className="input" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
                <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-slate-100">
                  <input type="checkbox" checked={isInvitation} onChange={(e) => { setIsInvitation(e.target.checked); if (e.target.checked) setPriceFrom('') }} />
                  Entrada con invitacion
                </label>
                {!isInvitation && <input className="input" type="number" min="0" placeholder="Precio desde" value={priceFrom} onChange={(e) => setPriceFrom(e.target.value)} />}
                <input className="input" placeholder="Lugar" value={venue} onChange={(e) => setVenue(e.target.value)} required />
                <input className="input" placeholder="Direccion" value={address} onChange={(e) => setAddress(e.target.value)} required />
                <input className="input" placeholder="Link de Google Maps" value={mapsUrl} onChange={(e) => setMapsUrl(e.target.value)} />
                <textarea className="input min-h-32" placeholder="Descripcion" value={description} onChange={(e) => setDescription(e.target.value)} required />
                <input className="input" placeholder="Extras separados por comas" value={perks} onChange={(e) => setPerks(e.target.value)} />
                <input type="file" accept="image/*" className="input" onChange={(e) => { const file = e.target.files?.[0] || null; setCover(file); setPreviewUrl(file ? URL.createObjectURL(file) : '') }} />
                {previewUrl && <img src={previewUrl} alt="Preview del evento" className="h-56 w-full rounded-xl object-cover" />}
                <button className="btn-primary w-full" type="submit" disabled={saving}>
                  {saving ? 'Enviando...' : 'Enviar evento a revision'}
                </button>
                {message && <p className="text-sm text-brand-500">{message}</p>}
              </form>

              <section className="card p-6">
                <h2 className="text-2xl font-bold">Mis eventos</h2>
                <p className="mt-2 text-sm text-slate-400">Aqui veras los eventos enviados y su estado.</p>
                {visibleEvents.length === 0 && <p className="mt-6 text-slate-400">No tienes eventos en esta vista todavia.</p>}
                <div className="mt-6 space-y-4">
                  {visibleEvents.map((event) => (
                    <div key={event.id} className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="font-semibold">{event.title}</h3>
                        <p className="mt-1 text-sm text-slate-400">{event.date ? new Date(event.date).toLocaleDateString('es-ES') : 'Sin fecha'}</p>
                        <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs ${event.status === 'approved' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
                          {event.status === 'approved' ? 'Publicado' : 'Pendiente'}
                        </span>
                      </div>
                      <a href={`/eventos/${event.slug}?from=dashboard`} className="text-sm font-medium text-brand-500 hover:underline">Vista previa</a>
                    </div>
                  ))}
                </div>
              </section>
            </section>
          </>
        )}
      </div>
    </main>
  )
}
