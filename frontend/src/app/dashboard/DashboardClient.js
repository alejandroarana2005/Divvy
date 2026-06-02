'use client'

import { useState } from 'react'
import CreateGroupModal from './CreateGroupModal'

export default function DashboardClient({ username }) {
  const [showModal, setShowModal] = useState(false)
  const [groups, setGroups] = useState([])

  function handleGroupCreated(group) {
    setGroups(prev => [...prev, group])
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Divvy</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Hola, {username}</span>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="text-sm text-gray-500 hover:text-gray-700 transition"
              >
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </nav>

      {/* Contenido */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Tus grupos</h2>
            <p className="text-gray-500 mt-1">
              Administra y divide gastos con tus amigos
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition"
          >
            + Crear grupo
          </button>
        </div>

        {groups.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">💸</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No tienes grupos todavía
            </h3>
            <p className="text-gray-500 mb-6">
              Crea un grupo para empezar a dividir gastos con tus amigos
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition"
            >
              Crear mi primer grupo
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {groups.map(group => (
              <div
                key={group.id}
                className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition cursor-pointer"
              >
                <h3 className="font-semibold text-gray-900 text-lg mb-1">{group.name}</h3>
                {group.description && (
                  <p className="text-gray-500 text-sm">{group.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {showModal && (
        <CreateGroupModal
          onClose={() => setShowModal(false)}
          onGroupCreated={handleGroupCreated}
        />
      )}
    </div>
  )
}
