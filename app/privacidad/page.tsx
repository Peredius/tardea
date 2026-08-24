import { LegalContent } from '@/components/LegalContent'

export default function PrivacyPage() {
  return (
    <LegalContent
      eyebrow="Datos personales"
      title="Política de privacidad"
      intro="Explicamos qué datos se recogen, para qué se usan y cómo puede gestionarlos cada usuario. Es una base inicial para adaptar antes del lanzamiento definitivo."
      sections={[
        {
          title: 'Datos que recogemos',
          content:
            'Podemos recoger datos de cuenta como correo electrónico, nombre, fecha de nacimiento, dirección, código postal, municipio, provincia, gustos musicales, favoritos, preferencias y actividad dentro de la plataforma.',
        },
        {
          title: 'Finalidad',
          content:
            'Usamos los datos para crear y gestionar la cuenta, personalizar recomendaciones, guardar favoritos, mejorar el buscador, facilitar comunicaciones solicitadas y ofrecer ventajas relacionadas con eventos.',
        },
        {
          title: 'Newsletter y comunicaciones',
          content:
            'Las comunicaciones comerciales se enviarán solo cuando el usuario haya dado su consentimiento. El usuario podrá darse de baja o cambiar sus preferencias en cualquier momento.',
        },
        {
          title: 'Derechos',
          content:
            'El usuario puede solicitar acceso, rectificación, eliminación, oposición, limitación o portabilidad de sus datos escribiendo al contacto que TARDEA habilite para privacidad.',
        },
      ]}
    />
  )
}
