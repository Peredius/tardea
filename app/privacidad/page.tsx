import { LegalContent } from '@/components/LegalContent'

export default function PrivacyPage() {
  return (
    <LegalContent
      eyebrow="Datos personales"
      title="Politica de privacidad"
      intro="Explicamos que datos se recogen, para que se usan y como puede gestionarlos cada usuario. Es una base inicial para adaptar antes del lanzamiento definitivo."
      sections={[
        {
          title: 'Datos que recogemos',
          content:
            'Podemos recoger datos de cuenta como correo electronico, nombre, fecha de nacimiento, direccion, codigo postal, municipio, provincia, gustos musicales, favoritos, preferencias y actividad dentro de la plataforma.',
        },
        {
          title: 'Finalidad',
          content:
            'Usamos los datos para crear y gestionar la cuenta, personalizar recomendaciones, guardar favoritos, mejorar el buscador, facilitar comunicaciones solicitadas y ofrecer ventajas relacionadas con eventos.',
        },
        {
          title: 'Newsletter y comunicaciones',
          content:
            'Las comunicaciones comerciales se enviaran solo cuando el usuario haya dado su consentimiento. El usuario podra darse de baja o cambiar sus preferencias en cualquier momento.',
        },
        {
          title: 'Derechos',
          content:
            'El usuario puede solicitar acceso, rectificacion, eliminacion, oposicion, limitacion o portabilidad de sus datos escribiendo al contacto que TARDEA habilite para privacidad.',
        },
      ]}
    />
  )
}
