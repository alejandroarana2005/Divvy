import { redirect, notFound } from 'next/navigation'
import { getSessionUser } from '@/shared/lib/auth'
import db from '@/shared/lib/db'
import GroupDetailClient from '@/features/expenses/components/GroupDetailClient'

export default async function GroupPage({ params }) {
  const { id } = await params
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const { data: membership } = await db
    .from('group_members')
    .select('expense_groups(id, name, description)')
    .eq('group_id', id)
    .eq('user_id', user.id)
    .single()

  if (!membership) notFound()
  const group = membership.expense_groups

  const { data: membersData } = await db
    .from('group_members')
    .select('user_id, role, joined_at, profiles(id, username, email)')
    .eq('group_id', id)
    .order('joined_at', { ascending: true })

  const members = (membersData ?? []).map(m => ({
    id: m.profiles.id,
    username: m.profiles.username,
    email: m.profiles.email,
    role: m.role,
    joined_at: m.joined_at,
  }))

  const { data: expensesData } = await db
    .from('expenses')
    .select('id, name, category, amount, expense_date, paid_by, profiles(username)')
    .eq('group_id', id)
    .order('expense_date', { ascending: false })

  const expenseIds = (expensesData ?? []).map(e => e.id)
  let participantRows = []
  if (expenseIds.length > 0) {
    const { data } = await db
      .from('expense_participants')
      .select('expense_id, user_id, profiles(username)')
      .in('expense_id', expenseIds)
    participantRows = data ?? []
  }

  const participantsByExpense = {}
  for (const row of participantRows) {
    if (!participantsByExpense[row.expense_id]) participantsByExpense[row.expense_id] = []
    participantsByExpense[row.expense_id].push({ id: row.user_id, username: row.profiles?.username ?? '' })
  }

  const expenses = (expensesData ?? []).map(e => ({
    id: e.id,
    name: e.name,
    category: e.category,
    amount: parseFloat(e.amount),
    expense_date: e.expense_date,
    paid_by_id: e.paid_by,
    paid_by_name: e.profiles?.username ?? '',
    participants: participantsByExpense[e.id] ?? [],
  }))

  // paid_by_id y paid_to_id apuntan a la misma tabla (profiles), por eso
  // usamos alias con el hint de columna: profiles!paid_by_id y profiles!paid_to_id
  const { data: settlementsData } = await db
    .from('settlements')
    .select('id, paid_by_id, paid_to_id, amount, note, settled_at, payer:profiles!paid_by_id(username), receiver:profiles!paid_to_id(username)')
    .eq('group_id', id)
    .order('settled_at', { ascending: false })

  const settlements = (settlementsData ?? []).map(s => ({
    id: s.id,
    paid_by_id: s.paid_by_id,
    paid_to_id: s.paid_to_id,
    paid_by_name: s.payer?.username ?? '',
    paid_to_name: s.receiver?.username ?? '',
    amount: parseFloat(s.amount),
    note: s.note,
    settled_at: s.settled_at,
  }))

  const balances = computeBalances(members, expenses, settlements)

  return (
    <GroupDetailClient
      group={group}
      members={members}
      initialExpenses={expenses}
      initialSettlements={settlements}
      initialBalances={balances}
      currentUserId={user.id}
    />
  )
}

function computeBalances(members, expenses, settlements = []) {
  const paid       = {}
  const owed       = {}
  const settledOut = {}
  const settledIn  = {}

  for (const m of members) {
    paid[m.id] = 0; owed[m.id] = 0
    settledOut[m.id] = 0; settledIn[m.id] = 0
  }

  for (const exp of expenses) {
    paid[exp.paid_by_id] = (paid[exp.paid_by_id] ?? 0) + exp.amount
    const share = exp.amount / (exp.participants.length || 1)
    for (const p of exp.participants) {
      owed[p.id] = (owed[p.id] ?? 0) + share
    }
  }

  for (const s of settlements) {
    settledOut[s.paid_by_id] = (settledOut[s.paid_by_id] ?? 0) + s.amount
    settledIn[s.paid_to_id]  = (settledIn[s.paid_to_id]  ?? 0) + s.amount
  }

  return members.map(m => ({
    id: m.id,
    username: m.username,
    balance: Math.round(
      (paid[m.id] ?? 0) - (owed[m.id] ?? 0) + (settledOut[m.id] ?? 0) - (settledIn[m.id] ?? 0)
    ),
  }))
}
