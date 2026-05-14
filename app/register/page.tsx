'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { BrandLogo } from '@/components/BrandLogo'

function RegisterContent() {
  const searchParams = useSearchParams()
  const type = searchParams.get('type')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [venueName, setVenueName] = useState('')
  const [message, setMessage] = useState('')
  const [legalAccepted, setLegalAccepted] = useState(false)
  const [marketingConsent, setMarketingConsent] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setMessage('')

    if (!legalAccepted) {
      setMessage('Debes aceptar la politica de privacidad y las condiciones.')
      return
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setMessage('Error al crear cuenta')
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
          role: type === 'venue' ? 'venue' : 'user',
          venueName,
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

    setMessage('Cuenta creada. Revisa tu email o inicia sesión.')
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="container-page py-16">
        <a href="/" className="mb-10 block text-center">
          <BrandLogo className="justify-center" iconClassName="h-11 w-11" />
        </a>

        <div className="card mx-auto max-w-md p-6">
          <h1 className="text-center text-3xl font-bold">
            {type === 'venue' ? 'Registro promotor' : 'Registro usuario'}
          </h1>

          <p className="mt-2 text-center text-slate-400">
            {type === 'venue'
              ? 'Crea tu cuenta para publicar eventos.'
              : 'Crea tu cuenta para guardar favoritos y acceder a ventajas.'}
          </p>

          <form onSubmit={handleRegister} className="mt-6 space-y-4">
            {type === 'venue' && (
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
                    politica de privacidad
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

            <button className="btn-primary w-full" type="submit">
              Crear cuenta
            </button>

            {message && (
              <p className="text-center text-sm text-brand-500">{message}</p>
            )}
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            ¿Ya tienes cuenta?{' '}
            <a
              href={`/login?type=${type === 'venue' ? 'venue' : 'user'}`}
              className="text-brand-500 hover:underline"
            >
              Iniciar sesión
            </a>
          </p>
        </div>
      </div>
    </main>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterContent />
    </Suspense>
  )
}
