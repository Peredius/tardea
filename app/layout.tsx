import './globals.css'
import type { Metadata, Viewport } from 'next'
import { CookieBanner } from '@/components/CookieBanner'
import { MobileAppNav } from '@/components/MobileAppNav'
import { PwaRegistrar } from '@/components/PwaRegistrar'

export const metadata: Metadata = {
  metadataBase: new URL('https://www.tardea.com'),
  applicationName: 'TARDEA.',
  title: 'TARDEA | Buscador de tardeos en Madrid',
  description:
    'Descubre tardeos, rooftops, brunches y afterworks en Madrid con filtros por fecha, musica, zona, edad y precio.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/tardea-icon.svg',
    shortcut: '/tardea-icon.svg',
    apple: '/tardea-app-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'TARDEA.',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: 'TARDEA | Planes de tarde en Madrid',
    description:
      'Encuentra tardeos, rooftops, brunches y afterworks por fecha, musica, zona, edad y precio.',
    siteName: 'TARDEA',
    type: 'website',
    locale: 'es_ES',
    images: ['/logotardeaweb.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TARDEA | Planes de tarde en Madrid',
    description:
      'Encuentra tardeos, rooftops, brunches y afterworks por fecha, musica, zona, edad y precio.',
    images: ['/logotardeaweb.png'],
  },
}

export const viewport: Viewport = {
  themeColor: '#050816',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        {children}
        <MobileAppNav />
        <CookieBanner />
        <PwaRegistrar />
      </body>
    </html>
  )
}
