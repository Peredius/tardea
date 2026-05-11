'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const MUSIC_OPTIONS = [
  'Comercial',
  'Indie',
  'Electronica',
  'Flamenquito',
  'Pop',
]

const CITY_OPTIONS = [
  'Madrid',
  'Barcelona',
  'Valencia',
  'Sevilla',
  'Zaragoza',
  'Malaga',
  'Murcia',
  'Palma',
  'Las Palmas de Gran Canaria',
  'Bilbao',
  'Alicante',
  'Cordoba',
  'Valladolid',
  'Vigo',
  'Gijon',
  'Hospitalet de Llobregat',
  'Vitoria-Gasteiz',
  'A Coruna',
  'Granada',
  'Elche',
]

function ProfileForm() {
  const searchParams = useSearchParams()
  const isFirstTime = searchParams.get('first') === '1'
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [userId, setUserId] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [address, setAddress] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [city, setCity] = useState('Madrid')
  const [musicPrefs, setMusicPrefs] = useState<string[]>([])

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        window.location.href = '/login?type=user'
        return
      }

      setUserId(user.id)

      const { data } = await supabase
        .from('profiles')
        .select(
          'first_name, last_name, birth_date, address, postal_code, city, music_preferences'
        )
        .eq('id', user.id)
        .maybeSingle()

      const fullName = user.user_metadata?.full_name ?? ''
      const [metadataFirstName, ...metadataLastName] = fullName.split(' ')

      setFirstName(data?.first_name ?? metadataFirstName ?? '')
      setLastName(data?.last_name ?? metadataLastName.join(' ') ?? '')
      setBirthDate(data?.birth_date ?? '')
      setAddress(data?.address ?? '')
      setPostalCode(data?.postal_code ?? '')
      setCity(data?.city ?? 'Madrid')
      setMusicPrefs(data?.music_preferences ?? [])
      setLoading(false)
    }

    loadProfile()
  }, [])

  function toggleMusic(value: string) {
    setMusicPrefs((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    const { error } = await supabase.from('profiles').upsert(
      {
        id: userId,
        role: 'user',
        first_name: firstName,
        last_name: lastName,
        birth_date: birthDate,
        address,
        postal_code: postalCode,
        city,
        music_preferences: musicPrefs,
        area_preferences: [],
      },
      { onConflict: 'id' }
    )

    setSaving(false)

    if (error) {
      setMessage(`No se pudo guardar el perfil: ${error.message}`)
      return
    }

    window.location.href = '/'
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="container-page py-16">
          <p className="text-slate-400">Cargando perfil...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="container-page py-12">
        <form onSubmit={handleSubmit} className="card mx-auto max-w-xl p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-500">
            {isFirstTime ? 'Antes de seguir' : 'Mi perfil'}
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Completa tus datos
          </h1>

          <div className="mt-6 grid gap-4">
            <input
              className="input"
              placeholder="Nombre"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />

            <input
              className="input"
              placeholder="Apellidos"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />

            <div>
              <p className="mb-2 text-sm text-slate-400">
                Fecha de nacimiento
              </p>

              <input
                className="input"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                required
              />
            </div>

            <input
              className="input"
              placeholder="Direccion"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />

            <div className="grid gap-4 sm:grid-cols-[0.8fr_1.2fr]">
              <input
                className="input"
                placeholder="Codigo postal"
                inputMode="numeric"
                maxLength={5}
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                required
              />

              <select
                className="select"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              >
                {CITY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <p className="mb-2 text-sm text-slate-400">
                Gustos musicales
              </p>

              <div className="flex flex-wrap gap-2">
                {MUSIC_OPTIONS.map((music) => (
                  <button
                    type="button"
                    key={music}
                    onClick={() => toggleMusic(music)}
                    className={`rounded-full px-3 py-1 text-sm ${
                      musicPrefs.includes(music)
                        ? 'bg-brand-500 text-white'
                        : 'bg-white/10 text-slate-200'
                    }`}
                  >
                    {music}
                  </button>
                ))}
              </div>
            </div>

            <button className="btn-primary w-full" type="submit" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar perfil'}
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

export default function ProfilePage() {
  return (
    <Suspense fallback={null}>
      <ProfileForm />
    </Suspense>
  )
}
