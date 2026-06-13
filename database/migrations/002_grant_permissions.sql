-- ═══════════════════════════════════════════════════════════════
-- 002_grant_permissions.sql
-- Otorga permisos de acceso a los roles del API de Supabase
-- Aplicado: 2026-06-02
-- ═══════════════════════════════════════════════════════════════

grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
