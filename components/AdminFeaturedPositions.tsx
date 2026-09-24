'use client'

import { useEffect, useState } from 'react'
import { RotateCcw, Save } from 'lucide-react'
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
  const [savedPositions, setSavedPositions] = useState<(string | null)[]>([null, null, null, null, null])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [message, setMessage] = useState('')
  useEffect(() => {
    fetch('/api/featured', { cache: 'no-store' })
      .then(async (response) => {
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'No se pudieron cargar destacados')
        setPositions(result.positions)
        setSavedPositions(result.positions)
      })
      .catch((error) => {
        setLoadFailed(true)
        setMessage(error.message)
      })
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

  const hasChanges = positions.some((id, index) => id !== savedPositions[index])

  function assign(position: number, profileId: string) {
    if (positions[position - 1] === profileId) return
    const next = positions.map((id, index) => index === position - 1 || id === profileId ? null : id)
    next[position - 1] = profileId || null
    setPositions(next)
    setMessage('Cambios sin guardar')
  }

  async function save() {
    setSaving(true)
    setMessage('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch('/api/featured', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token || ''}` },
        body: JSON.stringify({ positions }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'No se pudieron guardar destacados')
      const check = await fetch('/api/featured', { cache: 'no-store' })
      const confirmed = await check.json()
      if (!check.ok || !Array.isArray(confirmed.positions) || confirmed.positions.length !== 5 || confirmed.positions.some((id: string | null, index: number) => id !== positions[index])) {
        throw new Error('Se guardó la selección, pero la web todavía no confirma el nuevo orden. Vuelve a comprobarlo en unos segundos.')
      }
      setPositions(confirmed.positions)
      setSavedPositions(confirmed.positions)
      setMessage('Cambios guardados. La portada ya muestra este orden.')
    } catch (error) {
      setMessage(`No se pudo confirmar el cambio: ${error instanceof Error ? error.message : 'error desconocido'}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div id="destacados-admin" className="mb-6 border-b border-white/10 pb-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-white">Destacados</h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            title="Deshacer cambios"
            aria-label="Deshacer cambios"
            onClick={() => { setPositions(savedPositions); setMessage('') }}
            disabled={!hasChanges || saving}
            className="inline-flex h-9 w-9 items-center justify-center rounded border border-white/20 text-slate-300 hover:text-white disabled:opacity-40"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!hasChanges || saving || loading || loadFailed}
            className="inline-flex h-9 items-center gap-2 rounded bg-brand-500 px-3 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-40"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[1, 2, 3, 4, 5].map((position) => (
          <label key={position} className="min-w-0 text-xs font-semibold text-slate-300">
            Posición {position}
            <select
              className="input mt-1.5 w-full text-sm"
              value={positions[position - 1] || ''}
              onChange={(event) => assign(position, event.target.value)}
              disabled={saving || loading || loadFailed}
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
      {message && <p className={`mt-3 text-sm ${message.includes('No se pudo') ? 'text-red-300' : 'text-slate-300'}`} role="status">{message}</p>}
    </div>
  )
}
