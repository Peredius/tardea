'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
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

    // 🔥 REDIRECCIÓN INTELIGENTE
    if (profile?.role === 'admin') {
      window.location.href = '/admin'
    } else {
      window.location.href = '/dashboard'
    }
  }

  return (
    <main className="container-page py-16">
      <div className="card mx-auto max-w-md p-6">
        
        {/* 🔥 TÍTULO DINÁMICO */}
        <h1 className="text-3xl font-bold">
          {type === 'user' ? 'Acceso usuarios' : 'Acceso promotores'}
        </h1>

        <p className="mt-2 text-slate-400">
          {type === 'user'
            ? 'Guarda tus eventos favoritos y accede a beneficios.'
            : 'Entra para gestionar tus eventos.'}
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

          {message && <p className="text-sm text-brand-500">{message}</p>}
        </form>
      </div>
    </main>
  )
}
