import { AreasSection } from '@/components/AreasSection';
import { FeaturedEvents } from '@/components/FeaturedEvents';
import { Filters } from '@/components/Filters';
import { Footer } from '@/components/Footer';
import { Hero } from '@/components/Hero';
import { Navbar } from '@/components/Navbar';
import { Newsletter } from '@/components/Newsletter';

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'TARDEA',
  url: 'https://www.tardea.com',
  description:
    'Buscador de tardeos, fiestas, rooftops, brunches y afterworks en Madrid.',
  inLanguage: 'es-ES',
};

export default function HomePage() {
  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <Navbar />
      <Hero /> 
      <Filters />
      <FeaturedEvents />
      <AreasSection />
      <section className="container-page pb-12" aria-labelledby="seo-tardeos-madrid">
        <div className="border-t border-white/10 pt-10">
          <h2 id="seo-tardeos-madrid" className="text-2xl font-bold text-white md:text-3xl">
            Tardeos en Madrid para cada tipo de plan
          </h2>
          <div className="mt-4 grid gap-5 text-sm leading-7 text-slate-400 md:grid-cols-2">
            <p>
              TARDEA reúne eventos y planes de tarde en Madrid para que puedas comparar fechas,
              zonas, estilos de música, edades y precios sin revisar decenas de páginas distintas.
              Encontrarás desde fiestas de reguetón y música comercial hasta sesiones remember,
              rooftops, brunches y afterworks.
            </p>
            <p>
              Consulta la agenda actualizada, elige el día en el calendario y abre cada ficha para
              ver el horario, la ubicación y el enlace oficial de entradas. Puedes buscar tardeos
              en Centro, Salamanca, Chamberí, Retiro, Moncloa y otras zonas de Madrid.
            </p>
          </div>
        </div>
      </section>
      <Newsletter />
      <Footer />
    </main>
  );
}
