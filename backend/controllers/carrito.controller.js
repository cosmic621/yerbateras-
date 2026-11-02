const pool = require('../config/db');

// Producto vendible: activo y no perteneciente a una temporada apagada.
const VENDIBLE = `p.activo = TRUE AND (p.temporada IS NULL OR NOT EXISTS (
  SELECT 1 FROM secciones_sitio ss WHERE ss.clave = p.temporada AND ss.activa = FALSE))`;
exports.VENDIBLE = VENDIBLE;

// Normaliza la lista que manda el navegador: [{producto_id, cantidad}] sin repetidos
const normalizarItems = (items) => {
  if (!Array.isArray(items) || items.length === 0 || items.length > 50) return null;
  const mapa = new Map();
  for (const it of items) {
    const cantidad = Number(it?.cantidad);
    if (!it?.producto_id || !Number.isInteger(cantidad) || cantidad < 1 || cantidad > 99) return null;
    mapa.set(it.producto_id, (mapa.get(it.producto_id) || 0) + cantidad);
  }
  return [...mapa].map(([producto_id, cantidad]) => ({ producto_id, cantidad }));
};
exports.normalizarItems = normalizarItems;

// Lee precios/stock ACTUALES desde la base de datos (nunca se confia en el precio del navegador).
exports.cargarLineas = async (client, items) => {
  const ids = items.map(i => i.producto_id);
  const { rows } = await client.query(
    `SELECT p.id, p.nombre, p.stock, p.imagen_principal,
            COALESCE(p.precio_descuento, p.precio) AS precio_final, p.precio, p.precio_descuento
     FROM productos p WHERE p.id = ANY($1::uuid[]) AND ${VENDIBLE}`,
    [ids]
  );
  const porId = new Map(rows.map(r => [r.id, r]));
  return items.map(it => {
    const p = porId.get(it.producto_id);
    if (!p) return { producto_id: it.producto_id, disponible: false, cantidad: it.cantidad };
    return {
      producto_id: p.id, nombre: p.nombre, imagen: p.imagen_principal, stock: p.stock,
      precio: Number(p.precio_final), precio_original: Number(p.precio),
      cantidad: it.cantidad, disponible: p.stock > 0,
      subtotal: Number(p.precio_final) * Math.min(it.cantidad, p.stock),
    };
  });
};

// POST /api/carrito/validar  { items: [{producto_id, cantidad}] }
exports.validarCarrito = async (req, res) => {
  const items = normalizarItems(req.body.items);
  if (!items) return res.status(400).json({ ok: false, mensaje: 'Carrito inválido' });
  try {
    const lineas = await exports.cargarLineas(pool, items);
    res.json({ ok: true, lineas });
  } catch (err) {
    console.error('Error validarCarrito:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al validar el carrito' });
  }
};
