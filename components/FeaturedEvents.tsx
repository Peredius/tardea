import Link from 'next/link';
import { getFeaturedEvents } from '@/lib/data';

export function FeaturedEvents() {
  const featured = getFeaturedEvents();

  return (
    <section id="destacados" className="container-page py-6 md:py-10">
      <div className="mb-8">
        <p className="text-sm font-semibold text-brand-500">Selección editorial</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight">Eventos destacados de la semana</h2>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {featured.map((event) => (
          <article key={event.slug} className="card overflow-hidden">
            <div className="grid md:grid-cols-[1fr_1.05fr]">
              <div className="min-h-72 bg-cover bg-center" style={{ backgroundImage: `url(${event.cover})` }} />
              <div className="p-6 md:p-8">
                <span className="badge mb-4">Top recomendado</span>
                <h3 className="text-2xl font-semibold">{event.title}</h3>
                <p className="mt-3 text-sm text-slate-300">{event.venue} · {event.area}</p>
                <p className="mt-4 text-slate-400">{event.description}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {event.perks.map((perk) => <span key={perk} className="badge">{perk}</span>)}
                </div>
                <Link href={`/eventos/${event.slug}`} className="btn-primary mt-6">Ver ficha completa</Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
