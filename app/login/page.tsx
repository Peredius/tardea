'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const MUSIC_OPTIONS = ['Indie', 'Pop', 'House', 'Urbano', 'Techno']
const AREA_OPTIONS = ['Centro', 'Salamanca', 'Retiro', 'Chamberí', 'Malasaña']

function LoginContent() {
  const searchParams = useSearchParams()
  const type = searchParams.get('type')

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
        role: type === 'venue' ? 'venue' : 'user',
        venue_name: type === 'venue' ? venueName : null,
        first_name: type === 'user' ? firstName : null,
        last_name: type === 'user' ? lastName : null,
        birth_date:
          type === 'user'
            ? `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
            : null,
        music_preferences: type === 'user' ? musicPrefs : [],
        area_preferences: type === 'user' ? areaPrefs : [],
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
            {type === 'venue' ? 'Acceso promotor' : 'Acceso usuario'}
          </h1>

          <form
            onSubmit={isRegister ? handleRegister : handleLogin}
            className="mt-6 space-y-4"
          >
            {isRegister && type === 'venue' && (
              <input
                className="input"
                placeholder="Nombre de sala o promotor"
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                required
              />
            )}

            {isRegister && type === 'user' && (
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
