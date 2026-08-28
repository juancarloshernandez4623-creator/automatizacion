-- Los codigos dejan de ser "de un solo uso, gastados en un /signup libre"
-- para convertirse en una clave de acceso PERMANENTE: el dueño de la
-- plataforma crea la cuenta entera (organizacion + auth user) al generar el
-- codigo desde /admin/invites, y el codigo ES la contraseña de esa cuenta
-- para siempre. Esto permite al dueño entrar el primero, dejar todo
-- configurado (WhatsApp, Google Calendar, personalizacion del agente) y
-- luego pasarle ese mismo codigo al cliente -- sin correo propio, sin
-- contraseña que recordar, sin pantalla de registro en ningun sitio.
--
-- No hay ya un "consumo" del codigo (no tiene sentido `used_at`/`used_by`
-- en un modelo de clave permanente), asi que se sustituyen por el mapeo
-- directo a la cuenta real: `login_email` (el correo sintetico con el que
-- se creo el auth user) y `user_id`.
alter table public.signup_invites rename to access_codes;

alter table public.access_codes
  drop column used_at,
  drop column used_by,
  add column login_email text,
  add column user_id uuid references auth.users (id) on delete cascade;

-- Sin `not null`: no falla si por lo que sea ya hubiera alguna fila de
-- pruebas sin estas columnas rellenas. Toda fila nueva creada desde
-- app/admin/invites/actions.ts las rellena siempre; `unique` evita que dos
-- codigos puedan apuntar por error al mismo login_email/cuenta (Postgres
-- permite varios NULL en un indice unique, asi que filas antiguas sin
-- rellenar no chocan entre si).
create unique index access_codes_login_email_key on public.access_codes (login_email);
create unique index access_codes_user_id_key on public.access_codes (user_id);

comment on table public.access_codes is
  'Claves de acceso PERMANENTES para /login (no de un solo uso, no ligadas a un signup libre): cada fila mapea un codigo XXXX-XXXX a una cuenta real de auth.users via login_email/user_id, creada de antemano por el dueño de la plataforma desde /admin/invites -- el codigo es literalmente la contraseña de esa cuenta. Sigue sin ninguna policy de RLS a proposito: solo el service_role (Server Actions con lib/supabase/admin.ts) debe tocar esta tabla. revoked_at deshabilita el codigo Y banea (ban_duration, ver auth.admin.updateUserById) la cuenta de Supabase Auth asociada -- revocar de verdad corta el acceso, no es solo cosmetico.';
