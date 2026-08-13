# Estructura del proyecto — Presentación

Resumen corto:
Este repositorio implementa la UI con Next.js y la lógica de datos gestionada mediante Supabase. La organización busca claridad entre la aplicación (frontend), las funcionalidades (features) y el código compartido.

**Estructura principal**
- `/web` — Frontend Next.js (App Router). Contiene `src/app` (rutas y layouts), `src/features` (lógica y UI por característica), `src/shared` (utilidades compartidas), `public/` y configuraciones (`next.config.mjs`, `jsconfig.json`).
- `/database` — Esquema y migrations (`schema.sql`, `migrations/`) para la base de datos (Supabase).
- `README.md` — (raíz) documentación general del proyecto.

**Detalle del frontend**
- `web/src/app/` — rutas y componentes de página (p.ej. `dashboard`, `login`, `register`).
- `web/src/features/` — organización por features (co-locación de `actions.js` y `components/` por dominio: `auth`, `expenses`, `groups`).
- `web/src/shared/lib/` — utilidades reutilizables (`auth.js`, `db.js`).

**Tipo de organización**
- Modelo híbrido: monorepo ligero con separación por carpetas entre `web/` y `database/`.
- En el frontend se usa estructura feature-based (co-locación), y Next.js App Router para layouts y server/client components.

**Por qué usamos esta organización**
- Co-locación por feature mejora la productividad: componentes y lógica relacionados están juntos.
- `shared/lib` evita duplicación y centraliza utilidades.
- Separar `database/` del frontend facilita versionar esquemas y aplicar migrations.
- Next.js App Router permite construir rutas anidadas y reutilizar layouts sin mucha configuración.

**Puntos fuertes para defender en la presentación**
- Alta cohesión por feature: cambios en un dominio requieren tocar pocas rutas/archivos.
- Buena base para escalar frontend (añadir más features) sin reestructurar.
- DB y migrations versionadas permiten auditoría y despliegues reproducibles.

**Limitaciones y consideraciones**
- No hay un backend separado explícito en el repo; Next.js puede contener lógica server-side, lo que exige disciplina para no exponer credenciales.
- Falta de TypeScript aumenta riesgo de errores en refactors grandes.
- No se observan tests automáticos en la estructura actual; añadirlos mejora la confianza antes de entrega.

**Recomendaciones rápidas (si hay tiempo antes de la presentación)**
1. Añadir un slide que muestre `web/` → `features/` → `components` como ejemplo de co-locación.
2. Mencionar que la separación DB (`database/`) permite ejecutar migrations en CI/CD.
3. Señalar riesgos (keys en cliente, falta de tests) y contramedidas (migrar lógica sensible al servidor, añadir tests unitarios).

Si quieres, puedo convertir esto en un `web/README.md` o un slide listo para presentar.
