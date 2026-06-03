// ─────────────────────────────────────────────────────────────────────────────
// login/page.js — Página de inicio de sesión (Client Component)
//
// 'use client' significa que este componente se ejecuta en el NAVEGADOR.
// Necesitamos que sea client component porque usamos estado (useState) y
// eventos del usuario (onSubmit).
// ─────────────────────────────────────────────────────────────────────────────
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { login } from './actions' // importamos el Server Action

export default function LoginPage() {
  // useState guarda valores que, al cambiar, hacen que React vuelva a renderizar
  const [error,   setError]   = useState(null)  // mensaje de error o null
  const [loading, setLoading] = useState(false) // true mientras espera respuesta

  // useRouter nos da acceso a la navegación programática del browser
  const router = useRouter()

  async function handleSubmit(e) {
    e.preventDefault() // evita que el browser recargue la página al enviar el form

    setLoading(true) // desactiva el botón para evitar doble envío
    setError(null)   // limpia errores anteriores

    // Llamamos al Server Action. Aunque parece una función local, Next.js
    // internamente hace una petición POST al servidor y espera la respuesta.
    // FormData(e.target) recoge todos los campos del formulario automáticamente.
    const result = await login(new FormData(e.target))

    if (result?.error) {
      // Si el servidor retornó un error, lo mostramos y reactivamos el botón
      setError(result.error)
      setLoading(false)
    } else {
      // Login exitoso: navegamos al dashboard
      // router.push hace una navegación client-side (sin recargar la página)
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Divvy</h1>
          <p className="text-gray-400 mt-2">Inicia sesión en tu cuenta</p>
        </div>

        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
          {/* onSubmit llama a nuestra función en vez del comportamiento por defecto */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
              {/* name="email" es lo que FormData usa para identificar el campo */}
              <input
                type="email"
                name="email"
                required
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Contraseña</label>
              <input
                type="password"
                name="password"
                required
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition"
                placeholder="••••••••"
              />
            </div>

            {/* Renderizado condicional: solo muestra el error si existe */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* disabled={loading} evita que el usuario envíe el form dos veces */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-medium rounded-xl transition"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-6">
            ¿No tienes cuenta?{' '}
            <Link href="/register" className="text-indigo-400 hover:text-indigo-300">
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
