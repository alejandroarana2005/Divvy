'use client'

// ─────────────────────────────────────────────────────────────────────────────
// CreateGroupModal.js — Modal para crear un grupo (Client Component)
//
// Un "modal" es una ventana que aparece sobre el contenido principal,
// bloqueando la interacción con el resto hasta que se cierra.
//
// Este componente recibe dos funciones como props:
//   onClose       → para cerrarse a sí mismo (lo maneja el padre)
//   onGroupCreated → para notificar al padre cuando se creó un grupo
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import { createGroup } from './actions' // Server Action

export default function CreateGroupModal({ onClose, onGroupCreated }) {

  // Estado local del formulario: cada campo tiene su propio estado
  const [name,        setName]        = useState('')
  const [description, setDescription] = useState('')
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()  // evita que el browser recargue la página
    setLoading(true)
    setError(null)

    try {
      // Llamamos al Server Action. Next.js serializa los argumentos,
      // los envía al servidor via HTTP, y retorna el resultado serializado.
      // Para el usuario parece una función local, pero viaja por la red.
      const group = await createGroup({ name, description })

      // Notificamos al padre (DashboardClient) sobre el nuevo grupo.
      // El padre actualizará su lista sin recargar la página.
      onGroupCreated(group)

      // Cerramos el modal
      onClose()
    } catch (err) {
      // Si el Server Action lanza un error, lo capturamos y mostramos
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    // Overlay: cubre toda la pantalla con fondo semitransparente
    // fixed inset-0 = position:fixed; top:0; right:0; bottom:0; left:0
    // z-50 = z-index alto para quedar encima de todo
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">

      {/* Contenedor del modal */}
      <div className="bg-white rounded-2xl w-full max-w-md p-6">

        {/* Encabezado con título y botón de cerrar */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">Crear grupo</h2>
          {/* onClose viene del padre: llama a setShowModal(false) en DashboardClient */}
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Campo: nombre del grupo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del grupo</label>
            {/*
              Controlled input: el valor del input SIEMPRE refleja el estado de React.
              value={name} muestra el estado, onChange actualiza el estado al escribir.
              Sin esto sería "uncontrolled" y React no sabría qué escribió el usuario.
            */}
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)} // e.target.value = texto del input
              required
              autoFocus
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 transition"
              placeholder="Apartamento 2026"
            />
          </div>

          {/* Campo: descripción (opcional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción <span className="text-gray-400">(opcional)</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 transition resize-none"
              placeholder="Gastos del apartamento con los compañeros..."
            />
          </div>

          {/* Mensaje de error (solo visible si error tiene valor) */}
          {error && <p className="text-red-500 text-sm">{error}</p>}

          {/* Botones de acción */}
          <div className="flex gap-3 pt-2">
            {/* type="button" evita que este botón envíe el formulario */}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-xl transition"
            >
              Cancelar
            </button>
            {/* type="submit" dispara el onSubmit del formulario */}
            <button
              type="submit"
              disabled={loading} // desactivado mientras espera respuesta del servidor
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-300 text-white font-medium rounded-xl transition"
            >
              {loading ? 'Creando...' : 'Crear grupo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
