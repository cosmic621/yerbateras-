-- ============================================================
-- MÓDULO: Agendamiento de masajes
-- Ejecutar DESPUÉS de schema.sql
--   psql -d yerbateras -f sql/citas.sql
-- ============================================================

-- ============================================================
-- TABLA: servicios_masaje
-- ============================================================
CREATE TABLE IF NOT EXISTS servicios_masaje (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(150) NOT NULL,
  descripcion TEXT,
  duracion_minutos INTEGER NOT NULL DEFAULT 60 CHECK (duracion_minutos > 0),
  precio NUMERIC(12,2) NOT NULL DEFAULT 0,
  activo BOOLEAN DEFAULT TRUE,
  creado_en TIMESTAMP DEFAULT NOW(),
  actualizado_en TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- TABLA: citas
-- ============================================================
CREATE TABLE IF NOT EXISTS citas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  servicio_id UUID NOT NULL REFERENCES servicios_masaje(id),
  nombre_cliente VARCHAR(150) NOT NULL,
  email_cliente VARCHAR(150) NOT NULL,
  telefono_cliente VARCHAR(30) NOT NULL,
  fecha DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  estado VARCHAR(30) NOT NULL DEFAULT 'pendiente_verificacion',
    -- pendiente_verificacion, confirmada, cancelada, completada, no_asistio
  notas TEXT,
  token_verificacion VARCHAR(64) UNIQUE,
  token_expira TIMESTAMP,
  whatsapp_enviado BOOLEAN DEFAULT FALSE,
  creado_en TIMESTAMP DEFAULT NOW(),
  actualizado_en TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- TABLA: bloqueos_agenda (vacaciones, horas no disponibles, etc.)
-- ============================================================
CREATE TABLE IF NOT EXISTS bloqueos_agenda (
  id SERIAL PRIMARY KEY,
  fecha DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  motivo VARCHAR(255),
  creado_en TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- Configuración del negocio de masajes (reutiliza configuracion_tienda)
-- ============================================================
INSERT INTO configuracion_tienda (clave, valor, descripcion) VALUES
  ('citas_hora_apertura', '09:00', 'Hora de apertura para citas'),
  ('citas_hora_cierre', '18:00', 'Hora de cierre para citas'),
  ('citas_dias_atencion', '1,2,3,4,5,6', 'Días de atención (0=domingo..6=sábado)'),
  ('citas_whatsapp_negocio', '+573102631592', 'WhatsApp que recibe notificaciones de nuevas citas')
ON CONFLICT (clave) DO NOTHING;

-- ============================================================
-- Servicios iniciales de ejemplo (editar/eliminar libremente)
-- ============================================================
INSERT INTO servicios_masaje (nombre, descripcion, duracion_minutos, precio) VALUES
  ('Masaje relajante clásico', 'Masaje corporal completo con aceites esenciales para liberar tensión.', 60, 90000),
  ('Masaje de tejido profundo', 'Enfocado en contracturas y tensión muscular profunda.', 75, 110000),
  ('Masaje express de espalda y cuello', 'Sesión corta enfocada en zona cervical y espalda.', 30, 55000)
ON CONFLICT DO NOTHING;

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_citas_fecha ON citas(fecha);
CREATE INDEX IF NOT EXISTS idx_citas_estado ON citas(estado);
CREATE INDEX IF NOT EXISTS idx_citas_token ON citas(token_verificacion);
CREATE INDEX IF NOT EXISTS idx_bloqueos_fecha ON bloqueos_agenda(fecha);

-- ============================================================
-- TRIGGER: actualizado_en automático
-- ============================================================
CREATE TRIGGER trg_citas_updated BEFORE UPDATE ON citas
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_servicios_masaje_updated BEFORE UPDATE ON servicios_masaje
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
