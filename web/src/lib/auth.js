import { createClient } from '@/utils/supabase/server'

// Retorna el usuario de Supabase Auth si hay sesión activa, o null.
export async function getSessionUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
