'use client'

import { MouseEvent, useEffect, useState } from 'react'
import { Heart } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export function FavoriteButton({
  eventId,
  eventProfileId,
  className = '',
  compact = true,
}: {
  eventId?: string | null
  eventProfileId?: string | null
  className?: string
  compact?: boolean
}) {
  const [userId, setUserId] = useState('')
  const [isFavorite, setIsFavorite] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadFavorite() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (cancelled) return

      const nextUserId = user?.id || ''
      setUserId(nextUserId)

      if (!nextUserId || (!eventId && !eventProfileId)) return

      if (eventProfileId) {
        const { data } = await supabase
          .from('event_profile_favorites')
          .select('event_profile_id')
          .eq('user_id', nextUserId)
          .eq('event_profile_id', eventProfileId)
          .maybeSingle()

        if (!cancelled) setIsFavorite(Boolean(data))
        return
      }

      const { data } = await supabase
        .from('favorites')
        .select('event_id')
        .eq('user_id', nextUserId)
        .eq('event_id', eventId)
        .maybeSingle()

      if (!cancelled) setIsFavorite(Boolean(data))
    }

    loadFavorite()

    return () => {
      cancelled = true
    }
  }, [eventId, eventProfileId])

  async function toggleFavorite(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    event.stopPropagation()

    if (!eventId && !eventProfileId) return

    if (!userId) {
      window.location.href = '/login?type=user'
      return
    }

    setLoading(true)

    if (eventProfileId) {
      if (isFavorite) {
        const { error } = await supabase
          .from('event_profile_favorites')
          .delete()
          .eq('user_id', userId)
          .eq('event_profile_id', eventProfileId)

        if (!error) setIsFavorite(false)
      } else {
        const { error } = await supabase.from('event_profile_favorites').insert({
          user_id: userId,
          event_profile_id: eventProfileId,
        })

        if (!error) setIsFavorite(true)
      }

      setLoading(false)
      return
    }

    if (isFavorite) {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('event_id', eventId)

      if (!error) setIsFavorite(false)
    } else {
      const { error } = await supabase.from('favorites').insert({
        user_id: userId,
        event_id: eventId,
      })

      if (!error) setIsFavorite(true)
    }

    setLoading(false)
  }

  if (!eventId && !eventProfileId) return null

  return (
    <button
      type="button"
      onClick={toggleFavorite}
      disabled={loading}
      aria-label={isFavorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}
      className={`inline-flex items-center justify-center rounded-full border border-white/15 bg-slate-950/55 text-white shadow-lg shadow-black/20 backdrop-blur transition hover:border-brand-500/70 hover:bg-brand-500/20 disabled:opacity-60 ${
        compact ? 'h-10 w-10' : 'h-12 w-12'
      } ${className}`}
    >
      <Heart
        className={`${compact ? 'h-5 w-5' : 'h-6 w-6'} ${
          isFavorite ? 'fill-brand-500 text-brand-500' : ''
        }`}
      />
    </button>
  )
}
