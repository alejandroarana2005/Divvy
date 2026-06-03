// ─────────────────────────────────────────────────────────────────────────────
// auth/signout/route.js — Endpoint para cerrar sesión
//
// En Next.js, un archivo llamado route.js define un "Route Handler": una API
// tradicional (como Express) en vez de una página. Exportamos funciones con
// el nombre del método HTTP que manejan (GET, POST, etc.).
//
// El formulario de "Cerrar sesión" en el navbar hace un POST a /auth/signout,
// lo que llama a esta función.
// ─────────────────────────────────────────────────────────────────────────────

import { redirect } from 'next/navigation'
import { clearSessionCookie } from '@/lib/auth'

export async function POST() {
  // Borramos la cookie de sesión — el usuario queda desautenticado
  await clearSessionCookie()

  // Redirigimos al login
  redirect('/login')
}
