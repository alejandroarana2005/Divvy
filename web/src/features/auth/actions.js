'use server'

import { createClient } from '@/shared/lib/auth'
import db from '@/shared/lib/db'

export async function login(formData) {
  const email    = formData.get('email')
  const password = formData.get('password')

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: 'Email o contraseña incorrectos' }
  return { success: true }
}

export async function register(formData) {
  const email    = formData.get('email')
  const username = formData.get('username')
  const password = formData.get('password')

  // Verificar disponibilidad del username antes de crear el usuario
  const { data: existing } = await db
    .from('profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle()

  if (existing) return { error: 'El nombre de usuario ya está en uso' }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) return { error: error.message }

  // Crear el perfil con el service role (bypasa RLS)
  const { error: profileError } = await db
    .from('profiles')
    .insert({ id: data.user.id, username, email })

  if (profileError) return { error: profileError.message }

  return { success: true }
}
