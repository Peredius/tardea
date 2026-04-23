import { areas } from '@/lib/data';

export function AreasSection() {
  return (
    <section id="zonas" className="container-page py-16">
      <div className="mb-8">
        <p className="text-sm font-semibold text-brand-500">SEO local</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight">Zonas que deberías cubrir</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {areas.map((area) => (
          <div key={area} className="card p-6">
            <h3 className="text-xl font-semibold text-white">Tardeo en {area}</h3>
            <p className="mt-2 text-sm text-slate-400">
              Página SEO ideal para captar búsquedas como “tardeo {area.toLowerCase()} hoy”, “fiesta tarde {area.toLowerCase()}” o “afterwork {area.toLowerCase()}”.
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
