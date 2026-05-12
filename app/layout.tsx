import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'TARDEA | Buscador de tardeos en Madrid',
  description:
    'Descubre tardeos, rooftops, brunches y afterworks en Madrid con filtros por fecha, musica, zona, edad y precio.',
  icons: {
    icon: '/tardea-icon.svg',
    shortcut: '/tardea-icon.svg',
    apple: '/tardea-icon.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
