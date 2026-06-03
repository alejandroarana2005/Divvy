// ─────────────────────────────────────────────────────────────────────────────
// lib/db.js — Conexión a la base de datos MySQL
//
// En vez de abrir y cerrar una conexión cada vez que hacemos una consulta
// (lo cual sería lento), usamos un "pool" de conexiones: un grupo de
// conexiones ya abiertas y listas para reutilizar.
// ─────────────────────────────────────────────────────────────────────────────

import mysql from 'mysql2/promise'

// createPool crea el grupo. Las conexiones NO se abren aquí — se abren la
// primera vez que se hace una consulta (conexión lazy).
const pool = mysql.createPool({
  host:     process.env.MYSQL_HOST     || 'localhost', // servidor de MySQL
  port:     parseInt(process.env.MYSQL_PORT || '3306'), // puerto por defecto de MySQL
  user:     process.env.MYSQL_USER     || 'root',
  password: process.env.MYSQL_PASSWORD || '1234',
  database: process.env.MYSQL_DATABASE || 'divvy',    // base de datos a usar

  waitForConnections: true, // si todas las conexiones están ocupadas, espera en fila
  connectionLimit: 10,      // máximo 10 conexiones abiertas al mismo tiempo
})

// Al ser un módulo de Node.js, esta instancia se comparte en toda la app
// (patrón Singleton — siempre el mismo objeto, nunca se recrea).
export default pool
