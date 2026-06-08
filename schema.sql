CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS leads (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre         TEXT,
  telefono       TEXT NOT NULL UNIQUE,
  correo         TEXT,
  interes        TEXT CHECK (interes IN ('Penthouse','Departamento','Ambos','Sin definir')) DEFAULT 'Sin definir',
  estado         TEXT CHECK (estado IN ('Nuevo','En Conversación','Calificado','Cita Agendada','No Interesado')) DEFAULT 'Nuevo',
  canal_origen   TEXT CHECK (canal_origen IN ('WhatsApp','Instagram','TikTok','Sitio Web','Referido','Llamada Rescatada')) DEFAULT 'WhatsApp',
  notas          TEXT,
  fecha_cita     TIMESTAMPTZ,
  creado_en      TIMESTAMPTZ DEFAULT now(),
  actualizado_en TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS interacciones (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id   UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  tipo      TEXT CHECK (tipo IN ('Mensaje Entrante','Mensaje Saliente Bot','Llamada Rescatada','Nota Manual','Cita Confirmada','Visita Realizada')) NOT NULL,
  contenido TEXT,
  metadata  JSONB DEFAULT '{}',
  creado_en TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS llamadas_rescatadas (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  telefono   TEXT NOT NULL,
  lead_id    UUID REFERENCES leads(id),
  respondida BOOLEAN DEFAULT false,
  creado_en  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sistema_knowledge_base (
  id             SERIAL PRIMARY KEY,
  clave          TEXT UNIQUE NOT NULL,
  datos          JSONB NOT NULL,
  actualizado_en TIMESTAMPTZ DEFAULT now()
);

CREATE OR REPLACE FUNCTION actualizar_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.actualizado_en = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_leads_updated
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

CREATE INDEX IF NOT EXISTS idx_leads_telefono ON leads (telefono);
CREATE INDEX IF NOT EXISTS idx_leads_estado   ON leads (estado);
CREATE INDEX IF NOT EXISTS idx_interacciones_lead ON interacciones (lead_id);

INSERT INTO sistema_knowledge_base (clave, datos) VALUES
('parque_chapultepec_info', '{
  "desarrollo": "Parque Chapultepec",
  "ciudad": "Cuernavaca, Morelos",
  "telefono": "7771758412",
  "web": "https://parquechapultepecmorelos.com",
  "instagram": "@pchapultepec",
  "tiktok": "@parquechapultepec",
  "amenidades": ["Alberca climatizada","Jardin tropical","Caseta seguridad + camaras 24/7","Elevador","A 50m del parque"],
  "propiedades": {
    "penthouse": {"precio": 4500000, "m2": 336.83, "rooftop_m2": 85, "recamaras": 3, "elevador_directo": true, "eslogan": "Vive en las alturas de Cuernavaca"},
    "departamento": {"precio": 2800000, "m2": 112, "rooftop_m2": 30, "recamaras": 2, "eslogan": "Tu rooftop privado en Cuernavaca"}
  },
  "visitas": {"dias": ["Jueves","Sabado"], "asesor": "Alejandro"}
}')
ON CONFLICT (clave) DO UPDATE SET datos = EXCLUDED.datos;
