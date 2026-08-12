'use server'

import { revalidatePath } from 'next/cache'
import { getSessionUser } from '@/shared/lib/auth'
import db from '@/shared/lib/db'

// ── Gastos ────────────────────────────────────────────────────────────────────

export async function createExpense({ groupId, name, category, amount, paidById, participantIds }) {
  const user = await getSessionUser()
  if (!user) throw new Error('No autenticado')

  const today = new Date().toISOString().slice(0, 10)
  const share = parseFloat((amount / participantIds.length).toFixed(2))

  const { data: expense, error } = await db
    .from('expenses')
    .insert({ group_id: groupId, name, category, amount, paid_by: paidById, expense_date: today })
    .select('id')
    .single()

  if (error) throw new Error(error.message)

  const { error: partError } = await db
    .from('expense_participants')
    .insert(participantIds.map(uid => ({ expense_id: expense.id, user_id: uid, share })))

  if (partError) throw new Error(partError.message)

  revalidatePath(`/dashboard/grupos/${groupId}`)
}

export async function updateExpense({ expenseId, groupId, name, category, amount, paidById, participantIds }) {
  const user = await getSessionUser()
  if (!user) throw new Error('No autenticado')

  const { data: membership } = await db
    .from('group_members').select('role')
    .eq('group_id', groupId).eq('user_id', user.id).single()

  if (!membership) throw new Error('No eres miembro de este grupo')

  const share = parseFloat((amount / participantIds.length).toFixed(2))

  const { error } = await db
    .from('expenses')
    .update({ name, category, amount, paid_by: paidById })
    .eq('id', expenseId)

  if (error) throw new Error(error.message)

  // Reemplazamos todos los participantes
  await db.from('expense_participants').delete().eq('expense_id', expenseId)

  const { error: partError } = await db
    .from('expense_participants')
    .insert(participantIds.map(uid => ({ expense_id: expenseId, user_id: uid, share })))

  if (partError) throw new Error(partError.message)

  revalidatePath(`/dashboard/grupos/${groupId}`)
}

export async function deleteExpense(expenseId, groupId) {
  const user = await getSessionUser()
  if (!user) throw new Error('No autenticado')

  const { data: membership } = await db
    .from('group_members').select('role')
    .eq('group_id', groupId).eq('user_id', user.id).single()

  if (!membership) throw new Error('No eres miembro de este grupo')

  // expense_participants se elimina en cascada por la FK
  const { error } = await db.from('expenses').delete().eq('id', expenseId)
  if (error) throw new Error(error.message)

  revalidatePath(`/dashboard/grupos/${groupId}`)
}

// ── Pagos ─────────────────────────────────────────────────────────────────────

export async function registerSettlement({ groupId, paidById, paidToId, amount, note }) {
  const user = await getSessionUser()
  if (!user) throw new Error('No autenticado')

  const { data: membership } = await db
    .from('group_members').select('role')
    .eq('group_id', groupId).eq('user_id', user.id).single()

  if (!membership) throw new Error('No eres miembro de este grupo')
  if (paidById === paidToId) throw new Error('El pagador y el receptor no pueden ser la misma persona')

  const { data: settlement, error } = await db
    .from('settlements')
    .insert({ group_id: groupId, paid_by_id: paidById, paid_to_id: paidToId, amount, note: note || null })
    .select('id, paid_by_id, paid_to_id, amount, note, settled_at')
    .single()

  if (error) throw new Error(error.message)

  revalidatePath(`/dashboard/grupos/${groupId}`)
  return { success: true, settlement }
}

export async function deleteSettlement(settlementId, groupId) {
  const user = await getSessionUser()
  if (!user) throw new Error('No autenticado')

  const { data: membership } = await db
    .from('group_members').select('role')
    .eq('group_id', groupId).eq('user_id', user.id).single()

  if (!membership) throw new Error('No eres miembro de este grupo')

  const { error } = await db.from('settlements').delete().eq('id', settlementId)
  if (error) throw new Error(error.message)

  revalidatePath(`/dashboard/grupos/${groupId}`)
}

// ── Miembros ──────────────────────────────────────────────────────────────────

export async function inviteMember(groupId, email) {
  const user = await getSessionUser()
  if (!user) throw new Error('No autenticado')

  const { data: membership } = await db
    .from('group_members').select('role')
    .eq('group_id', groupId).eq('user_id', user.id).single()

  if (!membership) throw new Error('No eres miembro de este grupo')

  const { data: profile } = await db
    .from('profiles').select('id, username, email')
    .eq('email', email).maybeSingle()

  if (!profile) return { error: 'No existe ninguna cuenta con ese email' }

  const { data: existing } = await db
    .from('group_members').select('id')
    .eq('group_id', groupId).eq('user_id', profile.id).maybeSingle()

  if (existing) return { error: 'Este usuario ya es miembro del grupo' }

  const { error } = await db
    .from('group_members')
    .insert({ group_id: groupId, user_id: profile.id, role: 'member' })

  if (error) throw new Error(error.message)

  revalidatePath(`/dashboard/grupos/${groupId}`)
  return {
    success: true,
    member: { id: profile.id, username: profile.username, email: profile.email, role: 'member', joined_at: new Date().toISOString() },
  }
}

export async function removeMember(groupId, userId) {
  const user = await getSessionUser()
  if (!user) throw new Error('No autenticado')

  const { data: membership } = await db
    .from('group_members').select('role')
    .eq('group_id', groupId).eq('user_id', user.id).single()

  if (!membership || membership.role !== 'admin') throw new Error('Solo un admin puede eliminar miembros')
  if (userId === user.id) return { error: 'No puedes eliminarte a ti mismo. Usa "Salir del grupo".' }

  const { error } = await db
    .from('group_members').delete()
    .eq('group_id', groupId).eq('user_id', userId)

  if (error) throw new Error(error.message)

  revalidatePath(`/dashboard/grupos/${groupId}`)
  return { success: true }
}

export async function leaveGroup(groupId) {
  const user = await getSessionUser()
  if (!user) throw new Error('No autenticado')

  const { data: membership } = await db
    .from('group_members').select('role')
    .eq('group_id', groupId).eq('user_id', user.id).single()

  if (!membership) throw new Error('No eres miembro de este grupo')

  // Si eres el único admin, no puedes salir
  if (membership.role === 'admin') {
    const { data: otherAdmins } = await db
      .from('group_members').select('id')
      .eq('group_id', groupId).eq('role', 'admin').neq('user_id', user.id)

    if (!otherAdmins || otherAdmins.length === 0) {
      return { error: 'Eres el único admin del grupo. Asigna otro admin antes de salir.' }
    }
  }

  const { error } = await db
    .from('group_members').delete()
    .eq('group_id', groupId).eq('user_id', user.id)

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard')
  return { success: true }
}
