import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user')
    .select('username')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Divvy</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Hola, {profile?.username}
            </span>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="text-sm text-gray-500 hover:text-gray-700 transition"
              >
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </nav>

      {/* Contenido */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Tus grupos</h2>
            <p className="text-gray-500 mt-1">
              Administra y divide gastos con tus amigos
            </p>
          </div>
          <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition">
            + Crear grupo
          </button>
        </div>

        {/* Empty state */}
        <div className="text-center py-16">
          <div className="text-5xl mb-4">💸</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No tienes grupos todavía
          </h3>
          <p className="text-gray-500 mb-6">
            Crea un grupo para empezar a dividir gastos con tus amigos
          </p>
          <button className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition">
            Crear mi primer grupo
          </button>
        </div>
      </main>
    </div>
  )
}