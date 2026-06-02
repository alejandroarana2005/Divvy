'use client'

import { useState } from 'react'
import Link from 'next/link'

// ── Mock data ────────────────────────────────────────────────────────────────

const GROUP = {
  name: 'Viaje Cartagena',
  description: 'Gastos del viaje de semana santa 2025',
}

const MEMBERS = [
  { id: 1, name: 'alejandro2005', email: 'alejandro@email.com', role: 'admin',   joined: '1 mar 2025' },
  { id: 2, name: 'maria.lopez',   email: 'maria@email.com',     role: 'member',  joined: '2 mar 2025' },
  { id: 3, name: 'carlos.perez',  email: 'carlos@email.com',    role: 'member',  joined: '2 mar 2025' },
]

const EXPENSES = [
  { id: 1, name: 'Almuerzo día 1',            category: 'Comida',      amount: 45000,  paidBy: 'alejandro2005', participants: ['alejandro2005', 'maria.lopez', 'carlos.perez'], date: '15 mar' },
  { id: 2, name: 'Bus Bogotá–Cartagena',       category: 'Transporte',  amount: 90000,  paidBy: 'maria.lopez',   participants: ['alejandro2005', 'maria.lopez', 'carlos.perez'], date: '15 mar' },
  { id: 3, name: 'Hotel 2 noches',             category: 'Servicios',   amount: 360000, paidBy: 'alejandro2005', participants: ['alejandro2005', 'maria.lopez', 'carlos.perez'], date: '15 mar' },
  { id: 4, name: 'Cena mariscos',              category: 'Comida',      amount: 120000, paidBy: 'carlos.perez',  participants: ['alejandro2005', 'maria.lopez', 'carlos.perez'], date: '16 mar' },
  { id: 5, name: 'Entradas Ciudad Amurallada', category: 'Otro',        amount: 60000,  paidBy: 'maria.lopez',   participants: ['alejandro2005', 'maria.lopez', 'carlos.perez'], date: '16 mar' },
]

// Total: $675,000 → por persona: $225,000
// alejandro pagó $405,000 → neto +$180,000
// maria pagó $150,000     → neto  –$75,000
// carlos pagó $120,000    → neto –$105,000
const BALANCES = [
  { id: 1, name: 'alejandro2005', balance:  180000 },
  { id: 2, name: 'maria.lopez',   balance:  -75000 },
  { id: 3, name: 'carlos.perez',  balance: -105000 },
]

const CATEGORIES = ['Todos', 'Comida', 'Transporte', 'Servicios', 'Otro']

const CATEGORY_COLORS = {
  Comida:     'bg-orange-100 text-orange-700',
  Transporte: 'bg-blue-100 text-blue-700',
  Servicios:  'bg-purple-100 text-purple-700',
  Otro:       'bg-gray-100 text-gray-600',
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function initials(name) {
  return name.slice(0, 2).toUpperCase()
}

function formatCOP(n) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0,
  }).format(Math.abs(n))
}

// ── Shared components ────────────────────────────────────────────────────────

function Avatar({ name, size = 'md' }) {
  const cls = size === 'sm'
    ? 'w-7 h-7 text-xs'
    : size === 'lg'
    ? 'w-11 h-11 text-base'
    : 'w-9 h-9 text-sm'
  return (
    <div className={`${cls} rounded-full bg-indigo-100 text-indigo-700 font-semibold flex items-center justify-center flex-shrink-0`}>
      {initials(name)}
    </div>
  )
}

// ── Tab: Resumen ─────────────────────────────────────────────────────────────

function TabResumen() {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Balance por persona</h3>
      <div className="grid gap-3 sm:grid-cols-3">
        {BALANCES.map(b => {
          const positive = b.balance > 0
          const zero     = b.balance === 0
          const border   = zero ? 'border-l-gray-300'  : positive ? 'border-l-green-500' : 'border-l-red-500'
          const badge    = zero ? 'bg-gray-100 text-gray-500' : positive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          const label    = zero ? 'A paz y salvo' : positive ? 'Te deben' : 'Debes'
          return (
            <div key={b.id} className={`bg-white rounded-2xl border border-gray-200 border-l-4 ${border} p-4 flex items-center gap-4`}>
              <Avatar name={b.name} size="lg" />
              <div className="min-w-0">
                <p className="font-medium text-gray-900 truncate">{b.name}</p>
                <span className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full ${badge}`}>
                  {label}
                </span>
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
          <span className="text-xl font-bold text-gray-900">
            {formatCOP(EXPENSES.reduce((s, e) => s + e.amount, 0))}
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Tab: Gastos ──────────────────────────────────────────────────────────────

function TabGastos() {
  const [filter, setFilter] = useState('Todos')

  const visible = filter === 'Todos'
    ? EXPENSES
    : EXPENSES.filter(e => e.category === filter)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                filter === cat
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition flex-shrink-0">
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
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[exp.category]}`}>
                    {exp.category}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Pagado por <span className="font-medium text-gray-700">{exp.paidBy}</span> · {exp.date}
                </p>
                <div className="flex gap-1 mt-2">
                  {exp.participants.map(p => (
                    <Avatar key={p} name={p} size="sm" />
                  ))}
                </div>
              </div>
              <span className="text-lg font-bold text-gray-900 flex-shrink-0">
                {formatCOP(exp.amount)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Tab: Miembros ────────────────────────────────────────────────────────────

function TabMiembros({ onInvite }) {
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
        {MEMBERS.map(m => (
          <div key={m.id} className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-4">
            <Avatar name={m.name} size="lg" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">{m.name}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  m.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {m.role === 'admin' ? 'Admin' : 'Miembro'}
                </span>
              </div>
              <p className="text-sm text-gray-500">{m.email}</p>
            </div>
            <p className="text-xs text-gray-400 flex-shrink-0">Desde {m.joined}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Invite modal ─────────────────────────────────────────────────────────────

function InviteModal({ onClose }) {
  const [email, setEmail] = useState('')
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
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 transition"
              placeholder="amigo@email.com"
              autoFocus
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition"
            >
              Enviar invitación
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

const TABS = ['Resumen', 'Gastos', 'Miembros']

export default function GroupPage() {
  const [activeTab,   setActiveTab]   = useState('Resumen')
  const [showInvite,  setShowInvite]  = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-5">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition mb-4"
          >
            ← Volver al dashboard
          </Link>

          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{GROUP.name}</h1>
              <p className="text-gray-500 mt-1">{GROUP.description}</p>
            </div>
            <button
              onClick={() => setShowInvite(true)}
              className="flex-shrink-0 px-4 py-2 border border-gray-200 hover:border-indigo-300 text-gray-700 text-sm font-medium rounded-xl transition"
            >
              Invitar miembro
            </button>
          </div>

          {/* Member avatars */}
          <div className="flex items-center gap-2 mt-4">
            <div className="flex -space-x-2">
              {MEMBERS.map(m => (
                <div key={m.id} title={m.name} className="ring-2 ring-white rounded-full">
                  <Avatar name={m.name} size="sm" />
                </div>
              ))}
            </div>
            <span className="text-sm text-gray-500">{MEMBERS.length} miembros</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex gap-1">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition ${
                  activeTab === tab
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {activeTab === 'Resumen'  && <TabResumen />}
        {activeTab === 'Gastos'   && <TabGastos />}
        {activeTab === 'Miembros' && <TabMiembros onInvite={() => setShowInvite(true)} />}
      </main>

      {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}
    </div>
  )
}
