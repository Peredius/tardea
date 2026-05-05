import Link from 'next/link';
import Image from 'next/image';

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center">
         <Image
  src="/logotardeaweb.png"
  alt="TARDEA"
  width={140}
  height={40}
  priority
/>
        </Link>

        <nav className="hidden gap-8 text-sm text-slate-300 md:flex">
          <a href="#explorar" className="hover:text-white">Explorar</a>
          <a href="#destacados" className="hover:text-white">Destacados</a>
          <a href="#zonas" className="hover:text-white">Zonas</a>
          <a href="#newsletter" className="hover:text-white">Newsletter</a>
        </nav>

        <div className="flex items-center gap-3">
  <a
    href="/login?type=user"
    className="text-sm text-slate-300 hover:text-white transition"
  >
    Usuario
  </a>

  <a
    href="/login?type=venue"
    className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition"
  >
    Promotor
  </a>
</div>
        
        <a href="#explorar" className="btn-secondary hidden md:inline-flex">
          Ver eventos
        </a>
      </div>
    </header>
  );
}
