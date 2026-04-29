import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CalendarDays, Clock3, Euro, MapPin, Music4, Sparkles, Users } from 'lucide-react';
import { Footer } from '@/components/Footer';
import { Navbar } from '@/components/Navbar';
import { supabase } from '@/lib/supabase';

export default async function EventDetailPage({ params }: { params: { slug: string } }) {
  const { data } = await supabase
    .from('events')
    .select('*')
    .eq('slug', params.slug)
    .single();

  if (!data) notFound();

  const event = {
    slug: data.slug,
    title: data.title,
    venue: data.venue,
    area: data.area,
    address: data.address,
    date: data.date,
    startTime: data.start_time,
    endTime: data.end_time,
    type: data.type,
    music: data.music || [],
    audience: data.audience,
    priceFrom: data.price_from,
    cover: data.cover,
    description: data.description,
    perks: data.perks || [],
    status: data.status
  };

  return (
    <main>
      <Navbar />

      <section className="relative overflow-hidden border-b border-white/10">
        {event.cover && (
          <div className="absolute inset-0 bg-cover bg-center opacity-25" style={{ backgroundImage: `url(${event.cover})` }} />
        )}

        <div className="container-page relative py-16 md:py-24">
          <Link href="/" className="btn-secondary mb-8 inline-flex">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver
          </Link>

          {event.status === 'pending' && (
            <div className="mb-4 rounded-xl bg-yellow-500/20 px-4 py-2 text-sm text-yellow-200">
              Evento pendiente de aprobación
            </div>
          )}

          <div className="max-w-3xl">
            <span className="badge mb-4">{event.type}</span>
            <h1 className="text-4xl font-bold tracking-tight md:text-6xl">{event.title}</h1>
            <p className="mt-5 text-lg text-slate-300">{event.description}</p>
          </div>
        </div>
      </section>

      <section className="container-page grid gap-8 py-16 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-2xl font-semibold">Detalles del evento</h2>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <CalendarDays className="mb-2 h-5 w-5 text-brand-500" />
                <p className="font-medium">Fecha</p>
                <p className="text-sm text-slate-400">{new Date(event.date).toLocaleDateString('es-ES')}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <Clock3 className="mb-2 h-5 w-5 text-brand-500" />
                <p className="font-medium">Horario</p>
                <p className="text-sm text-slate-400">
                  {event.startTime?.slice(0, 5)} - {event.endTime?.slice(0, 5)}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <MapPin className="mb-2 h-5 w-5 text-brand-500" />
                <p className="font-medium">Ubicación</p>
                <p className="text-sm text-slate-400">{event.venue}, {event.address}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <Euro className="mb-2 h-5 w-5 text-brand-500" />
                <p className="font-medium">Precio</p>
                <p className="text-sm text-slate-400">
                  {event.priceFrom === 0 ? 'Entrada gratis' : `Desde ${event.priceFrom}€`}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <Music4 className="mb-2 h-5 w-5 text-brand-500" />
                <p className="font-medium">Música</p>
                <p className="text-sm text-slate-400">{event.music.join(', ')}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <Users className="mb-2 h-5 w-5 text-brand-500" />
                <p className="font-medium">Público</p>
                <p className="text-sm text-slate-400">{event.audience}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-2xl font-semibold">Qué hace especial este plan</h2>
            <div className="mt-5 flex flex-wrap gap-3">
              {event.perks.map((perk: string) => (
                <span key={perk} className="badge">
                  <Sparkles className="mr-2 h-4 w-4" /> {perk}
                </span>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="card p-6">
            <h3 className="text-xl font-semibold">Reserva o compra entradas</h3>
            <p className="mt-3 text-sm text-slate-400">
              En producción, aquí conectaríamos Eventbrite, Fourvenues, Xceed o una URL directa del organizador.
            </p>
            <a href="#" className="btn-primary mt-6 w-full">Comprar entradas</a>
            <button className="btn-secondary mt-3 w-full">Guardar en favoritos</button>
          </div>
        </aside>
      </section>

      <Footer />
    </main>
  );
}
