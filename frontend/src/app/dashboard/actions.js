'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

export async function createGroup({ name, description }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error('Sesión inválida')

  // Decodificar JWT para diagnóstico (sin verificar firma)
  try {
    const parts = session.access_token.split('.')
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString())
    console.log('[JWT payload]', JSON.stringify(payload, null, 2))
  } catch (e) {
    console.log('[JWT] No es un JWT estándar, token:', session.access_token.substring(0, 40))
  }

  // Crear cliente con el access_token explícito para que RLS reciba el JWT
  const supabaseWithAuth = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: {
        headers: { Authorization: `Bearer ${session.access_token}` },
      },
    }
  )

  const { data: group, error: groupError } = await supabaseWithAuth
    .from('expense_group')
    .insert({ name, description, created_by: user.id })
    .select()
    .single()

  if (groupError) throw new Error(groupError.message)

  const { error: memberError } = await supabaseWithAuth
    .from('group_member')
    .insert({ group_id: group.id, user_id: user.id, role: 'admin' })

  if (memberError) throw new Error(memberError.message)

  revalidatePath('/dashboard')
}
