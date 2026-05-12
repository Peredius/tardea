import { Instagram } from 'lucide-react'

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      <path d="M16.6 2c.3 2.5 1.7 4.1 4.1 4.3v3.1c-1.4.1-2.7-.3-4-1.1v5.9c0 7.5-8.2 9.8-11.5 4.4-2.1-3.5-.8-9.6 5.9-9.9v3.3c-.5.1-1 .2-1.5.4-1.5.5-2.3 1.9-1.9 3.3.8 2.8 5.5 3.6 5.5-1.8V2h3.4z" />
    </svg>
  )
}

export function Footer() {
  return (
    <footer className="border-t border-white/10 py-10">
      <div className="container-page flex flex-col gap-4 text-sm text-slate-400 md:flex-row md:items-center md:justify-between">
        <p>© 2026 TARDEA. Demo profesional lista para evolucionar a producto real.</p>

        <div className="flex items-center gap-4">
          <span>Aviso legal</span>
          <span>Privacidad</span>
          <span>Contacto</span>
          <a
            href="https://www.instagram.com/tardea"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram de TARDEA"
            className="text-slate-400 transition hover:text-white"
          >
            <Instagram className="h-5 w-5" />
          </a>
          <a
            href="https://www.tiktok.com/@tardea"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="TikTok de TARDEA"
            className="text-slate-400 transition hover:text-white"
          >
            <TikTokIcon className="h-5 w-5" />
          </a>
        </div>
      </div>
    </footer>
  )
}
