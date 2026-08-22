'use client'

import { useEffect, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { BrandLogo } from '@/components/BrandLogo'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('Introduce tu nueva contraseña.')
  const [hasSession, setHasSession] = useState(false)

  useEffect(() => {
    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      setHasSession(Boolean(session))
      if (!session) {
        setMessage('Este enlace no esta activo o ha caducado. Pide otro email de recuperacion.')
      }
    }

    checkSession()
  }, [])

  async function updatePassword(e: React.FormEvent) {
    e.preventDefault()
    setMessage('')

    if (password.length < 8) {
      setMessage('La contraseña debe tener al menos 8 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setMessage('Las contraseñas no coinciden.')
      return
    }

    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password })
    setSaving(false)

    if (error) {
      setMessage(`No se pudo cambiar la contraseña: ${error.message}`)
      return
    }

    setPassword('')
    setConfirmPassword('')
    setMessage('Contraseña actualizada. Ya puedes entrar con la nueva.')
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="container-page flex min-h-screen items-center justify-center py-16">
        <form onSubmit={updatePassword} className="card w-full max-w-md p-6">
          <a href="/" className="mb-8 block text-center">
            <BrandLogo className="justify-center" iconClassName="h-11 w-11" />
          </a>

          <h1 className="text-center text-3xl font-bold">Nueva contraseña</h1>
          <p className="mt-3 text-center text-sm text-slate-400">{message}</p>

          <div className="mt-6 space-y-4">
            <div className="relative">
              <input
                className="input pr-12"
                type={showPassword ? 'text' : 'password'}
                placeholder="Nueva contraseña"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                disabled={!hasSession}
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

            <div className="relative">
              <input
                className="input pr-12"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Repetir contraseña"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                disabled={!hasSession}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((current) => !current)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-white"
                aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            <button className="btn-primary w-full" type="submit" disabled={saving || !hasSession}>
              {saving ? 'Guardando...' : 'Guardar contraseña'}
            </button>

            <a href="/login" className="block text-center text-sm font-semibold text-brand-500 hover:text-brand-400">
              Volver al login
            </a>
          </div>
        </form>
      </div>
    </main>
  )
}
