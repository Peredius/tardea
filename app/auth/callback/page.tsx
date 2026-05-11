'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function AuthCallbackContent() {
  const searchParams = useSearchParams()
  const type = searchParams.get('type') === 'venue' ? 'venue' : 'user'
  const [message, setMessage] = useState('Completando inicio de sesion...')

  useEffect(() => {
    async function completeLogin() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error || !user) {
        setMessage('No se pudo completar el inicio de sesion.')
        window.location.href = `/login?type=${type}`
        return
      }

      const { data: profile, error: profileLoadError } = await supabase
        .from('profiles')
        .select('role, first_name, last_name, birth_date, address, music_preferences')
        .eq('id', user.id)
        .maybeSingle()

      if (profileLoadError) {
        setMessage(`No se pudo leer el perfil: ${profileLoadError.message}`)
        return
      }

      let role = profile?.role ?? type

      if (!profile) {
        const fullName = user.user_metadata?.full_name ?? ''
        const [firstName, ...lastNameParts] = fullName.split(' ')

        const { data: createdProfile, error: profileError } = await supabase
          .from('profiles')
          .upsert(
            {
              id: user.id,
              role: type,
              first_name: type === 'user' ? firstName || null : null,
              last_name:
                type === 'user' ? lastNameParts.join(' ') || null : null,
              venue_name: null,
              address: null,
              music_preferences: [],
              area_preferences: [],
            },
            { onConflict: 'id' }
          )
          .select('role')
          .single()

        if (profileError) {
          setMessage(
            `Sesion iniciada, pero no se pudo crear el perfil: ${profileError.message}`
          )
          return
        }

        role = createdProfile?.role ?? type
      }

      const needsProfile =
        role === 'user' &&
        (!profile?.first_name ||
          !profile?.last_name ||
          !profile?.birth_date ||
          !profile?.address ||
          !profile?.music_preferences?.length)

      if (role === 'admin') {
        window.location.href = '/admin'
      } else if (role === 'venue') {
        window.location.href = '/dashboard'
      } else if (needsProfile) {
        window.location.href = '/cuenta/perfil?first=1'
      } else {
        window.location.href = '/'
      }
    }

    completeLogin()
  }, [type])

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="container-page flex min-h-screen items-center justify-center py-16">
        <div className="card w-full max-w-md p-6 text-center">
          <p className="text-sm text-slate-400">{message}</p>
        </div>
      </div>
    </main>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={null}>
      <AuthCallbackContent />
    </Suspense>
  )
}
