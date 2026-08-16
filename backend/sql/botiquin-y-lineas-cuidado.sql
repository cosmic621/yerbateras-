-- ============================================================
-- MÓDULO: Arquitectura de tienda por líneas de cuidado
--         + Botiquín Yerbatero (motor de reglas, sin IA)
-- Ejecutar DESPUÉS de sql/mejoras-v3.sql
--   psql -d yerbateras -f sql/botiquin-y-lineas-cuidado.sql
-- ============================================================

-- ============================================================
-- 1) LÍNEAS DE CUIDADO (navegación PRINCIPAL, por necesidad)
--    Un producto puede pertenecer a VARIAS líneas a la vez.
-- ============================================================
CREATE TABLE IF NOT EXISTS lineas_cuidado (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(150) UNIQUE NOT NULL,
  slug VARCHAR(150) UNIQUE NOT NULL,
  descripcion TEXT,
  orden INTEGER DEFAULT 0,
  activa BOOLEAN DEFAULT TRUE,
  creado_en TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS producto_lineas_cuidado (
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  linea_id INTEGER NOT NULL REFERENCES lineas_cuidado(id) ON DELETE CASCADE,
  PRIMARY KEY (producto_id, linea_id)
);

INSERT INTO lineas_cuidado (nombre, slug, orden) VALUES
  ('Para acompañar el dolor',        'acompanar-el-dolor',       1),
  ('Para el cuidado menstrual',      'cuidado-menstrual',        2),
  ('Para la salud ginecológica',     'salud-ginecologica',       3),
  ('Para cultivar el placer',        'cultivar-el-placer',       4),
  ('Para el descanso y el bienestar','descanso-y-bienestar',     5),
  ('Para el cuidado energético',     'cuidado-energetico',       6)
ON CONFLICT (nombre) DO NOTHING;

-- ============================================================
-- 2) TIPOS DE PREPARACIÓN (navegación SECUNDARIA, por formato)
--    Reutiliza la tabla "categorias" que ya existia (un producto
--    tiene UN solo tipo de preparacion, igual que antes).
--    Se desactivan las categorias viejas de ejemplo (no se borran,
--    por si algun producto ya las tiene asignadas) y se agregan
--    las reales del negocio.
-- ============================================================
UPDATE categorias SET activa = FALSE
WHERE slug IN ('cannabis-medicinal','aceites-tinturas','infusiones-tes','cremas-topicos','suplementos','kits-combos');

INSERT INTO categorias (nombre, descripcion, slug) VALUES
  ('Pomadas', 'Las pomadas medicinales de Yerbateras combinan el poder de las plantas con una base nutritiva para aliviar molestias, hidratar la piel, apoyar la respiración, equilibrar ciclos femeninos y fomentar el bienestar integral.', 'pomadas'),
  ('Oleatos', 'Los aceites u oleatos, elaborados con aceites vegetales y plantas secas, concentran propiedades con el tiempo. Desde 2020 en Yerbateras creamos oleatos con aceites esenciales para masajes terapéuticos.', 'oleatos'),
  ('Roll-On', 'Los Roll-On Relax son prácticos remedios herbales para puntos energéticos del cuerpo, ideales para integrar la aromaterapia en la vida diaria de manera sencilla y efectiva.', 'roll-on'),
  ('Perfumes', 'Perfumes botánicos elaborados con esencias naturales.', 'perfumes'),
  ('Estimulantes Botánicos', 'Estimulantes y lubricantes elaborados con plantas y bases naturales que respetan el equilibrio del pH y abrazan la diversidad corporal, promoviendo la autoexploración y conexión con el cuerpo.', 'estimulantes-botanicos'),
  ('Baños Herbales', 'Baños herbales energéticos preparados con plantas seleccionadas para el ritual de autocuidado.', 'banos-herbales'),
  ('Almohadillas Herbales', 'Almohadillas rellenas de hierbas para acompañar el descanso y aliviar molestias.', 'almohadillas-herbales'),
  ('Medicina CBD', 'Línea de productos elaborados con CBD.', 'medicina-cbd'),
  ('Brebajes', 'Preparaciones líquidas botánicas de uso ritual y medicinal.', 'brebajes'),
  ('Sahumerios', 'Sahumerios para limpieza y armonización energética de espacios.', 'sahumerios'),
  ('Trío Medicinal', 'Sets de tres preparaciones medicinales pensadas para complementarse entre sí.', 'trio-medicinal'),
  ('Armonizadores Áuricos', 'Preparaciones botánicas pensadas para el equilibrio energético y áurico.', 'armonizadores-auricos')
ON CONFLICT (nombre) DO NOTHING;

-- ============================================================
-- 3) BOTIQUÍN YERBATERO — motor de reglas (sin IA)
--    preguntas -> respuestas -> (siguiente pregunta) o (productos)
-- ============================================================
CREATE TABLE IF NOT EXISTS botiquin_preguntas (
  id SERIAL PRIMARY KEY,
  texto VARCHAR(255) NOT NULL,
  es_inicial BOOLEAN DEFAULT FALSE, -- marca la pregunta con la que arranca el flujo
  orden INTEGER DEFAULT 0,
  activa BOOLEAN DEFAULT TRUE,
  creado_en TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS botiquin_respuestas (
  id SERIAL PRIMARY KEY,
  pregunta_id INTEGER NOT NULL REFERENCES botiquin_preguntas(id) ON DELETE CASCADE,
  texto VARCHAR(255) NOT NULL,
  orden INTEGER DEFAULT 0,
  -- si esta columna no es NULL, elegir esta respuesta pasa a otra pregunta;
  -- si es NULL, esta respuesta es un resultado final (muestra productos)
  siguiente_pregunta_id INTEGER REFERENCES botiquin_preguntas(id) ON DELETE SET NULL,
  creado_en TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS botiquin_respuesta_productos (
  respuesta_id INTEGER NOT NULL REFERENCES botiquin_respuestas(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  PRIMARY KEY (respuesta_id, producto_id)
);

CREATE INDEX IF NOT EXISTS idx_botiquin_respuestas_pregunta ON botiquin_respuestas(pregunta_id);
CREATE INDEX IF NOT EXISTS idx_producto_lineas_producto ON producto_lineas_cuidado(producto_id);
CREATE INDEX IF NOT EXISTS idx_producto_lineas_linea ON producto_lineas_cuidado(linea_id);

-- Nota de regalo del carrito (ej: "¿Esta compra es un regalo? Agrega una nota aquí")
ALTER TABLE carritos ADD COLUMN IF NOT EXISTS notas VARCHAR(120);

-- Semilla de ejemplo con el flujo exacto del documento de arquitectura.
-- El admin puede editar/reemplazar todo esto desde el panel — esto es
-- solo para que el modulo no arranque vacio.
INSERT INTO botiquin_preguntas (texto, es_inicial, orden) VALUES
  ('¿Qué necesita tu cuerpo hoy?', TRUE, 1)
ON CONFLICT DO NOTHING;

DO $$
DECLARE
  p1_id INTEGER;
  p2_dolor_id INTEGER;
  r_dolor_id INTEGER;
BEGIN
  SELECT id INTO p1_id FROM botiquin_preguntas WHERE texto = '¿Qué necesita tu cuerpo hoy?' LIMIT 1;

  IF p1_id IS NOT NULL THEN
    -- Sub-pregunta para "Acompañar el dolor"
    INSERT INTO botiquin_preguntas (texto, es_inicial, orden)
    VALUES ('¿Qué tipo de dolor quieres acompañar?', FALSE, 1)
    RETURNING id INTO p2_dolor_id;

    INSERT INTO botiquin_respuestas (pregunta_id, texto, orden, siguiente_pregunta_id) VALUES
      (p1_id, 'Acompañar el dolor', 1, p2_dolor_id),
      (p1_id, 'Cuidado menstrual', 2, NULL),
      (p1_id, 'Salud ginecológica', 3, NULL),
      (p1_id, 'Cultivar el placer', 4, NULL),
      (p1_id, 'Descansar', 5, NULL),
      (p1_id, 'Cuidado energético', 6, NULL);

    INSERT INTO botiquin_respuestas (pregunta_id, texto, orden, siguiente_pregunta_id) VALUES
      (p2_dolor_id, 'Menstrual', 1, NULL),
      (p2_dolor_id, 'Muscular', 2, NULL),
      (p2_dolor_id, 'Articular', 3, NULL),
      (p2_dolor_id, 'Respiratorio', 4, NULL);
  END IF;
END $$;
