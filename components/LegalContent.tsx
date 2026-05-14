type LegalContentProps = {
  eyebrow: string
  title: string
  intro: string
  sections: {
    title: string
    content: string
  }[]
}

export function LegalContent({
  eyebrow,
  title,
  intro,
  sections,
}: LegalContentProps) {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="container-page py-16 md:py-24">
        <a
          href="/"
          className="text-sm font-semibold uppercase tracking-[0.35em] text-brand-500"
        >
          Volver
        </a>

        <div className="mt-8 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-brand-500">
            {eyebrow}
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">
            {title}
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-300">{intro}</p>
        </div>

        <div className="mt-10 grid gap-5">
          {sections.map((section) => (
            <article key={section.title} className="card p-6">
              <h2 className="text-2xl font-bold">{section.title}</h2>
              <p className="mt-3 leading-7 text-slate-400">
                {section.content}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
