import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default async function DashboardPage() {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-4">Panel de sala</h1>

      <div className="mt-8 rounded-xl border border-white/10 p-6">
        <h2 className="text-xl font-semibold">Usuario conectado</h2>
        <p className="mt-2 text-white/70">{user.email}</p>
      </div>

      <div className="mt-8 space-y-4">
        <h2 className="text-xl font-semibold">Mis eventos</h2>

        {events?.length === 0 && (
          <p className="text-white/60">No tienes eventos todavía</p>
        )}

        {events?.map((event) => (
          <div key={event.id} className="border border-white/10 p-4 rounded">
            <h3 className="font-semibold">{event.title}</h3>
            <p className="text-white/60">{event.status}</p>
          </div>
        ))}
      </div>
    </main>
  )
}
