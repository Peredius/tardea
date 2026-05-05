import { redirect } from 'next/navigation'
const {
  data: { user },
} = await supabase.auth.getUser()

await supabase.from('events').insert({
  title,
  description,
  image_url,
  status: 'pending',
  user_id: user.id,
})

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
      <p className="text-white/70">
        Aquí cada sala podrá gestionar sus propios eventos.
      </p>

      <div className="mt-8 rounded-xl border border-white/10 p-6">
        <h2 className="text-xl font-semibold">Usuario conectado</h2>
        <p className="mt-2 text-white/70">{user.email}</p>
      </div>
    </main>
  )
}
