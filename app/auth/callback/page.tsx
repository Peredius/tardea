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

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      if (!profile) {
        const { error: profileError } = await supabase.from('profiles').insert({
          id: user.id,
          role: type,
          first_name:
            type === 'user'
              ? user.user_metadata?.full_name?.split(' ')[0] ?? null
              : null,
          last_name:
            type === 'user'
              ? user.user_metadata?.full_name?.split(' ').slice(1).join(' ') ||
                null
              : null,
          venue_name: null,
          music_preferences: [],
          area_preferences: [],
        })

        if (profileError) {
          setMessage('Sesion iniciada, pero no se pudo crear el perfil.')
          return
        }
      }

      const role = profile?.role ?? type

      if (role === 'admin') {
        window.location.href = '/admin'
      } else if (role === 'venue') {
        window.location.href = '/dashboard'
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
