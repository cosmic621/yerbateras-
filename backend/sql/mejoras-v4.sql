-- ============================================================
--  MEJORAS V4: secciones activables, temporadas, kits, eventos, talleres
--  Ejecutar DESPUES de schema.sql y los demas scripts:
--    psql -d yerbateras -f sql/mejoras-v4.sql
--  Es seguro correrlo mas de una vez.
-- ============================================================

-- ── Secciones del sitio que se pueden prender / apagar ──────
-- tipo 'modulo'    = parte fija del sitio (masajes, talleres, eventos, kits...)
-- tipo 'temporada' = seccion de temporada (navidad, dia de la madre...). Los
--                    productos/kits con productos.temporada = clave solo se
--                    muestran mientras su seccion este activa.
CREATE TABLE IF NOT EXISTS secciones_sitio (
  clave          VARCHAR(50) PRIMARY KEY,
  nombre         VARCHAR(100) NOT NULL,
  descripcion    TEXT,
  tipo           VARCHAR(20) NOT NULL DEFAULT 'modulo' CHECK (tipo IN ('modulo','temporada')),
  activa         BOOLEAN NOT NULL DEFAULT TRUE,
  es_sistema     BOOLEAN NOT NULL DEFAULT FALSE,
  orden          INTEGER NOT NULL DEFAULT 0,
  actualizado_en TIMESTAMP DEFAULT NOW()
);

INSERT INTO secciones_sitio (clave, nombre, descripcion, tipo, activa, es_sistema, orden) VALUES
  ('citas',       'Masajes (agendar cita)', 'Página para agendar masajes',                'modulo',    TRUE, TRUE, 1),
  ('talleres',    'Talleres',               'Talleres con inscripción y pago anticipado', 'modulo',    TRUE, TRUE, 2),
  ('eventos',     'Eventos (calendario)',   'Calendario de eventos con flyers',           'modulo',    TRUE, TRUE, 3),
  ('kits',        'Kits de regalo',         'Kits listos para regalar',                   'modulo',    TRUE, TRUE, 4),
  ('arma_tu_kit', 'Arma tu kit',            'Ventana emergente para armar tu kit',        'modulo',    TRUE, TRUE, 5),
  ('navidad',     'Navidad',                'Artículos y kits especiales de Navidad',     'temporada', TRUE, TRUE, 10)
ON CONFLICT (clave) DO NOTHING;

-- ── Productos: kits y temporada ─────────────────────────────
ALTER TABLE productos ADD COLUMN IF NOT EXISTS es_kit BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS contenido_kit TEXT;           -- "Incluye: ..." (solo kits)
ALTER TABLE productos ADD COLUMN IF NOT EXISTS temporada VARCHAR(50);        -- clave de secciones_sitio (tipo temporada)
CREATE INDEX IF NOT EXISTS idx_productos_temporada ON productos(temporada);
CREATE INDEX IF NOT EXISTS idx_productos_es_kit ON productos(es_kit);

-- ── Eventos (calendario) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS eventos (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo       VARCHAR(200) NOT NULL,
  descripcion  TEXT,
  fecha        DATE NOT NULL,
  hora_inicio  TIME,
  hora_fin     TIME,
  lugar        VARCHAR(200),
  flyer_url    TEXT,
  enlace       TEXT,
  activo       BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en    TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_eventos_fecha ON eventos(fecha);

-- ── Talleres ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS talleres (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo             VARCHAR(200) NOT NULL,
  descripcion        TEXT,
  instructor         VARCHAR(150),
  fecha              DATE NOT NULL,
  hora_inicio        TIME NOT NULL,
  duracion_horas     NUMERIC(4,1) DEFAULT 2,
  lugar              VARCHAR(200),
  precio             NUMERIC(12,2) NOT NULL CHECK (precio >= 0),   -- precio POR PERSONA
  cupos              INTEGER NOT NULL DEFAULT 10 CHECK (cupos > 0),
  porcentaje_minimo  INTEGER NOT NULL DEFAULT 50 CHECK (porcentaje_minimo BETWEEN 50 AND 100),
  flyer_url          TEXT,
  activo             BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en          TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_talleres_fecha ON talleres(fecha);

CREATE TABLE IF NOT EXISTS inscripciones_taller (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  taller_id         UUID NOT NULL REFERENCES talleres(id),
  nombre            VARCHAR(150) NOT NULL,
  email             VARCHAR(150) NOT NULL,
  telefono          VARCHAR(30)  NOT NULL,
  asistentes        INTEGER NOT NULL DEFAULT 1 CHECK (asistentes BETWEEN 1 AND 10),
  monto_total       NUMERIC(12,2) NOT NULL,
  monto_pagado      NUMERIC(12,2) NOT NULL DEFAULT 0,
  estado            VARCHAR(20) NOT NULL DEFAULT 'pendiente_pago'
                    CHECK (estado IN ('pendiente_pago','confirmada','cancelada')),
  pago_expira       TIMESTAMP,
  requiere_revision BOOLEAN NOT NULL DEFAULT FALSE,     -- pago aprobado cuando el cupo ya se habia ocupado
  notas             TEXT,
  usuario_id        UUID REFERENCES usuarios(id),
  creado_en         TIMESTAMP DEFAULT NOW(),
  actualizado_en    TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_inscripciones_taller ON inscripciones_taller(taller_id);

-- Cada intento de pago (anticipo, saldo) es una fila: asi el webhook puede
-- ser idempotente y validar el monto de cada transaccion por separado.
CREATE TABLE IF NOT EXISTS pagos_taller (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inscripcion_id        UUID NOT NULL REFERENCES inscripciones_taller(id) ON DELETE CASCADE,
  wompi_reference       VARCHAR(100) UNIQUE NOT NULL,
  wompi_transaction_id  VARCHAR(100),
  monto                 NUMERIC(12,2) NOT NULL,
  estado                VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','aprobado','rechazado')),
  creado_en             TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pagos_taller_insc ON pagos_taller(inscripcion_id);

-- ── Politica de cancelacion de citas: la clienta acepta antes de pagar ──
ALTER TABLE citas ADD COLUMN IF NOT EXISTS politica_aceptada BOOLEAN DEFAULT FALSE;
