'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminPage() {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [venue, setVenue] = useState('');
  const [area, setArea] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState('Tardeo');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const { error } = await supabase.from('events').insert({
      title,
      slug,
      venue,
      area,
      address: '',
      date,
      start_time: '17:00',
      end_time: '23:00',
      type,
      music: ['Pop'],
      audience: '25-35',
      price_from: 0,
      cover: '',
      featured: false,
      description: '',
      perks: [],
      published: true
    });

    if (error) {
      setMessage('Error al crear evento');
      console.error(error);
    } else {
      setMessage('Evento creado correctamente');
      setTitle('');
      setSlug('');
      setVenue('');
      setArea('');
      setDate('');
    }
  }

  return (
    <main className="container-page py-16">
      <h1 className="text-4xl font-bold">Panel admin TARDEA</h1>
      <p className="mt-3 text-slate-400">Crear eventos nuevos desde la web.</p>

      <form onSubmit={handleSubmit} className="card mt-8 max-w-2xl space-y-4 p-6">
        <input className="input" placeholder="Nombre del evento" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input className="input" placeholder="slug-evento" value={slug} onChange={(e) => setSlug(e.target.value)} />
        <input className="input" placeholder="Lugar / venue" value={venue} onChange={(e) => setVenue(e.target.value)} />
        <input className="input" placeholder="Zona" value={area} onChange={(e) => setArea(e.target.value)} />
        <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />

        <select className="select" value={type} onChange={(e) => setType(e.target.value)}>
          <option>Tardeo</option>
          <option>Rooftop</option>
          <option>Brunch</option>
          <option>Fitness Party</option>
          <option>Afterwork</option>
          <option>Fiesta temática</option>
        </select>

        <button className="btn-primary" type="submit">
          Crear evento
        </button>

        {message && <p className="text-sm text-brand-500">{message}</p>}
      </form>
    </main>
  );
}
