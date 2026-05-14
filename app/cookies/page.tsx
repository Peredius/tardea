import { LegalContent } from '@/components/LegalContent'

export default function CookiesPage() {
  return (
    <LegalContent
      eyebrow="Cookies"
      title="Politica de cookies"
      intro="Esta pagina explica el uso previsto de cookies y tecnologias similares en TARDEA."
      sections={[
        {
          title: 'Cookies necesarias',
          content:
            'La web puede usar cookies o almacenamiento local necesarios para mantener la sesion, recordar preferencias basicas y proteger el acceso a zonas privadas.',
        },
        {
          title: 'Analitica y mejora',
          content:
            'Mas adelante TARDEA podra incorporar herramientas de analitica para entender el uso de la web y mejorar la experiencia. Cuando proceda, se solicitara consentimiento.',
        },
        {
          title: 'Gestion',
          content:
            'El usuario puede configurar o bloquear cookies desde su navegador. Algunas funciones pueden dejar de estar disponibles si se desactivan cookies necesarias.',
        },
      ]}
    />
  )
}
