-- ============================================================
-- MÓDULO: Cotizaciones para organizaciones + Pago obligatorio en citas
-- Ejecutar DESPUÉS de sql/mejoras-v3.sql
--   psql -d yerbateras -f sql/cotizaciones-y-pago-citas.sql
-- ============================================================

-- ============================================================
-- TABLA: cotizaciones (solicitudes de organizaciones/empresas)
-- ============================================================
CREATE TABLE IF NOT EXISTS cotizaciones (
  id SERIAL PRIMARY KEY,
  organizacion VARCHAR(150) NOT NULL,
  nombre_contacto VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL,
  telefono VARCHAR(30) NOT NULL,
  interes TEXT,               -- que producto/kit les interesa
  cantidad_estimada INTEGER,  -- cuantos kits/unidades aprox
  mensaje TEXT,
  estado VARCHAR(30) NOT NULL DEFAULT 'nueva', -- nueva, contactada, cerrada
  creado_en TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cotizaciones_estado ON cotizaciones(estado);

-- ============================================================
-- Pago obligatorio en citas de masaje
-- ============================================================
ALTER TABLE citas ADD COLUMN IF NOT EXISTS pagada BOOLEAN DEFAULT FALSE;
ALTER TABLE citas ADD COLUMN IF NOT EXISTS monto_pagado NUMERIC(12,2);
ALTER TABLE citas ADD COLUMN IF NOT EXISTS wompi_reference VARCHAR(100) UNIQUE;
ALTER TABLE citas ADD COLUMN IF NOT EXISTS wompi_transaction_id VARCHAR(100);
ALTER TABLE citas ADD COLUMN IF NOT EXISTS pago_expira TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_citas_wompi_reference ON citas(wompi_reference);
