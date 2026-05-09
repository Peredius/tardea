import Link from 'next/link';
import Image from 'next/image';
import { Search } from 'lucide-react';

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
          <a
  href="#eventos"
  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10 hover:text-white"
>
  <Search className="h-4 w-4" />
  Buscar
</a>
          <a href="#destacados" className="hover:text-white">Destacados</a>
          <a href="#zonas" className="hover:text-white">Zonas</a>
          <a href="#newsletter" className="hover:text-white">Newsletter</a>
        </nav>

       <div className="flex items-center gap-2">
  {/* PROMOTOR */}
  <Link
    href="/login?type=venue"
    className="text-sm text-slate-300 hover:text-white"
  >
    Promotor
  </Link>

  {/* USUARIO */}
  <Link
    href="/login?type=user"
    className="btn-primary"
  >
    Usuario
  </Link>
</div>
        
      </div>
    </header>
  );
}
