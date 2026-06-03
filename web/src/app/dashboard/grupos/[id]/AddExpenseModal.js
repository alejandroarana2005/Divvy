'use client'

// ─────────────────────────────────────────────────────────────────────────────
// AddExpenseModal.js — Modal para agregar un gasto (Client Component)
//
// Este es el componente más complejo en estado porque maneja:
//   - 6 campos de formulario con estado propio
//   - Cálculo reactivo del costo por persona en tiempo real
//   - Lista de checkboxes para seleccionar participantes
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import { createExpense } from './actions'

// Constante definida fuera del componente: no cambia entre renders,
// así React no la recrea cada vez.
const CATEGORIES = ['Comida', 'Transporte', 'Servicios', 'Arriendo', 'Entretenimiento', 'Salud', 'Educación', 'Otro']

// Intl.NumberFormat es la API nativa del navegador para formatear números
// según el locale (idioma/región). 'es-CO' = español Colombia → $ 45.000
function formatCOP(n) {
  if (!n || isNaN(n) || n <= 0) return '—'
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0,
  }).format(n)
}

export default function AddExpenseModal({ groupId, members, currentUserId, onClose, onExpenseAdded }) {

  // ── Estado del formulario ────────────────────────────────────────────────
  const [name,         setName]         = useState('')
  const [category,     setCategory]     = useState('Comida')
  const [amount,       setAmount]       = useState('')         // string porque viene de <input>

  // Por defecto, el pagador es el usuario actual.
  // ?? (nullish coalescing): usa lo siguiente si lo anterior es null o undefined
  const [paidById,     setPaidById]     = useState(currentUserId ?? members[0]?.id ?? '')

  // Por defecto, todos los miembros participan en el gasto
  const [participants, setParticipants] = useState(members.map(m => m.id))

  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState(null)

  // ── Valores derivados (calculados del estado, no guardados en estado) ────
  // Convertimos el string del input a número. || 0 evita NaN.
  const numAmount = parseFloat(amount) || 0

  // División equitativa en tiempo real: se recalcula cada vez que cambia
  // el monto o la lista de participantes
  const perPerson = participants.length > 0 && numAmount > 0
    ? numAmount / participants.length
    : 0

  // ── Manejo de checkboxes ─────────────────────────────────────────────────
  function toggleMember(id) {
    setParticipants(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)  // quitar: crea nuevo array sin ese id
        : [...prev, id]               // agregar: crea nuevo array con ese id al final
    )
    // Nota: nunca mutamos el array anterior directamente (ej: prev.push(id))
    // porque React no detectaría el cambio. Siempre retornamos un NUEVO array.
  }

  // ── Envío del formulario ─────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault()
    if (participants.length === 0) return // validación mínima en cliente

    setLoading(true)
    setError(null)

    try {
      // Enviamos al servidor solo los IDs, no los objetos completos.
      // El servidor es quien valida, calcula y guarda — no confiamos en el cliente.
      await createExpense({
        groupId,
        name,
        category,
        amount: numAmount,
        paidById,
        participantIds: participants,
      })

      // El Server Action no retorna el gasto, así que lo construimos
      // localmente para actualizar la UI sin recargar la página.
      const paidByMember = members.find(m => m.id === paidById)
      onExpenseAdded({
        id:           Date.now().toString(), // ID temporal (solo para la key de React)
        name,
        category,
        amount:       numAmount,
        paid_by_id:   paidById,
        paid_by_name: paidByMember?.username ?? '',  // ?. = optional chaining: no explota si es undefined
        expense_date: new Date().toISOString().slice(0, 10),
        participants: members
          .filter(m => participants.includes(m.id))  // solo los seleccionados
          .map(m => ({ id: m.id, username: m.username })), // solo los campos necesarios
      })

      onClose()
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      {/* max-h-[90vh] + overflow-y-auto: si el contenido es muy largo, scrollea dentro del modal */}
      <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">Agregar gasto</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Nombre del gasto */}
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

          {/* Categoría — <select> controlado igual que <input> */}
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

          {/* Monto con símbolo $ superpuesto usando posicionamiento CSS */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monto total</label>
            <div className="relative">
              {/* absolute: posicionado respecto al div relative padre */}
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium select-none">$</span>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
                min="1"
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:border-indigo-500 transition"
                placeholder="0"
              />
            </div>
          </div>

          {/* Quién pagó */}
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

          {/* Participantes con checkboxes y costo por persona en tiempo real */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Dividir entre
              {/* Solo mostramos el costo por persona si hay un monto válido */}
              {perPerson > 0 && (
                <span className="ml-2 font-normal text-indigo-600">{formatCOP(perPerson)} / persona</span>
              )}
            </label>
            <div className="space-y-2">
              {members.map(m => {
                const checked = participants.includes(m.id)
                return (
                  // <label> que envuelve el checkbox: click en cualquier parte lo activa
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
                    {/* Muestra el monto solo si está seleccionado */}
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
            {/* Desactivado si no hay participantes O si está cargando */}
            <button type="submit" disabled={participants.length === 0 || loading}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-300 text-white font-medium rounded-xl transition">
              {loading ? 'Guardando...' : 'Agregar gasto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
