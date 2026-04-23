export function Newsletter() {
  return (
    <section id="newsletter" className="container-page py-16">
      <div className="card overflow-hidden p-8 md:p-10">
        <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <div>
            <p className="text-sm font-semibold text-brand-500">Captación y fidelización</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">Recibe cada semana los mejores tardeos de Madrid</h2>
            <p className="mt-4 max-w-2xl text-slate-400">
              Esta sección está pensada para convertir tráfico SEO y social en base de datos propia. En producción la conectaríamos con Brevo, MailerLite o ConvertKit.
            </p>
          </div>
          <form className="grid gap-3">
            <input type="text" className="input" placeholder="Tu nombre" />
            <input type="email" className="input" placeholder="Tu email" />
            <button type="button" className="btn-primary">Quiero recibir planes</button>
          </form>
        </div>
      </div>
    </section>
  );
}
