'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Mail } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { BrandLogo } from '@/components/BrandLogo'

const MUSIC_OPTIONS = [
  'Comercial',
  'Show en directo',
  'Indie',
  'Electrónica',
  'Reguetón',
  'Flamenquito',
  'Pop',
  'Remember',
]

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

const REMEMBERED_PROMOTER_EMAIL_KEY = 'tardea_promoter_email'

type LoginPreviewEvent = {
  slug: string
  title: string
  type: string | null
  cover: string | null
  date?: string | null
  event_profile_id?: string | null
}

const FALLBACK_LOGIN_CARDS: LoginPreviewEvent[] = [
  {
    slug: 'tardeo',
    title: 'Tardeo',
    type: 'Tardeo',
    cover: '/scout-covers/tardeo.svg',
  },
  {
    slug: 'rooftop',
    title: 'Rooftop',
    type: 'Rooftop',
    cover: '/scout-covers/rooftop.svg',
  },
  {
    slug: 'brunch',
    title: 'Brunch',
    type: 'Brunch',
    cover: '/scout-covers/brunch.svg',
  },
  {
    slug: 'afterwork',
    title: 'Afterwork',
    type: 'Afterwork',
    cover: '/scout-covers/tardeo.svg',
  },
  {
    slug: 'flamenquito',
    title: 'Flamenquito',
    type: 'Flamenquito',
    cover: '/scout-covers/flamenquito.svg',
  },
  {
    slug: 'directos',
    title: 'Directos',
    type: 'Show en directo',
    cover: '/scout-covers/tardeo.svg',
  },
]

function normalizeLoginEventName(value: string) {
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

function getLoginEventGroupKey(event: LoginPreviewEvent) {
  if (event.event_profile_id) return event.event_profile_id

  const normalizedTitle = normalizeLoginEventName(event.title || 'evento')
  return `${event.type || 'Tardeo'}__${normalizedTitle || event.slug}`
}

function LoginContent() {
  const searchParams = useSearchParams()
  const type = searchParams.get('type')
  const locked = searchParams.get('locked')
  const accountType = type === 'venue' ? 'venue' : 'user'
  const isUserAccess = accountType === 'user'

  const [isRegister, setIsRegister] = useState(false)
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [venueName, setVenueName] = useState('')
  const [message, setMessage] = useState('')
  const [loginFailed, setLoginFailed] = useState(false)
  const [accessLocked, setAccessLocked] = useState(false)
  const [sendingRecovery, setSendingRecovery] = useState(false)
  const [legalAccepted, setLegalAccepted] = useState(false)
  const [marketingConsent, setMarketingConsent] = useState(false)
  const [featuredLoginEvents, setFeaturedLoginEvents] = useState<LoginPreviewEvent[]>([])

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [address, setAddress] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [municipality, setMunicipality] = useState('')
  const [province, setProvince] = useState('Madrid')
  const [musicPrefs, setMusicPrefs] = useState<string[]>([])

  useEffect(() => {
    if (locked === '1') {
      setMessage('Próximamente abriremos TARDEA. Ahora mismo estamos en pruebas privadas.')
      setAccessLocked(true)
      setLoginFailed(false)
    }
  }, [locked])

  useEffect(() => {
    if (accountType !== 'venue') return

    const rememberedEmail = localStorage.getItem(REMEMBERED_PROMOTER_EMAIL_KEY)
    if (rememberedEmail) {
      setEmail(rememberedEmail)
    }
  }, [accountType])

  useEffect(() => {
    if (!isUserAccess) return

    async function loadFeaturedLoginEvents() {
      const today = new Date().toISOString().split('T')[0]

      const { data: featuredEvents, error: featuredError } = await supabase
        .from('events')
        .select('slug, title, type, cover, date, event_profile_id')
        .eq('published', true)
        .eq('status', 'approved')
        .eq('featured', true)
        .gte('date', today)
        .order('date', { ascending: true })
        .limit(40)

      if (featuredError) {
        console.error(featuredError)
      }

      const { data: upcomingEvents, error: upcomingError } = await supabase
        .from('events')
        .select('slug, title, type, cover, date, event_profile_id')
        .eq('published', true)
        .eq('status', 'approved')
        .gte('date', today)
        .order('date', { ascending: true })
        .limit(60)

      if (upcomingError) {
        console.error(upcomingError)
      }

      const uniqueEvents = new Map<string, LoginPreviewEvent>()
      ;[...(featuredEvents || []), ...(upcomingEvents || [])].forEach((event) => {
        if (!event?.slug) return

        const groupKey = getLoginEventGroupKey(event)
        if (!uniqueEvents.has(groupKey)) {
          uniqueEvents.set(groupKey, event)
        }
      })

      setFeaturedLoginEvents(Array.from(uniqueEvents.values()).slice(0, 6))
    }

    loadFeaturedLoginEvents()
  }, [isUserAccess])

  function toggleSelection(value: string) {
    setMusicPrefs((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    )
  }

  async function canUseEmail(emailValue: string) {
    const response = await fetch('/api/auth/access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: emailValue }),
    })

    if (response.ok) return true

    const payload = await response.json().catch(() => null)
    setMessage(
      payload?.error ||
        'Próximamente abriremos TARDEA. Ahora mismo estamos en pruebas privadas.'
    )
    setAccessLocked(true)
    setLoginFailed(false)
    return false
  }

  async function handleOAuthLogin(provider: 'google') {
    setMessage('')

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?type=${accountType}`,
        queryParams:
          {
            access_type: 'offline',
            prompt: 'select_account',
          },
      },
    })

    if (error) {
      setMessage('No se pudo iniciar sesión con Google.')
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setMessage('')
    setLoginFailed(false)
    setAccessLocked(false)

    if (!(await canUseEmail(email))) return

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setMessage('Email o contraseña incorrectos.')
      setLoginFailed(true)
      setAccessLocked(false)
      return
    }

    if (accountType === 'venue') {
      localStorage.setItem(REMEMBERED_PROMOTER_EMAIL_KEY, email)
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select(
        'role, first_name, last_name, birth_date, address, postal_code, municipality, province, city, music_preferences'
      )
      .eq('id', user.id)
      .single()

    if (profile?.role === 'admin') {
      window.location.href = '/admin'
    } else if (profile?.role === 'venue') {
      window.location.href = '/dashboard'
    } else if (
      !profile?.first_name ||
      !profile?.last_name ||
      !profile?.birth_date ||
      !profile?.address ||
      !profile?.postal_code ||
      !(profile?.municipality || profile?.city) ||
      !profile?.province ||
      !profile?.music_preferences?.length
    ) {
      window.location.href = '/cuenta/perfil?first=1'
    } else {
      window.location.href = '/cuenta'
    }
  }

  async function sendPasswordRecovery() {
    setMessage('')
    setAccessLocked(false)

    if (!email) {
      setMessage('Escribe primero tu correo para enviarte el enlace.')
      setLoginFailed(true)
      return
    }

    if (!(await canUseEmail(email))) return

    setSendingRecovery(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    })
    setSendingRecovery(false)

    if (error) {
      setMessage(`No se pudo enviar el correo: ${error.message}`)
      setLoginFailed(true)
      return
    }

    setMessage('Te hemos enviado un enlace para cambiar la contraseña.')
    setLoginFailed(false)
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setMessage('')

    if (!legalAccepted) {
      setMessage('Debes aceptar la política de privacidad y las condiciones.')
      return
    }

    if (!(await canUseEmail(email))) return

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setMessage('No se pudo crear la cuenta.')
      return
    }

    if (data.user) {
      const profileResponse = await fetch('/api/profiles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: data.user.id,
          email: data.user.email,
          role: accountType,
          venueName,
          firstName,
          lastName,
          birthDate,
          address,
          postalCode,
          municipality,
          province,
          musicPrefs,
          marketingConsent,
        }),
      })
      const profileResult = await profileResponse.json().catch(() => null)

      if (!profileResponse.ok) {
        setMessage(
          `Cuenta creada, pero falta guardar el perfil: ${
            profileResult?.error || 'error interno'
          }`
        )
        return
      }
    }

    setMessage('Cuenta creada correctamente')
    setIsRegister(false)
  }

  const loginPreviewCards =
    featuredLoginEvents.length > 0 ? featuredLoginEvents : FALLBACK_LOGIN_CARDS

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="container-page py-10 md:py-16">
        <a href="/" className="mb-10 block text-center">
          <BrandLogo className="justify-center" iconClassName="h-11 w-11" />
        </a>

        {isUserAccess && !isRegister && !showEmailForm ? (
          <div className="mx-auto max-w-md">
            <div className="text-center">
              <h1 className="text-2xl font-black leading-tight text-white">
                Descubre los mejores tardeos en Madrid
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Puedes explorar los eventos desde el buscador. Inicia sesión cuando quieras guardar favoritos, recibir sugerencias y chatear.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-3">
              {loginPreviewCards.map((event) => {
                const content = (
                  <>
                    <div
                      className="absolute inset-0 bg-cover bg-center opacity-70 transition duration-500 group-hover:scale-105 group-hover:opacity-80"
                      style={{
                        backgroundImage: `url(${event.cover || '/scout-covers/tardeo.svg'})`,
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/55 to-slate-950/20" />
                    <div className="relative z-10 flex h-full flex-col justify-end p-3">
                      <span className="text-[10px] font-black uppercase tracking-[0.12em] text-brand-200">
                        {event.type || 'Tardeo'}
                      </span>
                      <span className="mt-1 line-clamp-2 text-[11px] font-black uppercase leading-tight text-white">
                        {event.title}
                      </span>
                    </div>
                  </>
                )

                return event.slug.startsWith('fallback-') ||
                  FALLBACK_LOGIN_CARDS.some((card) => card.slug === event.slug) ? (
                  <div
                    key={event.slug}
                    className="group relative aspect-[3/4] overflow-hidden rounded-2xl bg-slate-900 shadow-xl shadow-black/25"
                  >
                    {content}
                  </div>
                ) : (
                  <Link
                    key={event.slug}
                    href={`/eventos/${event.slug}`}
                    className="group relative aspect-[3/4] overflow-hidden rounded-2xl bg-slate-900 shadow-xl shadow-black/25"
                  >
                    {content}
                  </Link>
                )
              })}
            </div>

            <div className="mt-8 space-y-3">
              <button
                type="button"
                onClick={() => handleOAuthLogin('google')}
                className="flex w-full items-center justify-center gap-4 rounded-full bg-white px-5 py-4 text-base font-bold text-slate-950 transition hover:bg-slate-100"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xl font-black text-[#4285F4]">
                  G
                </span>
                Continuar con Google
              </button>

              <button
                type="button"
                onClick={() => setShowEmailForm(true)}
                className="flex w-full items-center justify-center gap-4 rounded-full bg-white px-5 py-4 text-base font-bold text-slate-950 transition hover:bg-slate-100"
              >
                <Mail className="h-5 w-5" />
                Continuar con correo
              </button>

            </div>

            <p className="mx-auto mt-6 max-w-sm text-center text-xs leading-5 text-slate-500">
              Al continuar, aceptas las{' '}
              <Link href="/condiciones" className="text-brand-400 hover:underline">
                condiciones de uso
              </Link>{' '}
              y la{' '}
              <Link href="/privacidad" className="text-brand-400 hover:underline">
                política de privacidad
              </Link>
              .
            </p>
          </div>
        ) : (
        <div className="card mx-auto max-w-md p-6">
          <h1 className="text-center text-3xl font-bold">
            {accountType === 'venue' ? 'Acceso promotor' : isRegister ? 'Crear cuenta' : 'Entrar con correo'}
          </h1>
          {isUserAccess && !isRegister && (
            <button
              type="button"
              onClick={() => {
                setShowEmailForm(false)
                setMessage('')
              }}
              className="mx-auto mt-3 block text-sm font-semibold text-brand-500 hover:text-brand-400"
            >
              Volver a opciones de acceso
            </button>
          )}

          <form
            onSubmit={isRegister ? handleRegister : handleLogin}
            className="mt-6 space-y-4"
          >
            {isRegister && accountType === 'venue' && (
              <input
                className="input"
                placeholder="Nombre de sala o promotor"
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                required
              />
            )}

            {isRegister && accountType === 'user' && (
              <>
                <input
                  className="input"
                  placeholder="Nombre"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />

                <input
                  className="input"
                  placeholder="Apellidos"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />

                <div>
                  <p className="mb-2 text-sm text-slate-400">
                    Fecha de nacimiento
                  </p>

                  <input
                    className="input"
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    required
                  />
                </div>

                <input
                  className="input"
                  placeholder="Direccion"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />

                <div className="grid gap-4 sm:grid-cols-[0.8fr_1.2fr]">
                  <input
                    className="input"
                    placeholder="Codigo postal"
                    inputMode="numeric"
                    maxLength={5}
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    required
                  />

                  <input
                    className="input"
                    placeholder="Municipio"
                    value={municipality}
                    onChange={(e) => setMunicipality(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <p className="mb-2 text-sm text-slate-400">
                    Provincia
                  </p>

                  <select
                    className="select"
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    required
                  >
                    {PROVINCE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <p className="mb-2 text-sm text-slate-400">
                    Gustos musicales
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {MUSIC_OPTIONS.map((music) => (
                      <button
                        type="button"
                        key={music}
                        onClick={() => toggleSelection(music)}
                        className={`rounded-full px-3 py-1 text-sm ${
                          musicPrefs.includes(music)
                            ? 'bg-brand-500 text-white'
                            : 'bg-white/10 text-slate-200'
                        }`}
                      >
                        {music}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <input
              className="input"
              type="email"
              placeholder="Email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div className="relative">
              <input
                className="input pr-12"
                type={showPassword ? 'text' : 'password'}
                placeholder="Contraseña"
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-white"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            {!isRegister && (
              <button
                type="button"
                onClick={sendPasswordRecovery}
                disabled={sendingRecovery}
                className="w-full text-center text-sm font-semibold text-brand-500 transition hover:text-brand-400 disabled:opacity-60"
              >
                {sendingRecovery ? 'Enviando enlace...' : '¿Has olvidado la contraseña?'}
              </button>
            )}

            {isRegister && (
              <div className="space-y-3 text-sm text-slate-400">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={legalAccepted}
                    onChange={(e) => setLegalAccepted(e.target.checked)}
                    required
                    className="mt-1 h-4 w-4 rounded border-white/20 bg-slate-900 accent-brand-500"
                  />
                  <span>
                    Acepto la{' '}
                    <a href="/privacidad" className="text-brand-500 hover:underline">
                      política de privacidad
                    </a>{' '}
                    y las{' '}
                    <a href="/condiciones" className="text-brand-500 hover:underline">
                      condiciones de uso
                    </a>
                    .
                  </span>
                </label>

                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={marketingConsent}
                    onChange={(e) => setMarketingConsent(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-white/20 bg-slate-900 accent-brand-500"
                  />
                  <span>
                    Quiero recibir novedades, ofertas y recomendaciones de TARDEA.
                  </span>
                </label>
              </div>
            )}

            <button className="btn-primary w-full" type="submit">
              {isRegister ? 'Crear cuenta' : 'Entrar'}
            </button>

            {message && (
              <p
                className={`rounded-2xl border px-4 py-3 text-center text-sm ${
                  accessLocked
                    ? 'border-amber-400/25 bg-amber-400/10 text-amber-100'
                    : 'border-brand-500/25 bg-brand-500/10 text-brand-200'
                }`}
              >
                {message}
              </p>
            )}

            {!isRegister && loginFailed && !accessLocked && (
              <div className="rounded-2xl border border-brand-500/30 bg-brand-500/10 p-4 text-center">
                <p className="text-sm text-slate-200">
                  Si ese correo está registrado, puedes recibir un enlace para crear una nueva contraseña.
                </p>
                <button
                  type="button"
                  onClick={sendPasswordRecovery}
                  disabled={sendingRecovery}
                  className="mt-3 rounded-full bg-brand-500 px-5 py-2 text-sm font-bold text-white transition hover:bg-brand-600 disabled:opacity-60"
                >
                  {sendingRecovery ? 'Enviando...' : 'Recuperar contraseña'}
                </button>
              </div>
            )}
          </form>

          {isUserAccess && !isRegister && (
            <div className="mt-6">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  O entra con
                </span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <div className="mt-4 grid gap-3">
                <button
                  type="button"
                  onClick={() => handleOAuthLogin('google')}
                  className="btn-secondary w-full gap-3"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-sm font-bold text-slate-950">
                    G
                  </span>
                  Continuar con Google
                </button>

                <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                  <Mail className="h-4 w-4" />
                  También puedes usar tu correo electrónico arriba.
                </div>
              </div>
            </div>
          )}

          <p className="mt-6 text-center text-sm text-slate-400">
            {isRegister ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}{' '}
            <button
              onClick={() => {
                setIsRegister(!isRegister)
                setShowEmailForm(true)
                setMessage('')
                setLegalAccepted(false)
                setMarketingConsent(false)
              }}
              className="text-brand-500 hover:underline"
            >
              {isRegister ? 'Iniciar sesión' : 'Crear cuenta'}
            </button>
          </p>
        </div>
        )}
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  )
}
