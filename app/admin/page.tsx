'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

function generateSlug(title: string, date: string) {
  const cleanTitle = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return date ? `${cleanTitle}-${date}` : cleanTitle;
}

export default function AdminPage() {
  const [title, setTitle] = useState('');
  const [venue, setVenue] = useState('');
  const [area, setArea] = useState('');
  const [customArea, setCustomArea] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState('');
  const [address, setAddress] = useState('');
  const [startTime, setStartTime] = useState('17:00');
  const [endTime, setEndTime] = useState('23:00');
  const [priceFrom, setPriceFrom] = useState('');
  const [music, setMusic] = useState('');
  const [cover, setCover] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [perks, setPerks] = useState('');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    let imageUrl = '';

    if (cover) {
      const fileName = `${Date.now()}-${cover.name}`;

      const { error: uploadError } = await supabase.storage
        .from('events')
        .upload(fileName, cover);

      if (uploadError) {
        console.error(uploadError);
      } else {
        const { data } = supabase.storage.from('events').getPublicUrl(fileName);
        imageUrl = data.publicUrl;
      }
    }

    const { error } = await supabase.from('events').insert({
      title,
      slug: generateSlug(title, date),
      venue,
      area: area === 'Otra' ? customArea : area,
      address,
      date,
      start_time: startTime,
      end_time: endTime,
      type,
      music: music ? [music] : [],
      audience: '25-35',
      price_from: priceFrom ? Number(priceFrom) : 0,
      cover: imageUrl,
      featured: false,
      description,
      perks: perks ? perks.split(',').map((p) => p.trim()) : [],
      published: true
    });

    if (error) {
      setMessage('Error al crear evento');
      console.error(error);
    } else {
      setMessage('Evento creado correctamente');
      setTitle('');
      setVenue('');
      setArea('');
      setCustomArea('');
      setDate('');
      setType('');
      setAddress('');
      setStartTime('17:00');
      setEndTime('23:00');
      setPriceFrom('');
      setMusic('');
      setCover(null);
      setDescription('');
      setPerks('');
    }
  }

  return (
    <main className="container-page py-16">
      <h1 className="text-4xl font-bold">Panel admin TARDEA</h1>
      <p className="mt-3 text-slate-400">Crear eventos nuevos desde la web.</p>

      <form onSubmit={handleSubmit} className="card mt-8 max-w-2xl space-y-4 p-6">
        <input className="input" placeholder="Nombre del evento" value={title} onChange={(e) => setTitle(e.target.value)} />

        <select className="select" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">Tipo de evento</option>
          <option value="Tardeo">Tardeo</option>
          <option value="Rooftop">Rooftop</option>
          <option value="Brunch">Brunch</option>
          <option value="Fitness Party">Fitness Party</option>
          <option value="Afterwork">Afterwork</option>
          <option value="Fiesta temática">Fiesta temática</option>
        </select>

        <select className="select" value={music} onChange={(e) => setMusic(e.target.value)}>
          <option value="">Estilo musical</option>
          <option>Pop</option>
          <option>House</option>
          <option>Reggaetón</option>
          <option>Flamenco</option>
          <option>Techno</option>
          <option>Indie</option>
        </select>

        <input className="input" placeholder="Lugar / venue" value={venue} onChange={(e) => setVenue(e.target.value)} />

        <select className="select" value={area} onChange={(e) => setArea(e.target.value)}>
          <option value="">Selecciona zona</option>
          <option>Centro</option>
          <option>Salamanca</option>
          <option>Retiro</option>
          <option>El Pardo</option>
          <option value="Otra">Otra zona</option>
        </select>

        {area === 'Otra' && (
          <input className="input" placeholder="Escribe la zona" value={customArea} onChange={(e) => setCustomArea(e.target.value)} />
        )}

        <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <input className="input" placeholder="Dirección" value={address} onChange={(e) => setAddress(e.target.value)} />

        <input className="input" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        <input className="input" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />

        <input className="input" placeholder="Precio desde (€)" value={priceFrom} onChange={(e) => setPriceFrom(e.target.value)} />

        <input type="file" accept="image/*" onChange={(e) => setCover(e.target.files?.[0] || null)} />

        <textarea className="input" placeholder="Descripción" value={description} onChange={(e) => setDescription(e.target.value)} />

        <input className="input" placeholder="Perks (coma separados)" value={perks} onChange={(e) => setPerks(e.target.value)} />

        <button className="btn-primary" type="submit">
          Crear evento
        </button>

        {message && <p className="text-sm text-brand-500">{message}</p>}
      </form>
    </main>
  );
}
