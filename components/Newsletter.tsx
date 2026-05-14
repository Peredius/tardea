export function Newsletter() {
  return (
    <section id="newsletter" className="container-page py-16">
      <div className="card overflow-hidden p-8 md:p-10">
        <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <div>
            <p className="text-sm font-semibold text-brand-500">
              Captacion y fidelizacion
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">
              Recibe cada semana los mejores tardeos de Madrid
            </h2>
            <p className="mt-4 max-w-2xl text-slate-400">
              Apuntate para recibir recomendaciones, ofertas y descuentos
              relacionados con tus gustos. Podras darte de baja cuando quieras.
            </p>
          </div>
          <form className="grid gap-3">
            <input type="text" className="input" placeholder="Tu nombre" />
            <input type="email" className="input" placeholder="Tu email" />
            <label className="flex items-start gap-3 text-sm text-slate-400">
              <input
                type="checkbox"
                required
                className="mt-1 h-4 w-4 rounded border-white/20 bg-slate-900 accent-brand-500"
              />
              <span>
                Acepto recibir comunicaciones de TARDEA y he leido la{' '}
                <a href="/privacidad" className="text-brand-500 hover:underline">
                  politica de privacidad
                </a>
                .
              </span>
            </label>
            <button type="button" className="btn-primary">
              Quiero recibir planes
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}
