import { BadgePercent, CalendarCheck, MapPinned, Music4 } from 'lucide-react'

const discoveryPoints = [
  {
    icon: CalendarCheck,
    title: 'Planes actualizados',
    text: 'Encuentra tardeos activos segun la fecha que elijas.',
  },
  {
    icon: Music4,
    title: 'Tardeos por musica y zona',
    text: 'Filtra por ambiente, estilo musical, precio y barrio.',
  },
  {
    icon: BadgePercent,
    title: 'Ofertas para usuarios registrados',
    text: 'Preparamos ventajas para que recibas planes que encajen contigo.',
  },
]

const upcomingAreas = ['Salamanca', 'Chamberi', 'Malasana', 'La Latina', 'Centro', 'Chamartin']

export function AreasSection() {
  return (
    <section id="zonas" className="container-page py-12">
      <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <div className="card p-6 md:p-8">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-500/15 text-brand-500">
            <MapPinned className="h-5 w-5" />
          </div>

          <h2 className="mt-5 text-3xl font-bold tracking-tight text-white">
            Encuentra tu tardeo ideal
          </h2>

          <p className="mt-3 max-w-2xl text-slate-400">
            Elige fecha, zona, musica y presupuesto para descubrir planes de
            tardeo en Madrid.
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {discoveryPoints.map((item) => {
              const Icon = item.icon

              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/10 bg-slate-900/60 p-4"
                >
                  <Icon className="h-5 w-5 text-brand-500" />
                  <h3 className="mt-3 font-semibold text-white">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-400">{item.text}</p>
                </div>
              )
            })}
          </div>
        </div>

        <div className="card flex flex-col justify-between p-6 md:p-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-500">
              Proximamente
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">
              Zonas de Madrid con eventos
            </h2>

            <p className="mt-3 text-sm text-slate-400">
              Activaremos paginas por zona para descubrir tardeos cercanos y
              mejorar las busquedas locales.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {upcomingAreas.map((area) => (
                <span key={area} className="badge">
                  {area}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
