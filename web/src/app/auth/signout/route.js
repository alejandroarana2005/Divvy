import { redirect } from 'next/navigation'
import { createClient } from '@/shared/lib/auth'

export async function POST() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
