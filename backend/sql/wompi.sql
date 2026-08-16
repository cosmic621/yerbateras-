-- ============================================================
-- MÓDULO: Pasarela de pagos Wompi (Nequi, PSE, tarjetas)
-- Ejecutar DESPUÉS de schema.sql
--   psql -d yerbateras -f sql/wompi.sql
-- ============================================================

ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS wompi_reference VARCHAR(100) UNIQUE;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS wompi_transaction_id VARCHAR(100);
ALTER TABLE pedidos ALTER COLUMN metodo_pago SET DEFAULT 'wompi';

CREATE INDEX IF NOT EXISTS idx_pedidos_wompi_reference ON pedidos(wompi_reference);

-- Nota: las columnas stripe_payment_intent_id / stripe_charge_id se dejan
-- intactas (no se borran) por si algún pedido viejo las tiene; simplemente
-- ya no se usan para pedidos nuevos.
