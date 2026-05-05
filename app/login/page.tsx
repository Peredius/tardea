'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function LoginContent() {
  const searchParams = useSearchParams()
  const type = searchParams.get('type')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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

    if (!user) {
      window.location.href = '/login'
      return
    }

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

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="container-page py-16">
        <a href="/" className="mb-10 block text-center">
          <span className="text-2xl font-bold tracking-tight">TARDEA</span>
        </a>

        <div className="card mx-auto max-w-md p-6">
          <h1 className="text-center text-3xl font-bold">
            {type === 'user' ? 'Acceso usuarios' : 'Acceso promotor'}
          </h1>

          <p className="mt-2 text-center text-slate-400">
            {type === 'user'
              ? 'Guarda tus eventos favoritos y accede a beneficios.'
              : 'Accede a tu panel promotor para gestionar eventos.'}
          </p>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <input
              className="input"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              className="input"
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button className="btn-primary w-full" type="submit">
              Entrar
            </button>

            {message && (
              <p className="text-center text-sm text-brand-500">{message}</p>
            )}
          </form>
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
