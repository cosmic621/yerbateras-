-- ============================================================
-- MÓDULO: Reseñas reales + Cupones + Newsletter
-- Ejecutar DESPUÉS de schema.sql
--   psql -d yerbateras -f sql/mejoras-v3.sql
-- ============================================================

-- Una sola reseña por cliente por producto (evita duplicados/spam)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'resenas_producto_usuario_unique'
  ) THEN
    ALTER TABLE resenas ADD CONSTRAINT resenas_producto_usuario_unique UNIQUE (producto_id, usuario_id);
  END IF;
END $$;

-- Vincula el pedido al cupón usado (para reportes y para no reusar el mismo cupón dos veces sin control)
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS cupon_id INTEGER REFERENCES cupones(id);

-- ============================================================
-- TABLA: suscriptores_newsletter
-- ============================================================
CREATE TABLE IF NOT EXISTS suscriptores_newsletter (
  id SERIAL PRIMARY KEY,
  email VARCHAR(150) UNIQUE NOT NULL,
  activo BOOLEAN DEFAULT TRUE,
  creado_en TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_suscriptores_email ON suscriptores_newsletter(email);
