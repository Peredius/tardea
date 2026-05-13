import { Sparkles, UsersRound } from 'lucide-react'

const creatorIdeas = [
  'Rooftops y planes con vistas',
  'Tardeos comerciales',
  'Brunch y planes de domingo',
]

export function CreatorsSection() {
  return (
    <section className="container-page py-8">
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
        <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 text-brand-500">
                <UsersRound className="h-5 w-5" />
              </span>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Proximamente
              </p>
            </div>

            <h2 className="mt-4 text-2xl font-bold tracking-tight text-white">
              Planes recomendados por creadores
            </h2>
            <p className="mt-3 max-w-2xl text-sm text-slate-400">
              Estamos preparando una seleccion de tardeos elegidos por perfiles
              de Madrid para descubrir planes con mas criterio social.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 md:max-w-sm md:justify-end">
            {creatorIdeas.map((idea) => (
              <span
                key={idea}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/60 px-3 py-2 text-xs font-medium text-slate-300"
              >
                <Sparkles className="h-3.5 w-3.5 text-brand-500" />
                {idea}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
