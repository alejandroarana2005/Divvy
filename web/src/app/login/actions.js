// ─────────────────────────────────────────────────────────────────────────────
// login/actions.js — Server Actions de autenticación
//
// 'use server' le dice a Next.js que estas funciones se ejecutan SOLO en el
// servidor, nunca en el navegador. El cliente las puede llamar como si fueran
// funciones normales, pero internamente Next.js hace una petición HTTP al servidor.
// ─────────────────────────────────────────────────────────────────────────────
'use server'

import { randomUUID } from 'crypto'
import pool from '@/lib/db'
import { hashPassword, verifyPassword, setSessionCookie } from '@/lib/auth'

export async function login(formData) {
  // FormData es el objeto estándar del navegador que contiene los campos del formulario
  const email    = formData.get('email')
  const password = formData.get('password')

  try {
    // pool.execute() envía la consulta SQL a MySQL y espera la respuesta.
    // El "?" es un parámetro preparado — previene inyección SQL (SQL Injection).
    // Nunca concatenes variables directamente en el SQL: `WHERE email = '${email}'`
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email])

    // rows es un array de filas. Tomamos la primera (o undefined si no existe).
    const user = rows[0]

    // Si no existe el usuario O la contraseña no coincide, rechazamos.
    // Damos el mismo mensaje para ambos casos — no revelamos si el email existe.
    if (!user || !verifyPassword(password, user.password_hash)) {
      return { error: 'Email o contraseña incorrectos' }
    }

    // Login exitoso: creamos la cookie de sesión con el ID del usuario
    await setSessionCookie(user.id)

    // Retornamos éxito al cliente para que haga la navegación
    return { success: true }
  } catch (err) {
    // Si MySQL no está corriendo o hay otro error de infraestructura
    return { error: 'Error de conexión. Verifica que MySQL esté activo.' }
  }
}

export async function register(formData) {
  const email    = formData.get('email')
  const username = formData.get('username')
  const password = formData.get('password')

  try {
    // Verificamos si ya existe un usuario con ese email
    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email])
    if (existing.length > 0) {
      return { error: 'Ya existe una cuenta con este email' }
    }

    // randomUUID() genera un identificador único universal, ej: "f47ac10b-58cc-..."
    // Usamos UUIDs en vez de IDs numéricos autoincrement para mayor seguridad
    // y para poder generarlos sin consultar la DB primero.
    const id            = randomUUID()
    const password_hash = hashPassword(password) // nunca guardamos la contraseña cruda

    await pool.execute(
      'INSERT INTO users (id, email, username, password_hash) VALUES (?, ?, ?, ?)',
      [id, email, username, password_hash]
    )

    // Logueamos al usuario automáticamente después de registrarse
    await setSessionCookie(id)
    return { success: true }
  } catch (err) {
    return { error: 'Error de conexión. Verifica que MySQL esté activo.' }
  }
}
