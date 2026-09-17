'use client'

import { supabase } from '@/lib/supabase'

const SESSION_KEY = 'tardea_analytics_session_id'

export type AnalyticsEventName =
  | 'calendar_search'
  | 'text_search'
  | 'event_card_open'
  | 'event_detail_whatsapp'
  | 'event_detail_ticket'
  | 'event_detail_favorite_date'
  | 'event_detail_favorite_plan'
  | 'event_detail_all_dates'
  | 'favorite_button_toggle'

type TrackPayload = {
  targetType?: string
  targetId?: string | null
  metadata?: Record<string, unknown>
}

function getSessionId() {
  if (typeof window === 'undefined') return ''

  const currentSessionId = localStorage.getItem(SESSION_KEY)
  if (currentSessionId) return currentSessionId

  const nextSessionId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`

  localStorage.setItem(SESSION_KEY, nextSessionId)
  return nextSessionId
}

async function sendEvent(eventName: AnalyticsEventName, payload: TrackPayload) {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (typeof window === 'undefined') return

  const body = JSON.stringify({
    eventName,
    path: window.location.pathname,
    sessionId: getSessionId(),
    targetType: payload.targetType || null,
    targetId: payload.targetId || null,
    metadata: payload.metadata || {},
  })

  fetch('/api/analytics/events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : {}),
    },
    body,
    keepalive: true,
  }).catch(() => {
    // Analytics must never interrupt the user flow.
  })
}

export function trackEvent(eventName: AnalyticsEventName, payload: TrackPayload = {}) {
  if (typeof window === 'undefined') return

  void sendEvent(eventName, payload).catch(() => {
    // Analytics must never interrupt the user flow.
  })
}
