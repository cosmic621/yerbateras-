-- ============================================================
--  MEJORAS V5: compra sin cuenta, carrusel, gestion de citas por enlace
--  Ejecutar DESPUES de mejoras-v4.sql:   psql -d yerbateras -f sql/mejoras-v5.sql
--  Es seguro correrlo mas de una vez.
-- ============================================================

-- ── Pedidos de invitado: los datos del cliente viven en el pedido ──
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS nombre_cliente      VARCHAR(150);
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS email_cliente       VARCHAR(150);
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS telefono_cliente    VARCHAR(30);
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS direccion_envio     TEXT;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS ciudad_envio        VARCHAR(100);
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS departamento_envio  VARCHAR(100);
CREATE INDEX IF NOT EXISTS idx_pedidos_email ON pedidos (LOWER(email_cliente));

-- ── Citas: enlace privado (enviado por correo) para ver / reprogramar ──
ALTER TABLE citas ADD COLUMN IF NOT EXISTS token_gestion VARCHAR(64);
UPDATE citas SET token_gestion = replace(uuid_generate_v4()::text || uuid_generate_v4()::text, '-', '')
  WHERE token_gestion IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_citas_token_gestion ON citas (token_gestion);

-- ── Carrusel de la pagina principal ─────────────────────────
CREATE TABLE IF NOT EXISTS banners (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo       VARCHAR(150),
  subtitulo    VARCHAR(250),
  boton_texto  VARCHAR(60),
  boton_url    VARCHAR(250),
  imagen_url   TEXT NOT NULL,
  orden        INTEGER NOT NULL DEFAULT 0,
  activo       BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en    TIMESTAMP DEFAULT NOW()
);

-- ── Newsletter: de donde llego la suscripcion (opcional) ────
ALTER TABLE suscriptores_newsletter ADD COLUMN IF NOT EXISTS origen VARCHAR(30) DEFAULT 'sitio';
