'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Apple, Mail } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const MUSIC_OPTIONS = ['Indie', 'Pop', 'House', 'Urbano', 'Techno']
const AREA_OPTIONS = ['Centro', 'Salamanca', 'Retiro', 'Chamberí', 'Malasaña']

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
  const [day, setDay] = useState('')
  const [month, setMonth] = useState('')
  const [year, setYear] = useState('')
  const [musicPrefs, setMusicPrefs] = useState<string[]>([])
  const [areaPrefs, setAreaPrefs] = useState<string[]>([])

  function toggleSelection(
    value: string,
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>
  ) {
    setList(
      list.includes(value)
        ? list.filter((item) => item !== value)
        : [...list, value]
    )
  }

  async function handleOAuthLogin(provider: 'google' | 'apple') {
    setMessage('')

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?type=${accountType}`,
        queryParams:
          provider === 'google'
            ? {
                access_type: 'offline',
                prompt: 'select_account',
              }
            : undefined,
      },
    })

    if (error) {
      setMessage(
        `No se pudo iniciar sesion con ${
          provider === 'google' ? 'Google' : 'Apple'
        }`
      )
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
      setMessage('Error al iniciar sesión')
      return
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role === 'admin') {
      window.location.href = '/admin'
    } else if (profile?.role === 'venue') {
      window.location.href = '/dashboard'
    } else {
      window.location.href = '/'
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
      await supabase.from('profiles').insert({
        id: data.user.id,
        role: accountType,
        venue_name: accountType === 'venue' ? venueName : null,
        first_name: accountType === 'user' ? firstName : null,
        last_name: accountType === 'user' ? lastName : null,
        birth_date:
          accountType === 'user'
            ? `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
            : null,
        music_preferences: accountType === 'user' ? musicPrefs : [],
        area_preferences: accountType === 'user' ? areaPrefs : [],
      })
    }

    setMessage('Cuenta creada correctamente')
    setIsRegister(false)
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="container-page py-16">
        <a href="/" className="mb-10 block text-center">
          <span className="text-2xl font-bold">TARDEA</span>
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

                  <div className="grid grid-cols-3 gap-2">
                    <select
                      className="input"
                      value={day}
                      onChange={(e) => setDay(e.target.value)}
                      required
                    >
                      <option value="">Día</option>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>

                    <select
                      className="input"
                      value={month}
                      onChange={(e) => setMonth(e.target.value)}
                      required
                    >
                      <option value="">Mes</option>
                      {[
                        'Enero',
                        'Febrero',
                        'Marzo',
                        'Abril',
                        'Mayo',
                        'Junio',
                        'Julio',
                        'Agosto',
                        'Septiembre',
                        'Octubre',
                        'Noviembre',
                        'Diciembre',
                      ].map((m, i) => (
                        <option key={i + 1} value={i + 1}>
                          {m}
                        </option>
                      ))}
                    </select>

                    <select
                      className="input"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      required
                    >
                      <option value="">Año</option>
                      {Array.from({ length: 70 }, (_, i) => 2007 - i).map(
                        (y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        )
                      )}
                    </select>
                  </div>
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
                        onClick={() =>
                          toggleSelection(music, musicPrefs, setMusicPrefs)
                        }
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

                <div>
                  <p className="mb-2 text-sm text-slate-400">
                    Zonas favoritas
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {AREA_OPTIONS.map((area) => (
                      <button
                        type="button"
                        key={area}
                        onClick={() =>
                          toggleSelection(area, areaPrefs, setAreaPrefs)
                        }
                        className={`rounded-full px-3 py-1 text-sm ${
                          areaPrefs.includes(area)
                            ? 'bg-brand-500 text-white'
                            : 'bg-white/10 text-slate-200'
                        }`}
                      >
                        {area}
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
              placeholder="Contraseña"
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

                <button
                  type="button"
                  onClick={() => handleOAuthLogin('apple')}
                  className="btn-secondary w-full gap-3"
                >
                  <Apple className="h-5 w-5" />
                  Continuar con Apple
                </button>

                <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                  <Mail className="h-4 w-4" />
                  Tambien puedes usar tu correo electronico arriba.
                </div>
              </div>
            </div>
          )}

          <p className="mt-6 text-center text-sm text-slate-400">
            {isRegister ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}{' '}
            <button
              onClick={() => {
                setIsRegister(!isRegister)
                setMessage('')
              }}
              className="text-brand-500 hover:underline"
            >
              {isRegister ? 'Iniciar sesión' : 'Crear cuenta'}
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
