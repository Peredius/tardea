import { LegalContent } from '@/components/LegalContent'

export default function LegalNoticePage() {
  return (
    <LegalContent
      eyebrow="Informacion legal"
      title="Aviso legal"
      intro="Esta pagina recoge la informacion basica sobre la titularidad y uso de TARDEA. Antes del lanzamiento publico conviene revisarla con una asesoria legal."
      sections={[
        {
          title: 'Titular del sitio',
          content:
            'TARDEA es una plataforma digital en desarrollo para descubrir tardeos, eventos y planes de ocio. Los datos definitivos del titular, NIF, domicilio y contacto legal deberan completarse antes del lanzamiento comercial.',
        },
        {
          title: 'Uso de la web',
          content:
            'Las personas usuarias se comprometen a utilizar la web de forma correcta, sin realizar acciones que puedan danar el servicio, afectar a otros usuarios o vulnerar derechos de terceros.',
        },
        {
          title: 'Contenidos y eventos',
          content:
            'La informacion de eventos puede proceder de TARDEA, promotores o fuentes autorizadas. TARDEA podra revisar, editar o retirar contenidos cuando sea necesario para mantener la calidad y seguridad de la plataforma.',
        },
      ]}
    />
  )
}
