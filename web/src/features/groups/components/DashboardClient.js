'use client'

// ─────────────────────────────────────────────────────────────────────────────
// dashboard/DashboardClient.js — UI principal del dashboard (Client Component)
//
// Recibe los datos ya cargados del Server Component como props, y maneja
// toda la interactividad: abrir/cerrar el modal y actualizar la lista de
// grupos sin hacer una nueva petición al servidor.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import Link from 'next/link'
import CreateGroupModal from './CreateGroupModal'

// Las props son los parámetros que el componente padre le pasa a este.
// = [] es un valor por defecto: si no recibe initialGroups, usa un array vacío.
export default function DashboardClient({ username, initialGroups = [] }) {

  // ── Estado del componente ────────────────────────────────────────────────
  // useState(valorInicial) retorna [valorActual, setter].
  // Cada vez que llamamos al setter, React re-renderiza solo este componente
  // (y sus hijos), no toda la página.

  const [showModal, setShowModal] = useState(false)      // ¿está abierto el modal?
  const [groups,    setGroups]    = useState(initialGroups) // lista de grupos

  // ── Comunicación hijo → padre (lifting state up) ─────────────────────────
  // El modal no puede modificar el estado de este componente directamente.
  // La solución: le pasamos esta función como prop. Cuando el modal crea
  // un grupo, llama a esta función y nosotros actualizamos nuestro estado.
  function handleGroupCreated(group) {
    setGroups(prev => [group, ...prev]) // agrega el nuevo grupo al inicio del array
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Navbar ────────────────────────────────────────────────────────── */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Divvy</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Hola, {username}</span>
            {/* <form> HTML nativo: el browser hace POST a /auth/signout sin JavaScript */}
            <form action="/auth/signout" method="post">
              <button type="submit" className="text-sm text-gray-500 hover:text-gray-700 transition">
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </nav>

      {/* ── Contenido ─────────────────────────────────────────────────────── */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Tus grupos</h2>
            <p className="text-gray-500 mt-1">Administra y divide gastos con tus amigos</p>
          </div>
          {/* () => setShowModal(true) es una función flecha: se ejecuta al hacer click */}
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition"
          >
            + Crear grupo
          </button>
        </div>

        {/* Operador ternario: condición ? siVerdadero : siFalso */}
        {groups.length === 0 ? (
          // Estado vacío
          <div className="text-center py-16">
            <div className="text-5xl mb-4">💸</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No tienes grupos todavía</h3>
            <p className="text-gray-500 mb-6">Crea un grupo para empezar a dividir gastos con tus amigos</p>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition"
            >
              Crear mi primer grupo
            </button>
          </div>
        ) : (
          // Lista de grupos
          <div className="grid gap-4 sm:grid-cols-2">
            {/*
              .map() itera el array y retorna un elemento JSX por cada grupo.
              key es obligatorio en listas para que React sepa cuál elemento
              cambió sin tener que comparar todos.
            */}
            {groups.map(group => (
              <Link
                key={group.id}
                href={`/dashboard/grupos/${group.id}`}  // template literal: URL dinámica
                className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition block"
              >
                <h3 className="font-semibold text-gray-900 text-lg mb-1">{group.name}</h3>
                {/* && : renderiza solo si description tiene valor (no es falsy) */}
                {group.description && (
                  <p className="text-gray-500 text-sm">{group.description}</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* El modal se monta/desmonta según showModal. Cuando es false, no existe en el DOM */}
      {showModal && (
        <CreateGroupModal
          onClose={() => setShowModal(false)}   // le decimos cómo cerrarse a sí mismo
          onGroupCreated={handleGroupCreated}    // le decimos cómo notificarnos al crear
        />
      )}
    </div>
  )
}
