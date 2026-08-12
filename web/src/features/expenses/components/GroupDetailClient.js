'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AddExpenseModal from './AddExpenseModal'
import EditExpenseModal from './EditExpenseModal'
import { inviteMember, registerSettlement, deleteExpense, deleteSettlement, leaveGroup, removeMember } from '../actions'

const FILTER_CATEGORIES = ['Todos', 'Comida', 'Transporte', 'Servicios', 'Arriendo', 'Entretenimiento', 'Salud', 'Educación', 'Otro']

const CATEGORY_COLORS = {
  Comida:          'bg-orange-100 text-orange-700',
  Transporte:      'bg-blue-100 text-blue-700',
  Servicios:       'bg-purple-100 text-purple-700',
  Arriendo:        'bg-yellow-100 text-yellow-700',
  Entretenimiento: 'bg-pink-100 text-pink-700',
  Salud:           'bg-green-100 text-green-700',
  Educación:       'bg-cyan-100 text-cyan-700',
  Otro:            'bg-gray-100 text-gray-600',
}

function initials(name) { return (name ?? '?').slice(0, 2).toUpperCase() }

function formatCOP(n) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0,
  }).format(Math.abs(n))
}

function Avatar({ name, size = 'md' }) {
  const cls = size === 'sm' ? 'w-7 h-7 text-xs' : size === 'lg' ? 'w-11 h-11 text-base' : 'w-9 h-9 text-sm'
  return (
    <div className={`${cls} rounded-full bg-indigo-100 text-indigo-700 font-semibold flex items-center justify-center flex-shrink-0`}>
      {initials(name)}
    </div>
  )
}

function TabResumen({ expenses, balances, settlements, onRegisterPayment, onDeleteSettlement }) {
  const total = expenses.reduce((s, e) => s + e.amount, 0)
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Balance por persona</h3>
      <div className="grid gap-3 sm:grid-cols-3">
        {balances.map(b => {
          const positive = b.balance > 0
          const zero     = b.balance === 0
          const border   = zero ? 'border-l-gray-300' : positive ? 'border-l-green-500' : 'border-l-red-500'
          const badge    = zero ? 'bg-gray-100 text-gray-500' : positive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          const label    = zero ? 'A paz y salvo' : positive ? 'Te deben' : 'Debes'
          return (
            <div key={b.id} className={`bg-white rounded-2xl border border-gray-200 border-l-4 ${border} p-4 flex items-center gap-4`}>
              <Avatar name={b.username} size="lg" />
              <div className="min-w-0">
                <p className="font-medium text-gray-900 truncate">{b.username}</p>
                <span className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full ${badge}`}>{label}</span>
                {!zero && (
                  <p className={`text-lg font-bold mt-0.5 ${positive ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCOP(b.balance)}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Total del grupo</h3>
          <button
            onClick={onRegisterPayment}
            className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-xl transition"
          >
            Registrar pago
          </button>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4 flex justify-between items-center">
          <span className="text-gray-600">Gastos totales</span>
          <span className="text-xl font-bold text-gray-900">{formatCOP(total)}</span>
        </div>
      </div>

      {settlements.length > 0 && (
        <div className="mt-2">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Pagos registrados</h3>
          <div className="space-y-2">
            {settlements.map(s => (
              <div key={s.id} className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">{s.paid_by_name}</span>
                    {' le pagó a '}
                    <span className="font-medium">{s.paid_to_name}</span>
                  </p>
                  {s.note && <p className="text-xs text-gray-400 mt-0.5">{s.note}</p>}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-sm font-bold text-green-600">{formatCOP(s.amount)}</span>
                  <button
                    onClick={() => onDeleteSettlement(s.id)}
                    className="text-gray-300 hover:text-red-500 transition text-lg leading-none"
                    title="Eliminar pago"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function TabGastos({ expenses, onAdd, onEdit, onDelete }) {
  const [filter, setFilter] = useState('Todos')
  const visible = filter === 'Todos' ? expenses : expenses.filter(e => e.category === filter)

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {FILTER_CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                filter === cat ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <button onClick={onAdd}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition flex-shrink-0">
          + Agregar gasto
        </button>
      </div>
      <div className="space-y-3">
        {visible.length === 0 && (
          <p className="text-center text-gray-400 py-10">No hay gastos en esta categoría.</p>
        )}
        {visible.map(exp => (
          <div key={exp.id} className="bg-white rounded-2xl border border-gray-200 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900">{exp.name}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[exp.category] ?? 'bg-gray-100 text-gray-600'}`}>
                    {exp.category}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Pagado por <span className="font-medium text-gray-700">{exp.paid_by_name}</span> · {exp.expense_date?.toString().slice(0, 10)}
                </p>
                <div className="flex gap-1 mt-2">
                  {exp.participants.map(p => <Avatar key={p.id} name={p.username} size="sm" />)}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-lg font-bold text-gray-900">{formatCOP(exp.amount)}</span>
                <button
                  onClick={() => onEdit(exp)}
                  className="text-gray-400 hover:text-indigo-600 transition p-1"
                  title="Editar gasto"
                >
                  ✏️
                </button>
                <button
                  onClick={() => onDelete(exp.id)}
                  className="text-gray-400 hover:text-red-500 transition p-1"
                  title="Eliminar gasto"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TabMiembros({ members, currentUserId, isAdmin, onInvite, onRemoveMember, onLeaveGroup }) {
  const [leaveLoading,  setLeaveLoading]  = useState(false)
  const [leaveError,    setLeaveError]    = useState(null)

  async function handleLeave() {
    if (!confirm('¿Seguro que quieres salir del grupo?')) return
    setLeaveLoading(true)
    setLeaveError(null)
    const result = await onLeaveGroup()
    if (result?.error) { setLeaveError(result.error); setLeaveLoading(false) }
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={onInvite}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition">
          + Invitar miembro
        </button>
      </div>
      <div className="space-y-3">
        {members.map(m => (
          <div key={m.id} className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-4">
            <Avatar name={m.username} size="lg" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">{m.username}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${m.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
                  {m.role === 'admin' ? 'Admin' : 'Miembro'}
                </span>
              </div>
              <p className="text-sm text-gray-500">{m.email}</p>
            </div>
            {isAdmin && m.id !== currentUserId && (
              <button
                onClick={() => onRemoveMember(m.id, m.username)}
                className="text-gray-300 hover:text-red-500 transition text-sm font-medium flex-shrink-0"
                title="Eliminar miembro"
              >
                Eliminar
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200">
        {leaveError && <p className="text-red-500 text-sm mb-3">{leaveError}</p>}
        <button
          onClick={handleLeave}
          disabled={leaveLoading}
          className="w-full py-3 border border-red-200 hover:bg-red-50 text-red-600 font-medium rounded-xl transition disabled:opacity-50"
        >
          {leaveLoading ? 'Saliendo...' : 'Salir del grupo'}
        </button>
      </div>
    </div>
  )
}

function InviteModal({ groupId, onClose, onMemberAdded }) {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const result = await inviteMember(groupId, email)
      if (result?.error) { setError(result.error); setLoading(false) }
      else { onMemberAdded(result.member); onClose() }
    } catch (err) { setError(err.message); setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">Invitar miembro</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 transition"
              placeholder="amigo@email.com" />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-xl transition">Cancelar</button>
            <button type="submit" disabled={loading}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-300 text-white font-medium rounded-xl transition">
              {loading ? 'Buscando...' : 'Invitar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function SettlementModal({ groupId, members, currentUserId, onClose, onSettlementAdded }) {
  const [paidById, setPaidById] = useState(currentUserId)
  const [paidToId, setPaidToId] = useState(
    members.find(m => m.id !== currentUserId)?.id ?? ''
  )
  const [amount,  setAmount]  = useState('')
  const [note,    setNote]    = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  function handlePaidByChange(newId) {
    setPaidById(newId)
    if (paidToId === newId) setPaidToId(members.find(m => m.id !== newId)?.id ?? '')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const result = await registerSettlement({ groupId, paidById, paidToId, amount: parseFloat(amount), note })
      const payer    = members.find(m => m.id === paidById)
      const receiver = members.find(m => m.id === paidToId)
      onSettlementAdded({
        ...result.settlement,
        amount: parseFloat(amount),
        paid_by_name: payer?.username ?? '',
        paid_to_name: receiver?.username ?? '',
      })
      onClose()
    } catch (err) { setError(err.message); setLoading(false) }
  }

  if (members.length < 2) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-md p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Registrar pago</h2>
          <p className="text-gray-500 text-sm">Necesitas al menos 2 miembros en el grupo para registrar un pago.</p>
          <button onClick={onClose} className="mt-4 w-full py-3 border border-gray-300 text-gray-700 font-medium rounded-xl transition hover:bg-gray-50">Cerrar</button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">Registrar pago</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quien pagó</label>
            <select value={paidById} onChange={e => handlePaidByChange(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 bg-white focus:outline-none focus:border-indigo-500 transition">
              {members.map(m => <option key={m.id} value={m.id}>{m.username}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">A quien</label>
            <select value={paidToId} onChange={e => setPaidToId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 bg-white focus:outline-none focus:border-indigo-500 transition">
              {members.filter(m => m.id !== paidById).map(m => <option key={m.id} value={m.id}>{m.username}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monto</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium select-none">$</span>
              <input type="text" inputMode="numeric"
                value={amount ? amount.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : ''}
                onChange={e => setAmount(e.target.value.replace(/\D/g, ''))}
                required
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:border-indigo-500 transition"
                placeholder="0" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nota <span className="text-gray-400">(opcional)</span>
            </label>
            <input type="text" value={note} onChange={e => setNote(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 transition"
              placeholder="Transferencia, efectivo..." />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-xl transition">Cancelar</button>
            <button type="submit" disabled={loading}
              className="flex-1 py-3 bg-green-600 hover:bg-green-500 disabled:bg-green-300 text-white font-medium rounded-xl transition">
              {loading ? 'Guardando...' : 'Registrar pago'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const TABS = ['Resumen', 'Gastos', 'Miembros']

export default function GroupDetailClient({ group, members: initialMembers, initialExpenses, initialSettlements, initialBalances, currentUserId }) {
  const router = useRouter()

  const [activeTab,      setActiveTab]      = useState('Resumen')
  const [members,        setMembers]        = useState(initialMembers)
  const [expenses,       setExpenses]       = useState(initialExpenses)
  const [settlements,    setSettlements]    = useState(initialSettlements)
  const [balances,       setBalances]       = useState(initialBalances)
  const [showInvite,     setShowInvite]     = useState(false)
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [showSettlement, setShowSettlement] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)

  const isAdmin = members.find(m => m.id === currentUserId)?.role === 'admin'

  function handleExpenseAdded(expense) {
    const next = [expense, ...expenses]
    setExpenses(next)
    setBalances(computeBalances(members, next, settlements))
  }

  function handleExpenseUpdated(updated) {
    const next = expenses.map(e => e.id === updated.id ? updated : e)
    setExpenses(next)
    setBalances(computeBalances(members, next, settlements))
  }

  async function handleExpenseDeleted(expenseId) {
    if (!confirm('¿Eliminar este gasto?')) return
    try {
      await deleteExpense(expenseId, group.id)
      const next = expenses.filter(e => e.id !== expenseId)
      setExpenses(next)
      setBalances(computeBalances(members, next, settlements))
    } catch (err) {
      alert(err.message)
    }
  }

  function handleMemberAdded(member) {
    const next = [...members, member]
    setMembers(next)
    setBalances(computeBalances(next, expenses, settlements))
  }

  function handleSettlementAdded(settlement) {
    const next = [settlement, ...settlements]
    setSettlements(next)
    setBalances(computeBalances(members, expenses, next))
  }

  async function handleSettlementDeleted(settlementId) {
    if (!confirm('¿Eliminar este pago?')) return
    try {
      await deleteSettlement(settlementId, group.id)
      const next = settlements.filter(s => s.id !== settlementId)
      setSettlements(next)
      setBalances(computeBalances(members, expenses, next))
    } catch (err) {
      alert(err.message)
    }
  }

  async function handleRemoveMember(userId, username) {
    if (!confirm(`¿Eliminar a ${username} del grupo?`)) return
    try {
      const result = await removeMember(group.id, userId)
      if (result?.error) { alert(result.error); return }
      const next = members.filter(m => m.id !== userId)
      setMembers(next)
      setBalances(computeBalances(next, expenses, settlements))
    } catch (err) {
      alert(err.message)
    }
  }

  async function handleLeaveGroup() {
    const result = await leaveGroup(group.id)
    if (result?.success) { router.push('/dashboard') }
    return result
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-5">
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition mb-4">
            ← Volver al dashboard
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
              {group.description && <p className="text-gray-500 mt-1">{group.description}</p>}
            </div>
            <button onClick={() => setShowInvite(true)}
              className="flex-shrink-0 px-4 py-2 border border-gray-200 hover:border-indigo-300 text-gray-700 text-sm font-medium rounded-xl transition">
              Invitar miembro
            </button>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <div className="flex -space-x-2">
              {members.map(m => (
                <div key={m.id} title={m.username} className="ring-2 ring-white rounded-full">
                  <Avatar name={m.username} size="sm" />
                </div>
              ))}
            </div>
            <span className="text-sm text-gray-500">{members.length} miembros</span>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex gap-1">
            {TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition ${
                  activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}>
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {activeTab === 'Resumen'  && (
          <TabResumen
            expenses={expenses}
            balances={balances}
            settlements={settlements}
            onRegisterPayment={() => setShowSettlement(true)}
            onDeleteSettlement={handleSettlementDeleted}
          />
        )}
        {activeTab === 'Gastos'   && (
          <TabGastos
            expenses={expenses}
            onAdd={() => setShowAddExpense(true)}
            onEdit={exp => setEditingExpense(exp)}
            onDelete={handleExpenseDeleted}
          />
        )}
        {activeTab === 'Miembros' && (
          <TabMiembros
            members={members}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            onInvite={() => setShowInvite(true)}
            onRemoveMember={handleRemoveMember}
            onLeaveGroup={handleLeaveGroup}
          />
        )}
      </main>

      {showInvite && (
        <InviteModal groupId={group.id} onClose={() => setShowInvite(false)} onMemberAdded={handleMemberAdded} />
      )}
      {showAddExpense && (
        <AddExpenseModal groupId={group.id} members={members} currentUserId={currentUserId}
          onClose={() => setShowAddExpense(false)} onExpenseAdded={handleExpenseAdded} />
      )}
      {editingExpense && (
        <EditExpenseModal
          expense={editingExpense}
          groupId={group.id}
          members={members}
          onClose={() => setEditingExpense(null)}
          onExpenseUpdated={exp => { handleExpenseUpdated(exp); setEditingExpense(null) }}
        />
      )}
      {showSettlement && (
        <SettlementModal groupId={group.id} members={members} currentUserId={currentUserId}
          onClose={() => setShowSettlement(false)} onSettlementAdded={handleSettlementAdded} />
      )}
    </div>
  )
}

function computeBalances(members, expenses, settlements = []) {
  const paid = {}; const owed = {}
  const settledOut = {}; const settledIn = {}

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
