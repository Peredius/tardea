import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default async function DashboardPage() {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-4">Panel de sala</h1>

      <div className="mt-8 rounded-xl border border-white/10 p-6">
        <h2 className="text-xl font-semibold">Usuario conectado</h2>
        <p className="mt-2 text-white/70">{user.email}</p>
      </div>
    </main>
  )
}
