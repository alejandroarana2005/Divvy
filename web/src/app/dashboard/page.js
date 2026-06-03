// ─────────────────────────────────────────────────────────────────────────────
// dashboard/page.js — Página principal del dashboard (Server Component)
//
// Este archivo NO tiene 'use client', así que es un Server Component:
// se ejecuta completamente en el servidor. El navegador nunca ve este código.
//
// Ventaja: puede acceder directamente a la base de datos y a las cookies
// sin exponer credenciales al cliente.
// ─────────────────────────────────────────────────────────────────────────────

import { redirect } from 'next/navigation'
import { getSessionUserId } from '@/lib/auth'
import pool from '@/lib/db'
import DashboardClient from './DashboardClient'

// Next.js llama automáticamente a esta función cuando el usuario visita /dashboard
export default async function DashboardPage() {
  // 1. Verificamos si el usuario está autenticado leyendo su cookie de sesión
  const userId = await getSessionUserId()

  // Si no hay cookie (no está logueado), lo mandamos al login.
  // redirect() en un Server Component detiene el render y hace la redirección.
  if (!userId) redirect('/login')

  // 2. Cargamos el usuario desde la DB para obtener su nombre de usuario
  // Usamos destructuring doble [[user]] porque pool.execute retorna
  // [filas, campos] y filas[0] es el primer resultado.
  const [[user]] = await pool.execute(
    'SELECT id, username FROM users WHERE id = ?',
    [userId]
  )
  // Si el ID de la cookie no existe en la DB (usuario eliminado, etc.), redirigimos
  if (!user) redirect('/login')

  // 3. Cargamos todos los grupos a los que pertenece este usuario.
  // Usamos un JOIN para cruzar expense_groups con group_members y filtrar
  // solo los grupos donde el usuario es miembro.
  const [groups] = await pool.execute(
    `SELECT eg.id, eg.name, eg.description, eg.created_at
     FROM expense_groups eg
     INNER JOIN group_members gm ON gm.group_id = eg.id
     WHERE gm.user_id = ?
     ORDER BY eg.created_at DESC`,
    [userId]
  )

  // 4. Pasamos los datos al Client Component como props.
  // El Server Component actúa como "cargador de datos" y el Client Component
  // como "presentador interactivo".
  return <DashboardClient username={user.username} initialGroups={groups} />
}
