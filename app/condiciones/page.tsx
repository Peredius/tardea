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
            'Los promotores podran crear fichas y enviar eventos para revision. TARDEA podra aprobar, modificar o rechazar eventos para asegurar que la informacion sea clara y adecuada.',
        },
        {
          title: 'Servicios de pago',
          content:
            'Los recursos, destacados, campanas o servicios promocionales para promotores se regularan con condiciones especificas cuando esten disponibles.',
        },
      ]}
    />
  )
}
