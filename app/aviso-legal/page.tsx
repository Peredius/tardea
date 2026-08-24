import { LegalContent } from '@/components/LegalContent'

export default function LegalNoticePage() {
  return (
    <LegalContent
      eyebrow="Información legal"
      title="Aviso legal"
      intro="Esta página recoge la información básica sobre la titularidad y uso de TARDEA. Antes del lanzamiento público conviene revisarla con una asesoría legal."
      sections={[
        {
          title: 'Titular del sitio',
          content:
            'TARDEA es una plataforma digital en desarrollo para descubrir tardeos, eventos y planes de ocio. Los datos definitivos del titular, NIF, domicilio y contacto legal deberán completarse antes del lanzamiento comercial.',
        },
        {
          title: 'Uso de la web',
          content:
            'Las personas usuarias se comprometen a utilizar la web de forma correcta, sin realizar acciones que puedan dañar el servicio, afectar a otros usuarios o vulnerar derechos de terceros.',
        },
        {
          title: 'Contenidos y eventos',
          content:
            'La información de eventos puede proceder de TARDEA, promotores o fuentes autorizadas. TARDEA podrá revisar, editar o retirar contenidos cuando sea necesario para mantener la calidad y seguridad de la plataforma.',
        },
      ]}
    />
  )
}
