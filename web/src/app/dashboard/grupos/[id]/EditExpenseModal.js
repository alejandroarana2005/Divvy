'use client'

import { useState } from 'react'
import { updateExpense } from './actions'

const CATEGORIES = ['Comida', 'Transporte', 'Servicios', 'Arriendo', 'Entretenimiento', 'Salud', 'Educación', 'Otro']

function formatCOP(n) {
  if (!n || isNaN(n) || n <= 0) return '—'
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0,
  }).format(n)
}

export default function EditExpenseModal({ expense, groupId, members, onClose, onExpenseUpdated }) {
  const [name,         setName]         = useState(expense.name)
  const [category,     setCategory]     = useState(expense.category)
  const [amount,       setAmount]       = useState(String(expense.amount))
  const [paidById,     setPaidById]     = useState(expense.paid_by_id)
  const [participants, setParticipants] = useState(expense.participants.map(p => p.id))
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState(null)

  const numAmount = parseFloat(amount) || 0
  const perPerson = participants.length > 0 && numAmount > 0
    ? numAmount / participants.length
    : 0

  function toggleMember(id) {
    setParticipants(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (participants.length === 0) return

    setLoading(true)
    setError(null)

    try {
      await updateExpense({
        expenseId: expense.id,
        groupId,
        name,
        category,
        amount: numAmount,
        paidById,
        participantIds: participants,
      })

      const paidByMember = members.find(m => m.id === paidById)
      onExpenseUpdated({
        ...expense,
        name,
        category,
        amount: numAmount,
        paid_by_id:   paidById,
        paid_by_name: paidByMember?.username ?? '',
        participants: members
          .filter(m => participants.includes(m.id))
          .map(m => ({ id: m.id, username: m.username })),
      })

      onClose()
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">Editar gasto</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del gasto</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              autoFocus
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 transition"
              placeholder="Almuerzo, taxi, mercado..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 bg-white focus:outline-none focus:border-indigo-500 transition"
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monto total</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium select-none">$</span>
              <input
                type="text"
                inputMode="numeric"
                value={amount ? amount.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : ''}
                onChange={e => setAmount(e.target.value.replace(/\D/g, ''))}
                required
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:border-indigo-500 transition"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pagado por</label>
            <select
              value={paidById}
              onChange={e => setPaidById(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 bg-white focus:outline-none focus:border-indigo-500 transition"
            >
              {members.map(m => <option key={m.id} value={m.id}>{m.username}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Dividir entre
              {perPerson > 0 && (
                <span className="ml-2 font-normal text-indigo-600">{formatCOP(perPerson)} / persona</span>
              )}
            </label>
            <div className="space-y-2">
              {members.map(m => {
                const checked = participants.includes(m.id)
                return (
                  <label
                    key={m.id}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border cursor-pointer transition ${
                      checked ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleMember(m.id)}
                        className="w-4 h-4 accent-indigo-600 rounded"
                      />
                      <span className="text-sm font-medium text-gray-800">{m.username}</span>
                    </div>
                    <span className={`text-sm font-semibold tabular-nums ${checked && perPerson > 0 ? 'text-indigo-600' : 'text-gray-300'}`}>
                      {checked && perPerson > 0 ? formatCOP(perPerson) : '—'}
                    </span>
                  </label>
                )
              })}
            </div>
            {participants.length === 0 && (
              <p className="text-red-500 text-xs mt-2">Selecciona al menos un miembro.</p>
            )}
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-xl transition">
              Cancelar
            </button>
            <button type="submit" disabled={participants.length === 0 || loading}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-300 text-white font-medium rounded-xl transition">
              {loading ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
