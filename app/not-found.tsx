import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="container-page flex min-h-screen flex-col items-center justify-center text-center">
      <p className="text-sm font-semibold text-brand-500">404</p>
      <h1 className="mt-3 text-4xl font-bold">Evento no encontrado</h1>
      <p className="mt-4 max-w-md text-slate-400">La ruta existe en el proyecto, pero este slug no tiene datos asociados todavía.</p>
      <Link href="/" className="btn-primary mt-8">Volver al inicio</Link>
    </main>
  );
}
