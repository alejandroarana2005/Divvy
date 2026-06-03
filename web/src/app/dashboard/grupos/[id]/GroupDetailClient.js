'use client'

import { useState } from 'react'
import Link from 'next/link'
import AddExpenseModal from './AddExpenseModal'

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

function TabResumen({ expenses, balances }) {
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
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Total del grupo</h3>
        <div className="bg-white rounded-2xl border border-gray-200 p-4 flex justify-between items-center">
          <span className="text-gray-600">Gastos totales</span>
          <span className="text-xl font-bold text-gray-900">{formatCOP(total)}</span>
        </div>
      </div>
    </div>
  )
}

function TabGastos({ expenses, onAdd }) {
  const [filter, setFilter] = useState('Todos')
  const visible = filter === 'Todos' ? expenses : expenses.filter(e => e.category === filter)

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {FILTER_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                filter === cat ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <button
          onClick={onAdd}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition flex-shrink-0"
        >
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
              <span className="text-lg font-bold text-gray-900 flex-shrink-0">{formatCOP(exp.amount)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TabMiembros({ members, onInvite }) {
  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={onInvite}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition"
        >
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
          </div>
        ))}
      </div>
    </div>
  )
}

function InviteModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">Invitar miembro</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">✕</button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 transition"
              placeholder="amigo@email.com"
              autoFocus
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-xl transition">Cancelar</button>
            <button onClick={onClose} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition">Enviar invitación</button>
          </div>
        </div>
      </div>
    </div>
  )
}

const TABS = ['Resumen', 'Gastos', 'Miembros']

export default function GroupDetailClient({ group, members, initialExpenses, initialBalances, currentUserId }) {
  const [activeTab,      setActiveTab]      = useState('Resumen')
  const [expenses,       setExpenses]       = useState(initialExpenses)
  const [balances,       setBalances]       = useState(initialBalances)
  const [showInvite,     setShowInvite]     = useState(false)
  const [showAddExpense, setShowAddExpense] = useState(false)

  function handleExpenseAdded(expense) {
    setExpenses(prev => [expense, ...prev])
    setBalances(computeBalances(members, [expense, ...expenses]))
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
            <button
              onClick={() => setShowInvite(true)}
              className="flex-shrink-0 px-4 py-2 border border-gray-200 hover:border-indigo-300 text-gray-700 text-sm font-medium rounded-xl transition"
            >
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
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition ${
                  activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {activeTab === 'Resumen'  && <TabResumen  expenses={expenses} balances={balances} />}
        {activeTab === 'Gastos'   && <TabGastos   expenses={expenses} onAdd={() => setShowAddExpense(true)} />}
        {activeTab === 'Miembros' && <TabMiembros members={members} onInvite={() => setShowInvite(true)} />}
      </main>

      {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}

      {showAddExpense && (
        <AddExpenseModal
          groupId={group.id}
          members={members}
          currentUserId={currentUserId}
          onClose={() => setShowAddExpense(false)}
          onExpenseAdded={handleExpenseAdded}
        />
      )}
    </div>
  )
}

function computeBalances(members, expenses) {
  const paid = {}
  const owed = {}
  for (const m of members) { paid[m.id] = 0; owed[m.id] = 0 }
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
