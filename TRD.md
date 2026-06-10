# TRD — Technical Requirements Document
## chapultepec-bot v2
**Proyecto:** Bot de ventas WhatsApp + CRM — Penthouse Parque Chapultepec, Cuernavaca  
**Fecha:** 2026-06-10  
**Stack:** Node.js 18+ · ESM · Baileys 6.7.9 · Supabase (anon key) · Claude Haiku (opcional)

---

## 1. Arquitectura General

```
Mac (LaunchAgent — KeepAlive)
└── node index.js  :3001
    ├── Baileys WA Socket       ← mensajes + llamadas WA
    ├── HTTP API Server         ← /api/*, /oauth/*, /qr
    └── Static Server           ← sirve crm.html
```

**Proceso único.** No hay workers, colas, ni balanceo. La sesión de WhatsApp es personal (QR scan).

---

## 2. Variables de Entorno

| Variable | Requerida | Descripción |
|---|---|---|
| `SUPABASE_URL` | ✅ | URL del proyecto Supabase |
| `SUPABASE_KEY` | ✅ | Anon key (no service_role) |
| `ANTHROPIC_API_KEY` | ⬜ | Si presente, activa Claude Haiku. Si no, usa respuestas por reglas |
| `BUFFER_API_KEY` | ⬜ | Token de lectura Buffer GraphQL API |
| `BUFFER_WRITE_TOKEN` | ⬜ | Token OAuth2 write de Buffer (se obtiene vía `/oauth/callback`) |
| `PORT` | ⬜ | Puerto HTTP. Default: `3001`. Fallback automático a `3002` si ocupado |

**⚠️ Seguridad:** `BUFFER_CLIENT_ID` y `BUFFER_CLIENT_SECRET` deben moverse a `.env`.  
Actualmente están hardcodeados en `index.js` línea ~1018 — pendiente de fix.

---

## 3. Schema de Base de Datos

### Tabla `leads`
| Columna | Tipo | Default | Notas |
|---|---|---|---|
| `id` | uuid PK | gen_random_uuid() | |
| `telefono` | text UNIQUE | — | Solo dígitos. Conflict key del upsert |
| `nombre` | text | null | |
| `estado` | text | 'Nuevo' | Ver estados válidos abajo |
| `interes` | text | null | `'Penthouse' \| 'Departamento' \| 'Ambos'` |
| `canal_origen` | text | null | `'WhatsApp' \| 'Llamada' \| 'Llamada telefónica'` |
| `notas` | text | null | Texto libre. **Ya no contiene `[etapa:X]`** desde v2 |
| `etapa_kanban` | text | 'Contacto' | ✅ v2 — columna real para el Kanban |
| `info_general_enviada` | boolean | false | ✅ v2 — controla spam de secuencia de fotos |
| `fotos_enviadas` | boolean | false | Legacy — reemplazado por `info_general_enviada` |
| `fecha_cita` | timestamptz | null | Se setea al detectar confirmación de día/hora |
| `creado_en` | timestamptz | now() | |
| `actualizado_en` | timestamptz | now() | Se actualiza manualmente en cada mutación |

### Tabla `interacciones`
| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `lead_id` | uuid FK → leads.id | |
| `tipo` | text | `'Mensaje Entrante' \| 'Mensaje Saliente Bot' \| 'Llamada Rescatada' \| 'Llamada'` |
| `contenido` | text | Sentinel especial: `'[FOTOS PH]'` indica que se envió la secuencia |
| `metadata` | jsonb | `{ tipo_actividad, completa, siguiente_actividad, origen }` |
| `creado_en` | timestamptz | auto |

### Tabla `llamadas_rescatadas`
| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `telefono` | text | |
| `lead_id` | uuid FK → leads.id | |
| `creado_en` | timestamptz | |

### Tabla `wa_session` (definida pero no usada — auth es local con archivos)
| Columna | Tipo |
|---|---|
| `id` | text PK |
| `data` | jsonb |
| `updated_at` | timestamptz |

---

## 4. Máquina de Estados

### `leads.estado` (workflow operacional)
```
Nuevo → En Conversación → Cita Agendada
                        → No Interesado
```

### `leads.etapa_kanban` (pipeline de ventas — Kanban)
```
Contacto → Propuesta → Negociación → Cerrado
                                   → No Interesado
```

**Mapeo etapa Kanban → estado DB** (para no romper constraints):
| etapa_kanban | estado |
|---|---|
| Contacto | En Conversación |
| Propuesta | En Conversación |
| Negociación | En Conversación |
| Cerrado | Cita Agendada |
| No Interesado | No Interesado |

---

## 5. Flujo de Mensajes WhatsApp (v2)

```
Mensaje entrante
    │
    ├─ rechaza regex → "Entendido..." + estado = 'No Interesado'
    ├─ confirmaDia regex → MSG_CONFIRMAR_CITA + estado = 'Cita Agendada'
    ├─ citaAgendada === true → MSG_RECORDATORIO_CITA
    └─ else:
        ├─ info_general_enviada === false
        │       → MSG_INFO_COMPLETA + enviarSecuencia('ph')
        │       → info_general_enviada = true (Supabase update)
        │
        └─ info_general_enviada === true
                → respuestaIA() si ANTHROPIC_API_KEY presente
                → respuestaReglas() como fallback
```

**Bug eliminado en v2:** el bloque `hayInteres` que preguntaba "¿Te mando las fotos?" después de ya haberlas enviado fue removido.

---

## 6. API HTTP — Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/qr` | Página HTML con QR de WhatsApp |
| GET | `/crm` `/` | Sirve `crm.html` |
| GET | `/api/deals` | Leads con etapa Kanban + alerta inactividad |
| PUT | `/api/deals/:id/stage` | Mover etapa (escribe en `etapa_kanban`) |
| GET | `/api/activities/:leadId` | Interacciones de un lead |
| POST | `/api/activities` | Registrar actividad (requiere `siguiente_actividad` si `completa=true`) |
| GET | `/api/stats` | Métricas: total, por etapa, valor pipeline, alertas |
| GET | `/api/buffer-posts` | Posts programados vía Buffer GraphQL |
| GET | `/api/posts-hoy` | Posts IA del día (lee `/tmp/chapultepec-posts-hoy.json`) |
| POST | `/api/test-send` | Enviar secuencia PH a un número manualmente |
| POST | `/api/llamada-entrante` | Webhook Vapi — hangup inmediato + WA async |
| POST | `/api/log` | Log genérico CRM |
| GET | `/oauth/callback` | Buffer OAuth2 code → token exchange |

---

## 7. Pipeline Social Media (Buffer)

```
Buffer API (GraphQL)
    └── GET /api/buffer-posts
            └── Filtra por 2 channel IDs (Instagram + TikTok)
            └── Retorna: id, estado, red, text, dueAt, sentAt, thumbnail

OAuth flow:
    Buffer redirect → /oauth/callback?code=X
        → POST https://api.bufferapp.com/1/oauth2/token.json
        → Escribe BUFFER_WRITE_TOKEN en .env
```

**Canales configurados:**
- `6a200357c687a22dd456797f` — Instagram `@pchapultepec`
- `6a20036fc687a22dd45679d0` — TikTok `@parquechapultepec`

Scripts auxiliares (no parte del server):
- `generar-posts.js` — genera contenido con IA
- `programar-semana.js` / `programar-6dias.js` — agenda en Buffer
- `publicar-buffer.js` — publica inmediato

---

## 8. Gestión de Sesión WhatsApp

- **Auth:** `useMultiFileAuthState('./auth_session')` — archivos locales (no Supabase)
- **Reconnect:** exponential backoff, cap 60s. Errores `440` → `process.exit(0)` (LaunchAgent reinicia). `loggedOut` → `setTimeout(iniciar, 3000)`
- **JID LID:** números con sufijo `@lid` se normalizan: `.replace(/@s\.whatsapp\.net$/, '').replace(/@lid$/, '')` para guardar en DB. El JID original se preserva para envío.
- **Render.com:** NO viable — filesystem efímero destruye `auth_session/` en cada restart.

---

## 9. Deuda Técnica Pendiente

| Prioridad | Item |
|---|---|
| 🔴 | `BUFFER_CLIENT_SECRET` hardcodeado en `index.js` → mover a `.env` |
| 🔴 | CRM sin autenticación — cualquiera con la URL tiene acceso total |
| 🟠 | URL pública para webhook Vapi (ngrok / Cloudflare Tunnel) |
| 🟡 | `useSupabaseAuthState()` — 80 líneas de código muerto, eliminar |
| 🟡 | Dependencias no usadas: `openai`, `canvas`, `whatsapp-web.js`, `puppeteer` |
| 🟡 | `fotos/` no está en repo — cualquier nuevo deploy requiere copia manual |
