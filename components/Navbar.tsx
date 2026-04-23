import Link from 'next/link';
import Image from 'next/image';

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center">
          <Image
            src="/logo-tardea-web.png"
            alt="TARDEA"
            width={140}
            height={40}
            className="h-14 w-auto"
          />
        </Link>

        <nav className="hidden gap-8 text-sm text-slate-300 md:flex">
          <a href="#explorar" className="hover:text-white">Explorar</a>
          <a href="#destacados" className="hover:text-white">Destacados</a>
          <a href="#zonas" className="hover:text-white">Zonas</a>
          <a href="#newsletter" className="hover:text-white">Newsletter</a>
        </nav>

        <a href="#explorar" className="btn-secondary hidden md:inline-flex">
          Ver eventos
        </a>
      </div>
    </header>
  );
}
