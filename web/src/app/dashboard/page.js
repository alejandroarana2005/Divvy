import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import db from '@/lib/db'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const { data: profile } = await db
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single()

  const { data: memberships } = await db
    .from('group_members')
    .select('expense_groups(id, name, description, created_at)')
    .eq('user_id', user.id)

  const groups = (memberships ?? [])
    .map(m => m.expense_groups)
    .filter(Boolean)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  return <DashboardClient username={profile?.username ?? ''} initialGroups={groups} />
}
