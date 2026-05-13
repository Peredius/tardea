'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Mail } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { BrandLogo } from '@/components/BrandLogo'

const MUSIC_OPTIONS = [
  'Comercial',
  'Indie',
  'Electronica',
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

function LoginContent() {
  const searchParams = useSearchParams()
  const type = searchParams.get('type')
  const accountType = type === 'venue' ? 'venue' : 'user'
  const isUserAccess = accountType === 'user'

  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [venueName, setVenueName] = useState('')
  const [message, setMessage] = useState('')

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [address, setAddress] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [municipality, setMunicipality] = useState('')
  const [province, setProvince] = useState('Madrid')
  const [musicPrefs, setMusicPrefs] = useState<string[]>([])

  function toggleSelection(value: string) {
    setMusicPrefs((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    )
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
      setMessage('No se pudo iniciar sesion con Google')
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setMessage('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setMessage('Error al iniciar sesion')
      return
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

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setMessage('')

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setMessage('Error al crear cuenta')
      return
    }

    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').upsert(
        {
          id: data.user.id,
          role: accountType,
          venue_name: accountType === 'venue' ? venueName : null,
          first_name: accountType === 'user' ? firstName : null,
          last_name: accountType === 'user' ? lastName : null,
          birth_date: accountType === 'user' ? birthDate : null,
          address: accountType === 'user' ? address : null,
          postal_code: accountType === 'user' ? postalCode : null,
          municipality: accountType === 'user' ? municipality : null,
          province: accountType === 'user' ? province : null,
          city: accountType === 'user' ? municipality : null,
          music_preferences: accountType === 'user' ? musicPrefs : [],
          area_preferences: [],
        },
        { onConflict: 'id' }
      )

      if (profileError) {
        setMessage(`Cuenta creada, pero falta guardar el perfil: ${profileError.message}`)
        return
      }
    }

    setMessage('Cuenta creada correctamente')
    setIsRegister(false)
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="container-page py-16">
        <a href="/" className="mb-10 block text-center">
          <BrandLogo className="justify-center" iconClassName="h-11 w-11" />
        </a>

        <div className="card mx-auto max-w-md p-6">
          <h1 className="text-center text-3xl font-bold">
            {accountType === 'venue' ? 'Acceso promotor' : 'Acceso usuario'}
          </h1>

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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <input
              className="input"
              type="password"
              placeholder="Contrasena"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button className="btn-primary w-full" type="submit">
              {isRegister ? 'Crear cuenta' : 'Entrar'}
            </button>

            {message && (
              <p className="text-center text-sm text-brand-500">{message}</p>
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
                  Tambien puedes usar tu correo electronico arriba.
                </div>
              </div>
            </div>
          )}

          <p className="mt-6 text-center text-sm text-slate-400">
            {isRegister ? 'Ya tienes cuenta?' : 'No tienes cuenta?'}{' '}
            <button
              onClick={() => {
                setIsRegister(!isRegister)
                setMessage('')
              }}
              className="text-brand-500 hover:underline"
            >
              {isRegister ? 'Iniciar sesion' : 'Crear cuenta'}
            </button>
          </p>
        </div>
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
