'use client'

import { useEffect, useState } from 'react'

const COOKIE_CONSENT_KEY = 'tardea_cookie_consent'

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(localStorage.getItem(COOKIE_CONSENT_KEY) !== 'accepted')
  }, [])

  function acceptCookies() {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted')
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4 sm:px-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 rounded-2xl border border-white/10 bg-slate-950/95 p-4 text-sm text-slate-300 shadow-2xl shadow-black/40 backdrop-blur md:flex-row md:items-center md:justify-between">
        <p className="leading-6">
          Usamos cookies necesarias para que TARDEA funcione correctamente y
          mejorar la experiencia. Puedes leer mas en nuestra{' '}
          <a href="/cookies" className="font-semibold text-brand-500 hover:underline">
            politica de cookies
          </a>
          .
        </p>

        <button
          type="button"
          onClick={acceptCookies}
          className="shrink-0 rounded-full bg-brand-500 px-5 py-2 text-sm font-bold text-white transition hover:bg-brand-600"
        >
          Aceptar
        </button>
      </div>
    </div>
  )
}
