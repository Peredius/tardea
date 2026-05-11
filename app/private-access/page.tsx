'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'

function PrivateAccessForm() {
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage('')

    const response = await fetch('/api/private-access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password }),
    })

    if (!response.ok) {
      setMessage('Contrasena incorrecta')
      return
    }

    window.location.href = searchParams.get('next') || '/'
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="container-page flex min-h-screen items-center justify-center py-16">
        <form onSubmit={handleSubmit} className="card w-full max-w-md p-6">
          <a href="/" className="mb-8 block text-center">
            <span className="text-2xl font-bold">TARDEA</span>
          </a>

          <h1 className="text-center text-3xl font-bold">
            Acceso privado
          </h1>

          <p className="mt-3 text-center text-sm text-slate-400">
            Esta version esta en edicion. Introduce la contrasena para entrar.
          </p>

          <div className="mt-6 space-y-4">
            <input
              className="input"
              type="password"
              placeholder="Contrasena"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              required
            />

            <button className="btn-primary w-full" type="submit">
              Entrar
            </button>

            {message && (
              <p className="text-center text-sm text-brand-500">{message}</p>
            )}
          </div>
        </form>
      </div>
    </main>
  )
}

export default function PrivateAccessPage() {
  return (
    <Suspense fallback={null}>
      <PrivateAccessForm />
    </Suspense>
  )
}
