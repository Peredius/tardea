'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Profile = {
  id: string
  name: string
}

type Event = {
  event_profile_id?: string | null
  date?: string | null
  published?: boolean
}

export function AdminFeaturedPositions({
  profiles,
  events,
}: {
  profiles: Profile[]
  events: Event[]
}) {
  const [positions, setPositions] = useState<(string | null)[]>([null, null, null, null, null])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  useEffect(() => {
    fetch('/api/featured', { cache: 'no-store' })
      .then(async (response) => {
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'No se pudieron cargar destacados')
        setPositions(result.positions)
      })
      .catch((error) => setMessage(error.message))
      .finally(() => setLoading(false))
  }, [])

  const today = new Date().toISOString().slice(0, 10)
  const upcomingProfileIds = new Set(events
    .filter((event) => event.published && event.date && event.date >= today)
    .map((event) => event.event_profile_id)
    .filter(Boolean))
  const available = profiles
    .filter((profile) => upcomingProfileIds.has(profile.id) || positions.includes(profile.id))
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))

  async function assign(position: number, profileId: string) {
    if (positions[position - 1] === profileId) return
    const next = positions.map((id, index) => index === position - 1 || id === profileId ? null : id)
    next[position - 1] = profileId || null
    setSaving(true)
    setMessage('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch('/api/featured', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token || ''}` },
        body: JSON.stringify({ positions: next }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'No se pudieron guardar destacados')
      setPositions(result.positions)
      setMessage(profileId ? `Posición ${position} actualizada` : `Posición ${position} libre`)
    } catch (error) {
      setMessage(`No se pudo guardar la posición: ${error instanceof Error ? error.message : 'error desconocido'}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div id="destacados-admin" className="mb-6 border-b border-white/10 pb-6">
      <h3 className="text-lg font-bold text-white">Destacados</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[1, 2, 3, 4, 5].map((position) => (
          <label key={position} className="min-w-0 text-xs font-semibold text-slate-300">
            Posición {position}
            <select
              className="input mt-1.5 w-full text-sm"
              value={positions[position - 1] || ''}
              onChange={(event) => assign(position, event.target.value)}
              disabled={saving || loading}
            >
              <option value="">Libre</option>
              {available.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      {message && <p className="mt-3 text-sm text-slate-300" role="status">{message}</p>}
    </div>
  )
}
