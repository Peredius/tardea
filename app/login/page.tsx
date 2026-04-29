'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      setMessage('Error al iniciar sesión');
    } else {
      window.location.href = '/admin';
    }
  }

  return (
    <main className="container-page py-16">
      <div className="card mx-auto max-w-md p-6">
        <h1 className="text-3xl font-bold">Acceso salas</h1>
        <p className="mt-2 text-slate-400">Entra para gestionar tus eventos.</p>

        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <input
            className="input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="input"
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button className="btn-primary w-full" type="submit">
            Entrar
          </button>

          {message && <p className="text-sm text-brand-500">{message}</p>}
        </form>
      </div>
    </main>
  );
}
