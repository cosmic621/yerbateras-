-- ============================================================
--  YERBATERAS — Schema PostgreSQL completo
--  Empresa naturista | Cannabis medicinal | INVIMA certificado
-- ============================================================

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLA: roles
-- ============================================================
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(50) UNIQUE NOT NULL,  -- 'admin', 'cliente'
  descripcion TEXT,
  creado_en TIMESTAMP DEFAULT NOW()
);

INSERT INTO roles (nombre, descripcion) VALUES
  ('admin', 'Administrador con acceso total al sistema'),
  ('cliente', 'Cliente registrado con acceso a la tienda')
ON CONFLICT (nombre) DO NOTHING;

-- ============================================================
-- TABLA: usuarios
-- ============================================================
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(150) NOT NULL,
  apellido VARCHAR(150),
  email VARCHAR(255) UNIQUE,
  telefono VARCHAR(20) UNIQUE,
  password_hash VARCHAR(255),                          -- null si usa OAuth
  rol_id INTEGER REFERENCES roles(id) DEFAULT 2,       -- 2 = cliente
  proveedor_auth VARCHAR(20) DEFAULT 'email',          -- 'email','google','phone'
  google_id VARCHAR(255) UNIQUE,
  avatar_url TEXT,
  verificado BOOLEAN DEFAULT FALSE,
  activo BOOLEAN DEFAULT TRUE,
  token_verificacion VARCHAR(255),
  token_expira TIMESTAMP,
  otp_code VARCHAR(10),
  otp_expira TIMESTAMP,
  ultimo_login TIMESTAMP,
  creado_en TIMESTAMP DEFAULT NOW(),
  actualizado_en TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- TABLA: categorias
-- ============================================================
CREATE TABLE IF NOT EXISTS categorias (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) UNIQUE NOT NULL,
  descripcion TEXT,
  slug VARCHAR(100) UNIQUE NOT NULL,
  imagen_url TEXT,
  activa BOOLEAN DEFAULT TRUE,
  creado_en TIMESTAMP DEFAULT NOW()
);

INSERT INTO categorias (nombre, descripcion, slug) VALUES
  ('Cannabis Medicinal', 'Productos derivados del cannabis con certificación INVIMA', 'cannabis-medicinal'),
  ('Aceites & Tinturas', 'Aceites esenciales y tinturas de plantas medicinales', 'aceites-tinturas'),
  ('Infusiones & Tés', 'Mezclas de hierbas para infusiones terapéuticas', 'infusiones-tes'),
  ('Cremas & Tópicos', 'Cremas y ungüentos de uso externo', 'cremas-topicos'),
  ('Suplementos', 'Suplementos naturales y adaptógenos', 'suplementos'),
  ('Kits & Combos', 'Paquetes combinados de productos', 'kits-combos')
ON CONFLICT (nombre) DO NOTHING;

-- ============================================================
-- TABLA: productos
-- ============================================================
CREATE TABLE IF NOT EXISTS productos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  descripcion_corta VARCHAR(500),
  precio NUMERIC(12,2) NOT NULL CHECK (precio >= 0),
  precio_descuento NUMERIC(12,2) CHECK (precio_descuento >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  stock_minimo INTEGER DEFAULT 5,
  categoria_id INTEGER REFERENCES categorias(id),
  imagen_principal TEXT,
  imagenes JSONB DEFAULT '[]',                         -- array de URLs adicionales
  sku VARCHAR(100) UNIQUE,
  certificacion_invima VARCHAR(100),
  principio_activo TEXT,                               -- cannabis, valeriana, etc.
  indicaciones TEXT,
  contraindicaciones TEXT,
  presentacion VARCHAR(100),                           -- '30ml', '60 cápsulas', etc.
  peso_gramos NUMERIC(8,2),
  activo BOOLEAN DEFAULT TRUE,
  destacado BOOLEAN DEFAULT FALSE,
  ventas_totales INTEGER DEFAULT 0,
  calificacion_promedio NUMERIC(3,2) DEFAULT 0,
  total_resenas INTEGER DEFAULT 0,
  creado_en TIMESTAMP DEFAULT NOW(),
  actualizado_en TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- TABLA: inventario_movimientos
-- ============================================================
CREATE TABLE IF NOT EXISTS inventario_movimientos (
  id SERIAL PRIMARY KEY,
  producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
  tipo VARCHAR(20) NOT NULL,                           -- 'entrada','salida','ajuste'
  cantidad INTEGER NOT NULL,
  stock_antes INTEGER NOT NULL,
  stock_despues INTEGER NOT NULL,
  motivo TEXT,
  usuario_id UUID REFERENCES usuarios(id),
  creado_en TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- TABLA: carritos
-- ============================================================
CREATE TABLE IF NOT EXISTS carritos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  activo BOOLEAN DEFAULT TRUE,
  creado_en TIMESTAMP DEFAULT NOW(),
  actualizado_en TIMESTAMP DEFAULT NOW(),
  UNIQUE(usuario_id, activo)
);

-- ============================================================
-- TABLA: carrito_items
-- ============================================================
CREATE TABLE IF NOT EXISTS carrito_items (
  id SERIAL PRIMARY KEY,
  carrito_id UUID REFERENCES carritos(id) ON DELETE CASCADE,
  producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
  cantidad INTEGER NOT NULL DEFAULT 1 CHECK (cantidad > 0),
  precio_unitario NUMERIC(12,2) NOT NULL,              -- precio al momento de agregar
  creado_en TIMESTAMP DEFAULT NOW(),
  actualizado_en TIMESTAMP DEFAULT NOW(),
  UNIQUE(carrito_id, producto_id)
);

-- ============================================================
-- TABLA: direcciones
-- ============================================================
CREATE TABLE IF NOT EXISTS direcciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  nombre_completo VARCHAR(200),
  telefono VARCHAR(20),
  departamento VARCHAR(100),
  ciudad VARCHAR(100),
  direccion TEXT NOT NULL,
  codigo_postal VARCHAR(20),
  es_principal BOOLEAN DEFAULT FALSE,
  creado_en TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- TABLA: pedidos
-- ============================================================
CREATE TABLE IF NOT EXISTS pedidos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero_pedido VARCHAR(20) UNIQUE NOT NULL,           -- YRB-2026-000001
  usuario_id UUID REFERENCES usuarios(id),
  direccion_id UUID REFERENCES direcciones(id),
  subtotal NUMERIC(12,2) NOT NULL,
  descuento NUMERIC(12,2) DEFAULT 0,
  impuestos NUMERIC(12,2) DEFAULT 0,
  costo_envio NUMERIC(12,2) DEFAULT 0,
  total NUMERIC(12,2) NOT NULL,
  estado VARCHAR(30) DEFAULT 'pendiente',              -- pendiente,pagado,preparando,enviado,entregado,cancelado
  metodo_pago VARCHAR(30) DEFAULT 'stripe',
  stripe_payment_intent_id VARCHAR(255),
  stripe_charge_id VARCHAR(255),
  notas_cliente TEXT,
  notas_admin TEXT,
  creado_en TIMESTAMP DEFAULT NOW(),
  actualizado_en TIMESTAMP DEFAULT NOW()
);

-- Secuencia para número de pedido
CREATE SEQUENCE IF NOT EXISTS pedido_seq START 1;

-- Función para generar número de pedido
CREATE OR REPLACE FUNCTION generar_numero_pedido()
RETURNS TRIGGER AS $$
BEGIN
  NEW.numero_pedido = 'YRB-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('pedido_seq')::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_numero_pedido
  BEFORE INSERT ON pedidos
  FOR EACH ROW
  WHEN (NEW.numero_pedido IS NULL OR NEW.numero_pedido = '')
  EXECUTE FUNCTION generar_numero_pedido();

-- ============================================================
-- TABLA: pedido_items
-- ============================================================
CREATE TABLE IF NOT EXISTS pedido_items (
  id SERIAL PRIMARY KEY,
  pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id UUID REFERENCES productos(id),
  nombre_producto VARCHAR(255) NOT NULL,               -- snapshot al momento de compra
  imagen_producto TEXT,
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  precio_unitario NUMERIC(12,2) NOT NULL,
  subtotal NUMERIC(12,2) NOT NULL,
  creado_en TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- TABLA: reseñas
-- ============================================================
CREATE TABLE IF NOT EXISTS resenas (
  id SERIAL PRIMARY KEY,
  producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES usuarios(id),
  calificacion INTEGER CHECK (calificacion BETWEEN 1 AND 5),
  titulo VARCHAR(200),
  contenido TEXT,
  aprobada BOOLEAN DEFAULT FALSE,
  creado_en TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- TABLA: cupones
-- ============================================================
CREATE TABLE IF NOT EXISTS cupones (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(50) UNIQUE NOT NULL,
  tipo VARCHAR(20) NOT NULL,                           -- 'porcentaje','fijo'
  valor NUMERIC(10,2) NOT NULL,
  minimo_compra NUMERIC(12,2) DEFAULT 0,
  usos_maximos INTEGER,
  usos_actuales INTEGER DEFAULT 0,
  activo BOOLEAN DEFAULT TRUE,
  expira_en TIMESTAMP,
  creado_en TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- TABLA: notificaciones_email
-- ============================================================
CREATE TABLE IF NOT EXISTS notificaciones_email (
  id SERIAL PRIMARY KEY,
  usuario_id UUID REFERENCES usuarios(id),
  tipo VARCHAR(50),                                    -- 'bienvenida','confirmacion_pedido','otp', etc.
  destinatario VARCHAR(255),
  asunto VARCHAR(255),
  enviado BOOLEAN DEFAULT FALSE,
  error TEXT,
  enviado_en TIMESTAMP,
  creado_en TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- TABLA: configuracion_tienda
-- ============================================================
CREATE TABLE IF NOT EXISTS configuracion_tienda (
  clave VARCHAR(100) PRIMARY KEY,
  valor TEXT,
  descripcion VARCHAR(255),
  actualizado_en TIMESTAMP DEFAULT NOW()
);

INSERT INTO configuracion_tienda (clave, valor, descripcion) VALUES
  ('nombre_tienda', 'Yerbateras', 'Nombre de la tienda'),
  ('whatsapp', '+573001234567', 'Número de WhatsApp'),
  ('email_contacto', 'info@yerbateras.co', 'Email de contacto'),
  ('instagram', 'https://instagram.com/yerbateras', 'Instagram'),
  ('facebook', 'https://facebook.com/yerbateras', 'Facebook'),
  ('tiktok', 'https://tiktok.com/@yerbateras', 'TikTok'),
  ('envio_gratis_desde', '150000', 'Monto mínimo para envío gratis en COP'),
  ('costo_envio_base', '10000', 'Costo base de envío en COP'),
  ('anos_mercado', '8', 'Años en el mercado'),
  ('certificacion_invima', 'NSA-12345-678', 'Número certificación INVIMA')
ON CONFLICT (clave) DO NOTHING;

-- ============================================================
-- ÍNDICES para rendimiento
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_telefono ON usuarios(telefono);
CREATE INDEX IF NOT EXISTS idx_usuarios_google_id ON usuarios(google_id);
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_productos_activo ON productos(activo);
CREATE INDEX IF NOT EXISTS idx_pedidos_usuario ON pedidos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos(estado);
CREATE INDEX IF NOT EXISTS idx_carrito_items_carrito ON carrito_items(carrito_id);

-- ============================================================
-- FUNCIÓN: updated_at automático
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_usuarios_updated BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_productos_updated BEFORE UPDATE ON productos
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_pedidos_updated BEFORE UPDATE ON pedidos
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_carritos_updated BEFORE UPDATE ON carritos
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
