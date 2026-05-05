'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function DashboardPage() {
  const [email, setEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        window.location.href = '/login'
        return
      }

      setEmail(user.email ?? null)
      setLoading(false)
    }

    loadUser()
  }, [])

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white p-8">
        Cargando...
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-4">Panel de sala</h1>

      <div className="mt-8 rounded-xl border border-white/10 p-6">
        <h2 className="text-xl font-semibold">Usuario conectado</h2>
        <p className="mt-2 text-white/70">{email}</p>
      </div>
    </main>
  )
}
