import { createClient } from '@supabase/supabase-js'

// Cliente con service role: bypasa RLS, solo se usa en el servidor.
// NUNCA expongas SUPABASE_SERVICE_ROLE_KEY al navegador.
const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default db
