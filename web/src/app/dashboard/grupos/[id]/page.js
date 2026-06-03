import { redirect, notFound } from 'next/navigation'
import { getSessionUserId } from '@/lib/auth'
import pool from '@/lib/db'
import GroupDetailClient from './GroupDetailClient'

export default async function GroupPage({ params }) {
  const { id } = await params
  const userId = await getSessionUserId()
  if (!userId) redirect('/login')

  const [[group]] = await pool.execute(
    `SELECT eg.id, eg.name, eg.description
     FROM expense_groups eg
     INNER JOIN group_members gm ON gm.group_id = eg.id
     WHERE eg.id = ? AND gm.user_id = ?`,
    [id, userId]
  )
  if (!group) notFound()

  const [members] = await pool.execute(
    `SELECT u.id, u.username, u.email, gm.role, gm.joined_at
     FROM group_members gm
     INNER JOIN users u ON u.id = gm.user_id
     WHERE gm.group_id = ?
     ORDER BY gm.joined_at ASC`,
    [id]
  )

  const [expenses] = await pool.execute(
    `SELECT e.id, e.name, e.category, e.amount, e.expense_date,
            u.id AS paid_by_id, u.username AS paid_by_name
     FROM expenses e
     INNER JOIN users u ON u.id = e.paid_by
     WHERE e.group_id = ?
     ORDER BY e.expense_date DESC, e.created_at DESC`,
    [id]
  )

  const [participantRows] = await pool.execute(
    `SELECT ep.expense_id, u.id AS user_id, u.username
     FROM expense_participants ep
     INNER JOIN users u ON u.id = ep.user_id
     WHERE ep.expense_id IN (
       SELECT id FROM expenses WHERE group_id = ?
     )`,
    [id]
  )

  const participantsByExpense = {}
  for (const row of participantRows) {
    if (!participantsByExpense[row.expense_id]) participantsByExpense[row.expense_id] = []
    participantsByExpense[row.expense_id].push({ id: row.user_id, username: row.username })
  }

  const expensesWithParticipants = expenses.map(e => ({
    ...e,
    amount: parseFloat(e.amount),
    participants: participantsByExpense[e.id] ?? [],
  }))

  const balances = computeBalances(members, expensesWithParticipants)

  return (
    <GroupDetailClient
      group={group}
      members={members}
      initialExpenses={expensesWithParticipants}
      initialBalances={balances}
      currentUserId={userId}
    />
  )
}

function computeBalances(members, expenses) {
  const paid = {}
  const owed = {}
  for (const m of members) {
    paid[m.id] = 0
    owed[m.id] = 0
  }
  for (const exp of expenses) {
    paid[exp.paid_by_id] = (paid[exp.paid_by_id] ?? 0) + exp.amount
    const share = exp.amount / (exp.participants.length || 1)
    for (const p of exp.participants) {
      owed[p.id] = (owed[p.id] ?? 0) + share
    }
  }
  return members.map(m => ({
    id: m.id,
    username: m.username,
    balance: Math.round((paid[m.id] ?? 0) - (owed[m.id] ?? 0)),
  }))
}
