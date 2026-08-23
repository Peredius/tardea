'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { BrandLogo } from '@/components/BrandLogo'

function RegisterContent() {
  const searchParams = useSearchParams()
  const type = searchParams.get('type')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [venueName, setVenueName] = useState('')
  const [message, setMessage] = useState('')
  const [legalAccepted, setLegalAccepted] = useState(false)
  const [marketingConsent, setMarketingConsent] = useState(false)

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
        'Ahora mismo TARDEA está en pruebas privadas. Esta cuenta no tiene acceso todavía.'
    )
    return false
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setMessage('')

    if (!legalAccepted) {
      setMessage('Debes aceptar la politica de privacidad y las condiciones.')
      return
    }

    if (!(await canUseEmail(email))) return

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
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div className="relative">
              <input
                className="input pr-12"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Contraseña"
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
