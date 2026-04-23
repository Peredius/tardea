import { Calendar, MapPin, Music4, Ticket } from 'lucide-react';

export function Hero() {
  return (
    <section className="bg-hero-gradient">
      <div className="container-page grid gap-10 py-16 md:grid-cols-[1.2fr_0.8fr] md:py-24">
        <div>
          <span className="badge mb-6">Agenda premium de tardeo en Madrid</span>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-white md:text-6xl">
            Encuentra el mejor tardeo de Madrid por fecha, música, zona y ambiente.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-slate-300">
            Una plataforma pensada para descubrir rooftops, afterworks, brunches y eventos de tarde con filtros útiles, diseño cuidado y fichas listas para reservar.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 text-sm text-slate-200">
            <span className="badge"><Calendar className="mr-2 h-4 w-4" /> Calendario</span>
            <span className="badge"><Music4 className="mr-2 h-4 w-4" /> Música y ambiente</span>
            <span className="badge"><MapPin className="mr-2 h-4 w-4" /> Zonas de Madrid</span>
            <span className="badge"><Ticket className="mr-2 h-4 w-4" /> Precio y entradas</span>
          </div>
        </div>
        <div className="card p-6">
          <div className="mb-4">
            <p className="text-sm font-semibold text-brand-500">MVP profesional</p>
            <h2 className="mt-1 text-2xl font-semibold">Base lista para crecer</h2>
          </div>
          <div className="space-y-4 text-sm text-slate-300">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="font-semibold text-white">Arquitectura preparada para producción</p>
              <p className="mt-1">Next.js App Router, componentes reutilizables y datos centralizados para conectar Supabase o PostgreSQL.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="font-semibold text-white">Diseño premium y responsive</p>
              <p className="mt-1">Enfocado a móvil, velocidad, SEO local y crecimiento por barrios, música y categorías.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="font-semibold text-white">Monetización preparada</p>
              <p className="mt-1">Eventos destacados, afiliación con entradas, patrocinados y perfiles de promotores en la siguiente fase.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
