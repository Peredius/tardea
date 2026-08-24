'use client'

import { ChangeEvent, useEffect, useRef, useState } from 'react'
import {
  Camera,
  CheckCircle2,
  KeyRound,
  Mail,
  Trash2,
  UserRound,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Navbar } from '@/components/Navbar'

export default function AccountDetailsPage() {
  const avatarInputRef = useRef<HTMLInputElement | null>(null)
  const [userId, setUserId] = useState('')
  const [email, setEmail] = useState<string | null>(null)
  const [newEmail, setNewEmail] = useState('')
  const [emailConfirmed, setEmailConfirmed] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sendingConfirmationEmail, setSendingConfirmationEmail] = useState(false)
  const [sendingPasswordEmail, setSendingPasswordEmail] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)

  useEffect(() => {
    async function loadAccount() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        window.location.href = '/login?type=user'
        return
      }

      setEmail(user.email ?? null)
      setNewEmail(user.email ?? '')
      setEmailConfirmed(Boolean(user.email_confirmed_at))
      setUserId(user.id)

      const { data: profileData } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .maybeSingle()

      setAvatarUrl(profileData?.avatar_url ?? '')
      setLoading(false)
    }

    loadAccount()
  }, [])

  async function handleSendConfirmationEmail() {
    setMessage('')

    if (!email) {
      setMessage('No se ha podido detectar el correo de tu cuenta.')
      return
    }

    setSendingConfirmationEmail(true)
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    setSendingConfirmationEmail(false)

    if (error) {
      setMessage(`No se pudo enviar la confirmación: ${error.message}`)
      return
    }

    setMessage('Te hemos enviado un correo de confirmación.')
  }

  async function handlePasswordRecovery() {
    setMessage('')

    if (!email) {
      setMessage('No se ha podido detectar el correo de tu cuenta.')
      return
    }

    setSendingPasswordEmail(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    })
    setSendingPasswordEmail(false)

    if (error) {
      setMessage(`No se pudo enviar el correo: ${error.message}`)
      return
    }

    setMessage('Te hemos enviado un enlace para cambiar la contraseña.')
  }

  async function handleChangeEmail() {
    setMessage('')
    const nextEmail = newEmail.trim()

    if (!nextEmail || nextEmail === email) {
      setMessage('Escribe un correo distinto al actual.')
      return
    }

    const { error } = await supabase.auth.updateUser({ email: nextEmail })

    if (error) {
      setMessage(`No se pudo cambiar el correo: ${error.message}`)
      return
    }

    setMessage('Te hemos enviado un correo para confirmar el cambio.')
  }

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file || !userId) return

    setAvatarUploading(true)
    setMessage('')

    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '-')
    const filePath = `avatars/${userId}/${Date.now()}-${safeFileName}`

    const { error: uploadError } = await supabase.storage
      .from('events')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      })

    if (uploadError) {
      setAvatarUploading(false)
      setMessage(`No se pudo subir la foto: ${uploadError.message}`)
      event.target.value = ''
      return
    }

    const { data } = supabase.storage.from('events').getPublicUrl(filePath)
    const nextAvatarUrl = data.publicUrl

    const { error: profileError } = await supabase.from('profiles').upsert(
      {
        id: userId,
        role: 'user',
        avatar_url: nextAvatarUrl,
      },
      { onConflict: 'id' }
    )

    setAvatarUploading(false)
    event.target.value = ''

    if (profileError) {
      setMessage(`Foto subida, pero no se pudo guardar: ${profileError.message}`)
      return
    }

    setAvatarUrl(nextAvatarUrl)
    setMessage('Foto actualizada.')
  }

  async function handleDeleteAccount() {
    setShowDeleteConfirm(false)
    setDeletingAccount(true)
    setMessage('')

    const {
      data: { session },
    } = await supabase.auth.getSession()

    const response = await fetch('/api/account/delete', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session?.access_token ?? ''}`,
      },
    })

    const result = await response.json().catch(() => null)

    if (!response.ok) {
      setDeletingAccount(false)
      setMessage(`No se pudo eliminar la cuenta: ${result?.error ?? 'Error desconocido.'}`)
      return
    }

    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <Navbar />
        <div className="container-page py-16">
          <p className="text-slate-400">Cargando detalles...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />
      <div className="container-page py-8 md:py-12">
        <section className="mx-auto max-w-xl md:max-w-5xl">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-brand-500">
            Mi cuenta
          </p>
          <h1 className="mt-2 text-3xl font-black text-white">
            Detalles de la cuenta
          </h1>

          <div className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-white/5 md:overflow-visible md:rounded-none md:border-0 md:bg-transparent">
            <div className="flex items-center gap-4 p-5 md:px-0 md:py-0">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 via-fuchsia-500 to-orange-400 p-1">
                <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-slate-900 text-white">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Foto de perfil"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserRound className="h-8 w-8" />
                  )}
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-500">
                  Foto de perfil
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  Cambia la imagen que aparece en tu cuenta.
                </p>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-2xl border border-white/10 px-4 text-sm font-black text-white transition hover:bg-white/10 disabled:opacity-60"
                >
                  <Camera className="h-4 w-4 text-brand-500" />
                  {avatarUploading ? 'Subiendo...' : 'Cambiar foto'}
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
            </div>

            <div className="p-5 md:mt-8 md:px-0 md:py-0">
              <p className="text-xs text-slate-400">Correo electrónico</p>
              <div className="mt-2 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3">
                <p className="truncate text-base font-black text-white">{email}</p>
                {emailConfirmed ? (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-black text-emerald-300">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Confirmado
                  </span>
                ) : (
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="hidden rounded-full bg-amber-400/15 px-3 py-1 text-[11px] font-black text-amber-200 sm:inline-flex">
                      Correo no verificado
                    </span>
                    <button
                      type="button"
                      onClick={handleSendConfirmationEmail}
                      disabled={sendingConfirmationEmail}
                      className="rounded-full border border-brand-500/40 px-3 py-1 text-[11px] font-black text-brand-400 disabled:opacity-60"
                    >
                      {sendingConfirmationEmail ? 'Enviando...' : 'Confirmar'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="divide-y divide-white/10 border-t border-white/10 md:mt-7 md:space-y-4 md:divide-y-0 md:border-t-0">
              <button
                type="button"
                onClick={handlePasswordRecovery}
                disabled={sendingPasswordEmail}
                className="flex min-h-14 w-full items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/70 px-5 py-4 text-left text-sm font-black text-white transition hover:bg-white/10 disabled:opacity-60"
              >
                <KeyRound className="h-4 w-4 text-brand-500" />
                {sendingPasswordEmail ? 'Enviando correo...' : 'Cambiar contraseña'}
              </button>

              <div className="px-5 py-4 md:flex md:items-center md:gap-3 md:rounded-2xl md:border md:border-white/10 md:bg-slate-900/70 md:px-4">
                <label className="flex items-center gap-3 text-sm font-black text-white md:min-w-36">
                  <Mail className="h-4 w-4 text-brand-500" />
                  Cambiar correo
                </label>
                <input
                  className="input mt-3 md:mt-0 md:min-h-11 md:flex-1"
                  type="email"
                  value={newEmail}
                  onChange={(event) => setNewEmail(event.target.value)}
                />
                <button
                  type="button"
                  onClick={handleChangeEmail}
                  className="mt-3 min-h-12 w-full rounded-2xl border border-brand-500/45 px-4 text-sm font-black text-white transition hover:bg-brand-500/10 md:mt-0 md:w-auto md:px-5"
                >
                  Enviar confirmación
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={deletingAccount}
                className="flex w-fit items-center gap-2 px-5 py-4 text-left text-xs font-black text-rose-300 transition hover:text-rose-200 disabled:opacity-60 md:px-0 md:py-1"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {deletingAccount ? 'Eliminando cuenta...' : 'Eliminar cuenta'}
              </button>
            </div>

            {message && (
              <p className="border-t border-white/10 px-5 py-4 text-sm font-semibold text-slate-300 md:mt-4 md:rounded-2xl md:border md:border-white/10 md:bg-white/5">
                {message}
              </p>
            )}
          </div>
        </section>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/80 px-5 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-[28px] border border-brand-500/35 bg-slate-950 p-5 shadow-2xl shadow-brand-500/10">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/15 text-brand-500">
              <Trash2 className="h-5 w-5" />
            </div>

            <p className="text-xs font-black uppercase tracking-[0.22em] text-brand-500">
              Confirmación
            </p>
            <h2 className="mt-2 text-2xl font-black text-white">
              ¿Seguro que quieres eliminar tu cuenta?
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Tu cuenta se eliminará de TARDEA. Esta acción no se puede deshacer.
            </p>

            <div className="mt-6 grid gap-3">
              <button
                type="button"
                onClick={handleDeleteAccount}
                className="min-h-12 rounded-2xl bg-brand-500 px-4 text-sm font-black text-white transition hover:bg-brand-400"
              >
                Sí, eliminar cuenta
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="min-h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-black text-white transition hover:bg-white/10"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
