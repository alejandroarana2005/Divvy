// ─────────────────────────────────────────────────────────────────────────────
// lib/auth.js — Seguridad: contraseñas y sesión de usuario
// ─────────────────────────────────────────────────────────────────────────────

import crypto from 'crypto'       // módulo nativo de Node.js para criptografía
import { cookies } from 'next/headers' // API de Next.js para leer/escribir cookies

// ── Manejo de contraseñas ─────────────────────────────────────────────────────
//
// NUNCA guardamos la contraseña en texto plano. Usamos un hash:
// una función matemática de un solo sentido — fácil de calcular,
// imposible de revertir.
//
// Para defendernos de ataques de "rainbow table" (tablas precomputadas de hashes),
// agregamos una "sal": un valor aleatorio único por usuario que se mezcla con la
// contraseña antes de hashear. Así dos usuarios con la misma contraseña tienen
// hashes completamente distintos.

export function hashPassword(password) {
  // Generamos 16 bytes aleatorios y los convertimos a texto hexadecimal (32 chars)
  const salt = crypto.randomBytes(16).toString('hex')

  // HMAC-SHA256: algoritmo criptográfico que combina la sal con la contraseña
  const hash = crypto.createHmac('sha256', salt).update(password).digest('hex')

  // Guardamos "sal:hash" juntos para poder verificar la contraseña después
  return `${salt}:${hash}`
}

export function verifyPassword(password, stored) {
  // Separamos la sal y el hash que guardamos al registrar
  const [salt, hash] = stored.split(':')

  // Aplicamos el mismo algoritmo con la contraseña que el usuario escribió
  const candidate = crypto.createHmac('sha256', salt).update(password).digest('hex')

  // Si los hashes coinciden, la contraseña es correcta
  return candidate === hash
}

// ── Manejo de sesión con cookies ──────────────────────────────────────────────
//
// Una "sesión" es la forma de recordar que un usuario está logueado.
// Usamos una cookie HTTP: un pequeño dato que el servidor guarda en el
// navegador y que el navegador envía automáticamente en cada petición.
//
// La cookie "divvy_user_id" contiene el UUID del usuario autenticado.
// Con httpOnly: true, JavaScript del navegador no puede leerla (protección XSS).

export async function getSessionUserId() {
  const cookieStore = await cookies() // cookies() es async en Next.js 15+
  // Retorna el valor de la cookie, o null si no existe (usuario no logueado)
  return cookieStore.get('divvy_user_id')?.value ?? null
}

export async function setSessionCookie(userId) {
  const cookieStore = await cookies()
  cookieStore.set('divvy_user_id', userId, {
    httpOnly: true,                // invisible para JavaScript del navegador
    path: '/',                     // válida en todas las rutas del sitio
    maxAge: 60 * 60 * 24 * 30,    // expira en 30 días (en segundos)
    sameSite: 'lax',               // protección básica contra CSRF
  })
}

export async function clearSessionCookie() {
  const cookieStore = await cookies()
  // Borrar la cookie = cerrar sesión
  cookieStore.delete('divvy_user_id')
}
