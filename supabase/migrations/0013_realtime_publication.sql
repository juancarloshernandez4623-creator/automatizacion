-- Habilita Supabase Realtime (postgres_changes) para `messages` y
-- `conversations`. Sin esto, el panel de conversaciones (chat-panel.tsx)
-- suscribe correctamente via `supabase.channel(...).on('postgres_changes',
-- ...)`, y las policies de RLS (migracion 0011) ya permiten al usuario
-- autenticado leer las filas de su propia organizacion -- pero Realtime NUNCA
-- emite ningun evento para una tabla que no este anadida a la publicacion
-- `supabase_realtime`, sin importar que RLS/permisos esten bien. El sintoma
-- es exactamente "el panel no se actualiza solo, hay que recargar" -- nunca
-- llega nada, en vez de fallar con un error visible.
--
-- Referencia: https://supabase.com/docs/guides/realtime/postgres-changes
--
-- El `do $$ ... $$` evita que la migracion falle si la tabla ya fue anadida
-- manualmente a la publicacion desde el Dashboard (Postgres lanza error, no
-- no-op, si se intenta anadir una tabla que ya es miembro).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'conversations'
  ) then
    alter publication supabase_realtime add table public.conversations;
  end if;
end $$;

-- REPLICA IDENTITY FULL: no estrictamente necesario para los eventos INSERT
-- (messages) y UPDATE (conversations) que consume hoy chat-panel.tsx (que
-- solo lee `payload.new`), pero sin esto un futuro filtro por valor anterior
-- (ej. detectar el cambio exacto de `bot_active`) o un evento DELETE no
-- traerian el row completo. Costo minimo, evita otra vuelta de debugging
-- identica a esta si se necesita mas adelante.
alter table public.messages replica identity full;
alter table public.conversations replica identity full;
