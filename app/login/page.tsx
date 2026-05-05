'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function LoginContent() {
  const searchParams = useSearchParams()
  const type = searchParams.get('type')

  const [isRegister, setIsRegister] = useState(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [venueName, setVenueName] = useState('')
  const [message, setMessage] = useState('')

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
    } else {
      window.location.href = '/dashboard'
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
      })
    }

    setMessage('Cuenta creada. Ahora puedes iniciar sesión')
    setIsRegister(false)
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="container-page py-16">
        {/* LOGO */}
        <a href="/" className="mb-10 block text-center">
          <span className="text-2xl font-bold tracking-tight">TARDEA</span>
        </a>

        <div className="card mx-auto max-w-md p-6">
          <h1 className="text-center text-3xl font-bold">
            {type === 'venue' ? 'Acceso promotor' : 'Acceso usuario'}
          </h1>

          <p className="mt-2 text-center text-slate-400">
            {type === 'venue'
              ? 'Gestiona tus eventos y crea experiencias.'
              : 'Guarda favoritos, accede a perks y más.'}
          </p>

          {/* FORM */}
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

          {/* TOGGLE */}
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
