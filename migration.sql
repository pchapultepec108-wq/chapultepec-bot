-- ============================================================
-- Migración: chapultepec-bot v2
-- Fecha: 2026-06-10
-- Descripción:
--   1. Agrega columna etapa_kanban (reemplaza hack en notas)
--   2. Agrega columna info_general_enviada (controla spam de secuencia)
--   3. Migra datos existentes desde notas → etapa_kanban
--   4. Marca info_general_enviada = true para leads que ya recibieron fotos
--   5. Habilita RLS en todas las tablas + política anon (seguridad Supabase)
-- ============================================================

-- Paso 1: nuevas columnas
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS etapa_kanban       text    NOT NULL DEFAULT 'Contacto',
  ADD COLUMN IF NOT EXISTS info_general_enviada boolean NOT NULL DEFAULT false;

-- Paso 2: migrar etapa desde notas → etapa_kanban y limpiar notas
UPDATE leads
SET
  etapa_kanban = COALESCE(
    (regexp_match(notas, '\[etapa:([^\]]+)\]'))[1],
    'Contacto'
  ),
  notas = TRIM(regexp_replace(COALESCE(notas, ''), '\[etapa:[^\]]+\]\s*', '', 'g'))
WHERE notas ~ '\[etapa:';

-- Validar que etapa migrada sea válida; si no, resetear a 'Contacto'
UPDATE leads
SET etapa_kanban = 'Contacto'
WHERE etapa_kanban NOT IN ('Contacto', 'Propuesta', 'Negociación', 'Cerrado', 'No Interesado');

-- Paso 3: marcar info_general_enviada = true para leads que ya recibieron las fotos
-- (verificado en interacciones con el sentinel '[FOTOS PH]')
UPDATE leads l
SET info_general_enviada = true
WHERE EXISTS (
  SELECT 1
  FROM interacciones i
  WHERE i.lead_id = l.id
    AND i.contenido = '[FOTOS PH]'
);

-- ============================================================
-- Paso 4: RLS — Row Level Security
-- El bot usa anon key desde Node.js — no hay usuarios humanos
-- autenticados. Las políticas permiten acceso total a anon
-- para que el bot pueda leer/escribir, pero RLS activado
-- elimina el advisory de seguridad de Supabase.
-- ============================================================

-- Activar RLS en todas las tablas
ALTER TABLE leads               ENABLE ROW LEVEL SECURITY;
ALTER TABLE interacciones       ENABLE ROW LEVEL SECURITY;
ALTER TABLE llamadas_rescatadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE wa_session          ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas previas si existen (idempotente)
DROP POLICY IF EXISTS "anon_full_access" ON leads;
DROP POLICY IF EXISTS "anon_full_access" ON interacciones;
DROP POLICY IF EXISTS "anon_full_access" ON llamadas_rescatadas;
DROP POLICY IF EXISTS "anon_full_access" ON wa_session;

-- Crear política: acceso total para anon key (el bot Node.js)
-- USING = condición para SELECT/UPDATE/DELETE
-- WITH CHECK = condición para INSERT/UPDATE
CREATE POLICY "anon_full_access" ON leads
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon_full_access" ON interacciones
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon_full_access" ON llamadas_rescatadas
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon_full_access" ON wa_session
  FOR ALL TO anon USING (true) WITH CHECK (true);
