import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TardeoMadrid · Buscador de eventos de tardeo en Madrid',
  description: 'Descubre tardeos, rooftops, brunches y afterworks en Madrid con filtros por fecha, música, zona, edad y precio.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
