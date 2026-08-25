# WhatsApp Clínica — plataforma de atención al cliente con agente de IA

Plataforma SaaS **multi-tenant**: cada negocio (clínica, consultorio, taller,
etc.) conecta su propio número de WhatsApp Business y un agente de IA (Claude
Sonnet 4.6 vía Vercel AI SDK 6) atiende a sus clientes automáticamente —
responde preguntas, agenda citas consultando disponibilidad real en Google
Calendar, y transfiere la conversación a un humano cuando hace falta. El
dueño del negocio gestiona todo desde un dashboard en Next.js: conversaciones
en vivo, citas, personalización del agente y credenciales de integración.

## Arquitectura

```
                          ┌─────────────────────────┐
   Cliente final  ───────▶│   WhatsApp Cloud API     │
   (WhatsApp)             │   (Meta)                 │
                          └────────────┬─────────────┘
                                       │ webhook (HMAC-SHA256)
                                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                     Next.js (Vercel, runtime Node.js)              │
│                                                                    │
│  /api/webhooks/whatsapp  ──▶  resuelve org por phone_number_id     │
│         │                     verifica firma con app_secret cifrado │
│         │ after()                                                  │
│         ▼                                                          │
│  lib/agent/run-agent.ts ──▶ Claude Sonnet 4.6 (Vercel AI SDK 6)    │
│         │                     tools: get_available_slots,          │
│         │                     book_appointment, save_contact_info, │
│         │                     request_human_handoff                │
│         ▼                                                          │
│  lib/whatsapp/send-message.ts ──▶ responde por WhatsApp Cloud API   │
│                                                                    │
│  Dashboard (/dashboard /citas /conversaciones                      │
│              /personalizacion /integraciones)                      │
│    - Server Components + Server Actions, protegidos por sesión     │
│    - Conversaciones/Citas se actualizan en vivo vía                │
│      Supabase Realtime                                             │
└───────────────┬──────────────────────────────┬─────────────────────┘
                 │                              │
                 ▼                              ▼
      ┌─────────────────────┐        ┌───────────────────────┐
      │ Supabase (Postgres)  │        │  Google Calendar API   │
      │ Auth + RLS por        │       │  (OAuth2, por negocio) │
      │ organization_id       │       └───────────────────────┘
      └─────────────────────┘
```

Cada tabla de negocio (`whatsapp_configs`, `google_calendar_configs`,
`agent_configs`, `contacts`, `conversations`, `messages`, `appointments`)
tiene `organization_id` y Row Level Security que sólo permite ver/editar
filas de la propia organización — el aislamiento entre negocios se aplica en
la base de datos, no sólo en la capa de aplicación.

## Stack

| Capa | Tecnología |
| --- | --- |
| Framework | Next.js 16.2.6 (App Router, TypeScript estricto) |
| Estilos | TailwindCSS v4 |
| Iconos | `@phosphor-icons/react` |
| Base de datos / Auth | Supabase (Postgres + Auth + Row Level Security) |
| Agente de IA | Vercel AI SDK 6 + `@ai-sdk/anthropic` (`claude-sonnet-4-6`) |
| Mensajería | WhatsApp Cloud API (Graph API v25.0) |
| Calendario | Google Calendar API v3 (OAuth2, `googleapis`) |
| Deploy | Vercel (webhook con `runtime = 'nodejs'`) |

## Setup local

### 1. Requisitos

- Node.js ≥ 20.9
- Una cuenta de [Supabase](https://supabase.com) (proyecto nuevo)
- Una cuenta de [Anthropic](https://console.anthropic.com) con acceso a la
  API y créditos
- Una app de [Meta for Developers](https://developers.facebook.com) con el
  producto **WhatsApp** agregado (o un negocio con WhatsApp Business
  Platform ya configurado)
- Un proyecto en [Google Cloud Console](https://console.cloud.google.com)
  con la **Google Calendar API** habilitada

### 2. Instalar dependencias

```bash
cd web
pnpm install
```

### 3. Crear el proyecto de Supabase y correr las migraciones

1. Crea un proyecto nuevo en [supabase.com](https://supabase.com).
2. En el SQL Editor del proyecto, corre las migraciones **en orden** desde
   `supabase/migrations/`:
   ```
   0001_extensions.sql
   0002_organizations.sql
   0003_profiles.sql
   0004_whatsapp_configs.sql
   0005_google_calendar_configs.sql
   0006_agent_configs.sql
   0007_contacts.sql
   0008_conversations.sql
   0009_messages.sql
   0010_appointments.sql
   0011_rls_policies.sql
   0012_signup_trigger.sql
   ```
   (Si tienes la Supabase CLI instalada localmente, `supabase db push`
   aplica los archivos de `supabase/migrations/` en orden automáticamente.)
3. Opcional, sólo para desarrollo: corre `supabase/seed.sql` para tener una
   organización de ejemplo con datos dummy.
4. En **Database → Replication**, habilita Realtime para las tablas
   `conversations` y `messages` (usado por `/conversaciones` para
   actualizarse en vivo sin recargar la página).
5. Copia `Project URL`, `anon public key` y `service_role key` desde
   **Project Settings → API**.

### 4. Variables de entorno

```bash
cp .env.example .env.local
```

Completa cada variable — ver los comentarios dentro de `.env.example` para
el detalle de dónde obtener cada una. Resumen:

| Variable | De dónde sale |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API (secreta, sólo servidor) |
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google Cloud Console → Credentials (OAuth client ID, tipo "Web application") |
| `GOOGLE_OAUTH_REDIRECT_URI` | `<tu URL>/api/auth/google/callback`, debe coincidir con un redirect URI autorizado en Google Cloud Console |
| `ENCRYPTION_KEY` | Generar con `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `NEXT_PUBLIC_APP_URL` | URL pública donde corre la app |

> Las credenciales de WhatsApp (`phone_number_id`, `access_token`,
> `app_secret`, `verify_token`) **no van en variables de entorno** — cada
> negocio las conecta desde `/integraciones` en el dashboard, y se guardan
> cifradas (AES-256-GCM) por organización en `whatsapp_configs`, porque la
> plataforma es multi-tenant.

### 5. Correr en desarrollo

```bash
pnpm dev
```

Visita `http://localhost:3000`, crea una cuenta en `/signup` (esto dispara
el trigger `private.handle_new_user()`, que crea tu organización y perfil
automáticamente).

## Configurar Meta (WhatsApp Cloud API)

1. En [developers.facebook.com](https://developers.facebook.com), crea una
   app tipo **Business** y agrégale el producto **WhatsApp**.
2. En **WhatsApp → API Setup** obtén (o genera) un **número de prueba** (o
   usa un número real ya verificado): copia el `Phone number ID` y el
   `WhatsApp Business Account ID`.
3. Genera un **token de acceso permanente**: crea un System User en
   **Business Settings → Users → System Users**, asígnale el activo de
   WhatsApp con permiso `whatsapp_business_messaging`, y genera un token sin
   expiración (o de larga duración).
4. En **App Settings → Basic**, copia el **App Secret** — se usa para
   verificar la firma HMAC de cada webhook.
5. Desde el dashboard de la plataforma, entra a **Integraciones** y llena el
   formulario de WhatsApp con: `phone_number_id`, `access_token`,
   `app_secret`, y un `verify_token` que tú mismo inventes (cualquier string
   único, ej. un UUID). Guarda — la plataforma cifra y guarda estos valores.
6. En Meta, ve a **WhatsApp → Configuration → Webhook** y registra:
   - **Callback URL:** `https://<tu-dominio>/api/webhooks/whatsapp`
   - **Verify token:** el mismo `verify_token` que pusiste en el paso 5.
   - Suscríbete al campo **`messages`**.
7. Meta hará un `GET` a la callback URL para verificarla
   (`app/api/webhooks/whatsapp/route.ts` responde el `hub.challenge` si el
   `verify_token` coincide con alguna organización). Si todo está bien,
   verás el webhook marcado como activo.
8. Envía un mensaje de WhatsApp al número conectado — debería aparecer en
   `/conversaciones` y el agente debería responder en segundos.

> **Nota sobre certificados / mTLS:** WhatsApp Cloud API no requiere mTLS
> del lado del cliente para el webhook entrante (a diferencia de On-Premise
> API); la única validación de origen es la firma `X-Hub-Signature-256`, que
> el webhook verifica contra el `app_secret` de cada organización antes de
> procesar cualquier mensaje. Si en el futuro se migra a On-Premise API con
> el Meta Internal CA, esa verificación adicional se haría a nivel de
> infraestructura (Vercel no expone terminación mTLS nativa), no en este
> route handler.

## Configurar Google Calendar

1. En [Google Cloud Console](https://console.cloud.google.com), crea (o
   reutiliza) un proyecto y habilita la **Google Calendar API**.
2. Configura la **pantalla de consentimiento OAuth** (tipo externo está bien
   para empezar; los negocios que conecten su calendario verán el aviso de
   "app no verificada" hasta que se someta a verificación de Google, algo
   fuera del alcance de este MVP).
3. Crea credenciales **OAuth client ID**, tipo **Web application**, y agrega
   como **Authorized redirect URI** exactamente el valor de
   `GOOGLE_OAUTH_REDIRECT_URI` (ej.
   `https://tu-dominio.com/api/auth/google/callback`).
4. Copia el **Client ID** y **Client Secret** a las variables de entorno.
5. Desde **Integraciones** en el dashboard, haz clic en "Conectar Google
   Calendar" — te lleva por el flujo OAuth (`access_type=offline`,
   `prompt=consent` para forzar la entrega de un `refresh_token`).
6. Tras autorizar, selecciona en qué calendario de tu cuenta de Google se
   deben crear las citas.

## Deploy a Vercel

1. Sube el repo a GitHub/GitLab y conéctalo en
   [vercel.com/new](https://vercel.com/new), con **Root Directory** apuntando
   a `web/`.
2. Configura todas las variables de `.env.example` en **Settings →
   Environment Variables** del proyecto en Vercel (para `Production` y
   `Preview`).
3. Actualiza `NEXT_PUBLIC_APP_URL` y `GOOGLE_OAUTH_REDIRECT_URI` para que
   apunten al dominio real de Vercel (o tu dominio custom), y agrega ese
   mismo redirect URI en Google Cloud Console.
4. Haz deploy. Confirma que `app/api/webhooks/whatsapp/route.ts` corre en el
   runtime Node.js (ya declarado en el archivo vía
   `export const runtime = 'nodejs'` — necesario porque la verificación
   HMAC usa el módulo nativo `crypto`, no disponible en el runtime Edge).
5. Repite los pasos de **Configurar Meta** apuntando la Callback URL al
   dominio de producción.

## Variables de entorno (referencia completa)

Ver [`​.env.example`](./.env.example) — cada variable está documentada
in-line con de dónde obtenerla.

## Seguridad

- **Row Level Security** en las 8 tablas de negocio, filtrando siempre por
  `organization_id` vía la función `public.current_organization_id()`
  (`supabase/migrations/0011_rls_policies.sql`). El cliente `service_role`
  (usado sólo en el webhook y en `lib/supabase/admin.ts`) omite RLS por
  diseño de Supabase — nunca se expone al navegador.
- **Cifrado en reposo**: `app_secret`, `access_token` de WhatsApp, y los
  tokens OAuth de Google se cifran con AES-256-GCM (`lib/crypto.ts`) antes
  de guardarse; `ENCRYPTION_KEY` es una única clave estática por ahora (sin
  rotación) — deuda técnica aceptable para un MVP, documentada aquí para que
  quede explícita.
- **Verificación de firma del webhook**: cada `POST` a
  `/api/webhooks/whatsapp` se descarta (con `200 OK`, para que Meta no
  reintente indefinidamente) si el header `X-Hub-Signature-256` no valida
  contra el `app_secret` de la organización resuelta por `phone_number_id`.
  Ningún dato se persiste antes de esa verificación.
- **Idempotencia**: `messages.wa_message_id` es único — si Meta reintenta la
  entrega de un evento, el segundo intento no duplica la fila (se detecta el
  código de error `23505` de Postgres y se trata como no-op).
- **Sandbox del agente** (`/api/agent/sandbox`, usado por "Probar agente" en
  Personalización) exige sesión autenticada y siempre usa el
  `organization_id` resuelto de esa sesión — nunca uno enviado por el
  cliente — y las tools con efectos secundarios (`book_appointment`,
  `save_contact_info`, `request_human_handoff`) simulan su resultado en vez
  de escribir en la base de datos o llamar a Google Calendar real.

## Estructura del proyecto

```
web/
├── app/
│   ├── (marketing)/          Landing pública
│   ├── (auth)/                login, signup, callback
│   ├── (app)/                  dashboard, citas, conversaciones,
│   │                            personalizacion, integraciones
│   └── api/
│       ├── webhooks/whatsapp/  webhook entrante (GET verify, POST eventos)
│       ├── auth/google/        OAuth de Google Calendar
│       ├── google/calendars/   listar calendarios de la cuenta conectada
│       └── agent/sandbox/      "Probar agente" sin efectos secundarios
├── lib/
│   ├── agent/                  system prompt, tools, orquestador del LLM
│   ├── google/                 OAuth, freebusy, crear/actualizar/borrar eventos
│   ├── whatsapp/                firma HMAC, envío/persistencia de mensajes
│   ├── supabase/                clientes server/browser/admin + middleware
│   ├── dashboard/               queries de KPIs
│   ├── auth/                    requireCurrentOrg()
│   ├── crypto.ts                AES-256-GCM
│   └── database.types.ts        tipos de la BD (escritos a mano, sin CLI)
├── components/                  UI compartida (chat, dashboard, layout, auth)
└── supabase/
    ├── migrations/               un archivo por tabla + RLS + trigger de signup
    └── seed.sql                  datos de ejemplo para desarrollo
```

## Criterios de aceptación (checklist funcional)

- [ ] El agente responde en menos de 5 segundos a un mensaje de WhatsApp.
- [ ] El agente recolecta nombre, servicio, horario y confirma antes de
      agendar.
- [ ] Una cita agendada por el agente aparece simultáneamente en Google
      Calendar y en `/citas`.
- [ ] Desactivar el bot en `/conversaciones/[id]` detiene las respuestas
      automáticas para esa conversación, reflejado en vivo sin recargar.
- [ ] Cambiar el prompt/tono en `/personalizacion` afecta la siguiente
      respuesta del agente (probable primero en "Probar agente").
- [ ] Los datos de una organización nunca son visibles para otra (RLS).
- [ ] El webhook siempre responde `200` a Meta, incluso si el procesamiento
      posterior falla (el error se loguea, no se propaga a la respuesta
      HTTP).
