'use client';

import { useEffect, useState } from 'react';
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
  const [previewUrl, setPreviewUrl] = useState('');
  const [message, setMessage] = useState('');
  const [description, setDescription] = useState('');
  const [perks, setPerks] = useState('');
  const [events, setEvents] = useState<any[]>([]);
  const [editingEvent, setEditingEvent] = useState<any | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: true });

    if (!error) setEvents(data || []);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

   let imageUrl = editingEvent?.cover || '';

    if (cover) {
  const fileName = `${Date.now()}-${cover.name}`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('events')
    .upload(fileName, cover);

  console.log('UPLOAD DATA:', uploadData);
  console.log('UPLOAD ERROR:', uploadError);

  if (uploadError) {
    setMessage(`Error subiendo imagen: ${uploadError.message}`);
    return;
  }

  const { data } = supabase.storage
    .from('events')
    .getPublicUrl(fileName);

  imageUrl = data.publicUrl;
}
    }

    const eventData = {
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
    };

    let error;

    if (editingEvent) {
      const { error: updateError } = await supabase
        .from('events')
        .update(eventData)
        .eq('id', editingEvent.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('events')
        .insert(eventData);
      error = insertError;
    }

    if (error) {
      setMessage('Error al guardar evento');
    } else {
      setMessage(
        editingEvent
          ? 'Evento actualizado correctamente'
          : 'Evento creado correctamente'
      );
      setEditingEvent(null);
      fetchEvents();

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
      setPreviewUrl('');
      setDescription('');
     setPerks('');
}
}

  return (
    <main className="container-page py-16">
      <h1 className="text-4xl font-bold">Panel admin TARDEA</h1>
      <p className="mt-3 text-slate-400">Crear y editar eventos</p>

      <form onSubmit={handleSubmit} className="card mt-8 max-w-2xl space-y-6 p-6">

        <input className="input" placeholder="Nombre del evento" value={title} onChange={(e) => setTitle(e.target.value)} />

        <select className="select" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">Tipo de evento</option>
          <option>Tardeo</option>
          <option>Rooftop</option>
          <option>Brunch</option>
          <option>Fitness Party</option>
          <option>Afterwork</option>
        </select>

        <select className="select" value={music} onChange={(e) => setMusic(e.target.value)}>
          <option value="">Estilo musical</option>
          <option>Indie</option>
          <option>Pop</option>
          <option>House</option>
          <option>Urbano</option>
          <option>Techno</option>
        </select>

        <select className="select" value={area} onChange={(e) => setArea(e.target.value)}>
          <option value="">Zona</option>
          <option>Centro</option>
          <option>Salamanca</option>
          <option>Retiro</option>
          <option value="Otra">Otra</option>
        </select>

        {area === 'Otra' && (
          <input className="input" placeholder="Zona personalizada" value={customArea} onChange={(e) => setCustomArea(e.target.value)} />
        )}

        <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />

        <input type="time" className="input" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        <input type="time" className="input" value={endTime} onChange={(e) => setEndTime(e.target.value)} />

        <input className="input" placeholder="Precio (€)" value={priceFrom} onChange={(e) => setPriceFrom(e.target.value)} />
        <input className="input" placeholder="Lugar" value={venue} onChange={(e) => setVenue(e.target.value)} />
        <input className="input" placeholder="Dirección" value={address} onChange={(e) => setAddress(e.target.value)} />

        <textarea className="input" placeholder="Descripción" value={description} onChange={(e) => setDescription(e.target.value)} />
        <input className="input" placeholder="Extras" value={perks} onChange={(e) => setPerks(e.target.value)} />

        <input
          type="file"
          accept="image/*"
          className="input"
          onChange={(e) => {
            const file = e.target.files?.[0] || null;
            setCover(file);
            setPreviewUrl(file ? URL.createObjectURL(file) : '');
          }}
        />

        {previewUrl && (
          <img src={previewUrl} className="h-56 w-full rounded-xl object-cover" />
        )}

        <button className="btn-primary w-full" type="submit">
          {editingEvent ? 'Guardar cambios' : 'Crear evento'}
        </button>

        {message && <p className="text-sm text-brand-500">{message}</p>}
      </form>

      <div className="mt-12">
        <h2 className="mb-4 text-2xl font-bold">Eventos creados</h2>

        {events.map((event) => (
          <div key={event.id} className="mb-3 flex justify-between rounded-xl bg-slate-800 p-4">
            <div>
              <p>{event.title}</p>
              <p className="text-sm text-slate-400">
                {new Date(event.date).toLocaleDateString('es-ES')}
              </p>
            </div>

            <button
              className="text-sm text-brand-500"
              onClick={() => {
                setEditingEvent({
  ...event,
  cover: event.cover?.startsWith('blob:') ? '' : event.cover
});
                setTitle(event.title);
                setVenue(event.venue);
                setArea(event.area);
                setDate(event.date);
                setStartTime(event.start_time);
                setEndTime(event.end_time);
                setType(event.type);
                setMusic(event.music?.[0] || '');
                setPriceFrom(event.price_from?.toString() || '');
                setPreviewUrl(event.cover?.startsWith('blob:') ? '' : event.cover);
                setCover(null);
                setDescription(event.description);
                setPerks(event.perks?.join(', ') || '');
              }}
            >
              Editar
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
