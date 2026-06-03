// ─────────────────────────────────────────────────────────────────────────────
// dashboard/actions.js — Server Actions del dashboard
// ─────────────────────────────────────────────────────────────────────────────
'use server'

import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'
import pool from '@/lib/db'
import { getSessionUserId } from '@/lib/auth'

export async function createGroup({ name, description }) {
  // Verificamos la sesión en el servidor — nunca confiamos en datos del cliente
  const userId = await getSessionUserId()
  if (!userId) throw new Error('No autenticado')

  // Generamos IDs únicos para el nuevo grupo y para la fila de membresía
  const groupId  = randomUUID()
  const memberId = randomUUID()

  // Insertamos el grupo. created_by guarda quién lo creó para auditoría.
  await pool.execute(
    'INSERT INTO expense_groups (id, name, description, created_by) VALUES (?, ?, ?, ?)',
    [groupId, name, description || null, userId]
  )

  // El creador del grupo automáticamente se convierte en miembro con rol 'admin'
  await pool.execute(
    'INSERT INTO group_members (id, group_id, user_id, role) VALUES (?, ?, ?, ?)',
    [memberId, groupId, userId, 'admin']
  )

  // revalidatePath le dice a Next.js que la caché de /dashboard está desactualizada
  // y que debe regenerar la página la próxima vez que alguien la visite.
  revalidatePath('/dashboard')

  // Retornamos el grupo creado para que el cliente lo agregue al estado local
  // (así no necesitamos recargar toda la página)
  return { id: groupId, name, description: description || '' }
}
