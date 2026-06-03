'use server'

// ─────────────────────────────────────────────────────────────────────────────
// grupos/[id]/actions.js — Server Action para crear gastos
// ─────────────────────────────────────────────────────────────────────────────

import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'
import pool from '@/lib/db'
import { getSessionUserId } from '@/lib/auth'

export async function createExpense({ groupId, name, category, amount, paidById, participantIds }) {
  const userId = await getSessionUserId()
  if (!userId) throw new Error('No autenticado')

  const expenseId = randomUUID()

  // toISOString() da "2025-03-15T10:30:00.000Z", slice(0,10) extrae "2025-03-15"
  const today = new Date().toISOString().slice(0, 10)

  // Calculamos cuánto le corresponde a cada participante.
  // toFixed(2) redondea a 2 decimales (ej: 33.33), parseFloat quita zeros innecesarios.
  const share = parseFloat((amount / participantIds.length).toFixed(2))

  // Insertamos el gasto principal en la tabla expenses
  await pool.execute(
    'INSERT INTO expenses (id, group_id, name, category, amount, paid_by, expense_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [expenseId, groupId, name, category, amount, paidById, today]
  )

  // Por cada participante, insertamos una fila en expense_participants.
  // Este es un patrón de "tabla de relación muchos a muchos":
  // un gasto puede tener muchos participantes, y un usuario puede estar en muchos gastos.
  for (const uid of participantIds) {
    await pool.execute(
      'INSERT INTO expense_participants (id, expense_id, user_id, share) VALUES (?, ?, ?, ?)',
      [randomUUID(), expenseId, uid, share]
    )
  }

  // Invalidamos la caché de la página del grupo para que los datos sean frescos
  revalidatePath(`/dashboard/grupos/${groupId}`)
}
