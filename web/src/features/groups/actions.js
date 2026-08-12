'use server'

import { revalidatePath } from 'next/cache'
import { getSessionUser } from '@/shared/lib/auth'
import db from '@/shared/lib/db'

export async function createGroup({ name, description }) {
  const user = await getSessionUser()
  if (!user) throw new Error('No autenticado')

  const { data: group, error } = await db
    .from('expense_groups')
    .insert({ name, description: description || null, created_by: user.id })
    .select('id, name, description')
    .single()

  if (error) throw new Error(error.message)

  const { error: memberError } = await db
    .from('group_members')
    .insert({ group_id: group.id, user_id: user.id, role: 'admin' })

  if (memberError) throw new Error(memberError.message)

  revalidatePath('/dashboard')
  return { id: group.id, name: group.name, description: group.description ?? '' }
}
