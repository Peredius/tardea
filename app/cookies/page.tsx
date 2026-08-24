import { LegalContent } from '@/components/LegalContent'

export default function CookiesPage() {
  return (
    <LegalContent
      eyebrow="Cookies"
      title="Política de cookies"
      intro="Esta página explica el uso previsto de cookies y tecnologías similares en TARDEA."
      sections={[
        {
          title: 'Cookies necesarias',
          content:
            'La web puede usar cookies o almacenamiento local necesarios para mantener la sesión, recordar preferencias básicas y proteger el acceso a zonas privadas.',
        },
        {
          title: 'Analítica y mejora',
          content:
            'Más adelante TARDEA podrá incorporar herramientas de analítica para entender el uso de la web y mejorar la experiencia. Cuando proceda, se solicitará consentimiento.',
        },
        {
          title: 'Gestión',
          content:
            'El usuario puede configurar o bloquear cookies desde su navegador. Algunas funciones pueden dejar de estar disponibles si se desactivan cookies necesarias.',
        },
      ]}
    />
  )
}
