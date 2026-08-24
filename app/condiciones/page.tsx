import { LegalContent } from '@/components/LegalContent'

export default function TermsPage() {
  return (
    <LegalContent
      eyebrow="Condiciones"
      title="Condiciones de uso"
      intro="Estas condiciones regulan el acceso y uso de TARDEA por parte de usuarios y promotores."
      sections={[
        {
          title: 'Usuarios',
          content:
            'Los usuarios pueden buscar eventos, guardar favoritos, recibir recomendaciones y acceder a funciones sociales que TARDEA vaya incorporando.',
        },
        {
          title: 'Promotores',
          content:
            'Los promotores podrán crear fichas y enviar eventos para revisión. TARDEA podrá aprobar, modificar o rechazar eventos para asegurar que la información sea clara y adecuada.',
        },
        {
          title: 'Servicios de pago',
          content:
            'Los recursos, destacados, campañas o servicios promocionales para promotores se regularán con condiciones específicas cuando estén disponibles.',
        },
      ]}
    />
  )
}
