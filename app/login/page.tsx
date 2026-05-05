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

  // USER EXTRA DATA
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [age, setAge] = useState('')
  const [musicPrefs, setMusicPrefs] = useState<string[]>([])
  const [areaPrefs, setAreaPrefs] = useState<string[]>([])

  function toggleSelection(value: string, list: string[], setList: any) {
    if (list.includes(value)) {
      setList(list.filter((item) => item !== value))
    } else {
      setList([...list, value])
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()

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

        // USER DATA
        first_name: type === 'user' ? firstName : null,
        last_name: type === 'user' ? lastName : null,
        age: type === 'user' ? Number(age) : null,
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
            {/* PROMOTOR */}
            {isRegister && type === 'venue' && (
              <input
                className="input"
                placeholder="Nombre de sala"
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                required
              />
            )}

            {/* USUARIO */}
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
                  placeholder="Apellido"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />

                <input
                  className="input"
                  type="number"
                  placeholder="Edad"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  required
                />

                {/* MUSIC */}
                <div>
                  <p className="text-sm text-slate-400 mb-2">Gustos musicales</p>
                  <div className="flex flex-wrap gap-2">
                    {MUSIC_OPTIONS.map((m) => (
                      <button
                        type="button"
                        key={m}
                        onClick={() =>
                          toggleSelection(m, musicPrefs, setMusicPrefs)
                        }
                        className={`px-3 py-1 rounded-full text-sm ${
                          musicPrefs.includes(m)
                            ? 'bg-brand-500 text-white'
                            : 'bg-white/10'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* AREAS */}
                <div>
                  <p className="text-sm text-slate-400 mb-2">
                    Zonas favoritas
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {AREA_OPTIONS.map((a) => (
                      <button
                        type="button"
                        key={a}
                        onClick={() =>
                          toggleSelection(a, areaPrefs, setAreaPrefs)
                        }
                        className={`px-3 py-1 rounded-full text-sm ${
                          areaPrefs.includes(a)
                            ? 'bg-brand-500 text-white'
                            : 'bg-white/10'
                        }`}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* EMAIL */}
            <input
              className="input"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {/* PASSWORD */}
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
              <p className="text-sm text-brand-500 text-center">{message}</p>
            )}
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            {isRegister ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}{' '}
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="text-brand-500"
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
