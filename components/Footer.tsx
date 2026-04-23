export function Footer() {
  return (
    <footer className="border-t border-white/10 py-10">
      <div className="container-page flex flex-col gap-4 text-sm text-slate-400 md:flex-row md:items-center md:justify-between">
        <p>© 2026 TardeoMadrid. Demo profesional lista para evolucionar a producto real.</p>
        <div className="flex gap-4">
          <span>Aviso legal</span>
          <span>Privacidad</span>
          <span>Contacto</span>
        </div>
      </div>
    </footer>
  );
}
