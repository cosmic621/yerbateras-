-- ============================================================
-- MÓDULO: Citas ligadas a usuario + horario configurable por día
-- Ejecutar DESPUÉS de sql/citas.sql
--   psql -d yerbateras -f sql/citas-v2.sql
-- ============================================================

-- Vincula la cita a una cuenta (opcional: sigue permitiendo agendar sin login)
ALTER TABLE citas ADD COLUMN IF NOT EXISTS usuario_id UUID REFERENCES usuarios(id);
CREATE INDEX IF NOT EXISTS idx_citas_usuario ON citas(usuario_id);

-- Horario de atención configurable por día de la semana (reemplaza el
-- horario unico y fijo que vivia en configuracion_tienda)
CREATE TABLE IF NOT EXISTS horario_atencion (
  dia_semana INTEGER PRIMARY KEY CHECK (dia_semana BETWEEN 0 AND 6), -- 0=domingo .. 6=sabado
  hora_apertura TIME NOT NULL DEFAULT '09:00',
  hora_cierre TIME NOT NULL DEFAULT '18:00',
  activo BOOLEAN NOT NULL DEFAULT TRUE
);

-- Semilla: toma lo que ya estaba configurado (lunes a sabado, 9-6) como
-- punto de partida; el admin lo puede cambiar despues desde el panel.
INSERT INTO horario_atencion (dia_semana, hora_apertura, hora_cierre, activo) VALUES
  (0, '09:00', '18:00', FALSE), -- domingo cerrado por defecto
  (1, '09:00', '18:00', TRUE),
  (2, '09:00', '18:00', TRUE),
  (3, '09:00', '18:00', TRUE),
  (4, '09:00', '18:00', TRUE),
  (5, '09:00', '18:00', TRUE),
  (6, '09:00', '18:00', TRUE)
ON CONFLICT (dia_semana) DO NOTHING;
