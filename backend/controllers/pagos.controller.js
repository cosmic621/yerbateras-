const pool = require('../config/db');
const { enviarConfirmacionPedido } = require('../config/email');
const { generarReferencia, firmarIntegridad, verificarFirmaEvento } = require('../config/wompi');
const { validarCuponInterno } = require('./cupones.controller');
const { normalizarItems, cargarLineas } = require('./carrito.controller');
const { confirmarPagoCita, cancelarPagoCita } = require('./citas.controller');
const { confirmarPagoTaller, cancelarPagoTaller } = require('./talleres.controller');

// ─── CREAR pedido (sin cuenta) + datos para abrir el widget de Wompi ────
// Body: { items:[{producto_id,cantidad}], cliente:{nombre,email,telefono},
//         envio:{direccion,ciudad,departamento}, notas_cliente, codigo_cupon, suscribir_newsletter }
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const crearPedido = async (req, res) => {
  const { cliente = {}, envio = {}, notas_cliente, codigo_cupon, suscribir_newsletter } = req.body;
  const items = normalizarItems(req.body.items);

  if (!items) return res.status(400).json({ ok: false, mensaje: 'Tu carrito está vacío' });
  const nombre = String(cliente.nombre || '').trim();
  const email = String(cliente.email || '').trim().toLowerCase();
  const telefono = String(cliente.telefono || '').replace(/\s/g, '');
  if (nombre.length < 2) return res.status(400).json({ ok: false, mensaje: 'Escribe tu nombre completo' });
  if (!EMAIL_RE.test(email)) return res.status(400).json({ ok: false, mensaje: 'Escribe un correo válido' });
  if (!/^\+?[0-9]{7,15}$/.test(telefono)) return res.status(400).json({ ok: false, mensaje: 'Escribe un celular válido' });
  const direccion = String(envio.direccion || '').trim();
  const ciudad = String(envio.ciudad || '').trim();
  const departamento = String(envio.departamento || '').trim();
  if (direccion.length < 5 || !ciudad || !departamento) {
    return res.status(400).json({ ok: false, mensaje: 'Completa la dirección de envío' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const lineas = await cargarLineas(client, items);

    for (const l of lineas) {
      if (l.nombre === undefined) { await client.query('ROLLBACK'); return res.status(400).json({ ok: false, mensaje: 'Un producto de tu carrito ya no está disponible. Actualiza el carrito.' }); }
      if (l.stock < l.cantidad) { await client.query('ROLLBACK'); return res.status(400).json({ ok: false, mensaje: `Sin stock suficiente para: ${l.nombre}` }); }
    }

    const subtotal = lineas.reduce((s, l) => s + l.cantidad * l.precio, 0);
    const costo_envio = subtotal >= 150000 ? 0 : 10000;

    let descuento = 0; let cupon_id = null;
    if (codigo_cupon) {
      const r = await validarCuponInterno(codigo_cupon, subtotal);
      if (!r.valido) { await client.query('ROLLBACK'); return res.status(400).json({ ok: false, mensaje: r.mensaje }); }
      descuento = r.descuento; cupon_id = r.cupon.id;
    }

    const total = Math.max(subtotal + costo_envio - descuento, 0);
    const amountInCents = Math.round(total * 100);
    const currency = 'COP';
    const reference = generarReferencia();
    const signature = firmarIntegridad(reference, amountInCents, currency);

    const pedido = await client.query(
      `INSERT INTO pedidos (subtotal, descuento, costo_envio, total, metodo_pago, wompi_reference, notas_cliente, numero_pedido, cupon_id,
                            nombre_cliente, email_cliente, telefono_cliente, direccion_envio, ciudad_envio, departamento_envio)
       VALUES ($1,$2,$3,$4,'wompi',$5,$6,'',$7,$8,$9,$10,$11,$12,$13)
       RETURNING id, numero_pedido`,
      [subtotal, descuento, costo_envio, total, reference, notas_cliente || null, cupon_id, nombre, email, telefono, direccion, ciudad, departamento]
    );
    for (const l of lineas) {
      await client.query(
        `INSERT INTO pedido_items (pedido_id, producto_id, nombre_producto, imagen_producto, cantidad, precio_unitario, subtotal)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [pedido.rows[0].id, l.producto_id, l.nombre, l.imagen, l.cantidad, l.precio, l.cantidad * l.precio]
      );
    }
    await client.query('COMMIT');

    // El correo es solo un dato del pago. La suscripción es opcional y la decide la clienta.
    if (suscribir_newsletter === true) {
      pool.query(
        `INSERT INTO suscriptores_newsletter (email, origen) VALUES ($1,'checkout')
         ON CONFLICT (email) DO UPDATE SET activo = TRUE`, [email]
      ).catch(e => console.error('Newsletter (checkout):', e));
    }

    res.json({
      ok: true, pedido_id: pedido.rows[0].id, numero_pedido: pedido.rows[0].numero_pedido,
      reference, amountInCents, currency, publicKey: process.env.WOMPI_PUBLIC_KEY, signature,
      subtotal, descuento, costo_envio, total,
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Error creando pedido (Wompi):', err);
    res.status(500).json({ ok: false, mensaje: 'Error al procesar el pedido' });
  } finally {
    client.release();
  }
};

// Marca el pedido como pagado, descuenta stock y usa el cupon, todo en UNA transaccion.
// Es idempotente: si Wompi reenvia el evento no se descuenta dos veces.
const confirmarPagoPedido = async (tx) => {
  const client = await pool.connect();
  let aviso = null;
  try {
    await client.query('BEGIN');
    const pr = await client.query('SELECT * FROM pedidos WHERE wompi_reference = $1 FOR UPDATE', [tx.reference]);
    const pedido = pr.rows[0];
    if (!pedido || pedido.estado === 'pagado') { await client.query('ROLLBACK'); return; }

    // El monto cobrado debe ser exactamente el total del pedido
    if (Number(tx.amount_in_cents) !== Math.round(Number(pedido.total) * 100)) {
      console.error(`Pedido ${pedido.numero_pedido}: monto no coincide (esperado ${pedido.total}, recibido ${tx.amount_in_cents / 100})`);
      await client.query('ROLLBACK');
      return;
    }

    const items = (await client.query('SELECT * FROM pedido_items WHERE pedido_id = $1', [pedido.id])).rows;
    for (const it of items) {
      await client.query(
        'UPDATE productos SET stock = GREATEST(stock - $1, 0), ventas_totales = ventas_totales + $1 WHERE id = $2',
        [it.cantidad, it.producto_id]
      );
    }
    // Si dos personas pagaron el ultimo producto a la vez, el pedido queda con una nota para el admin
    const sinStock = await client.query(
      `SELECT pi.nombre_producto FROM pedido_items pi JOIN productos p ON p.id = pi.producto_id
       WHERE pi.pedido_id = $1 AND p.stock = 0`, [pedido.id]);
    const faltante = sinStock.rows.length > 0;

    if (pedido.cupon_id) await client.query('UPDATE cupones SET usos_actuales = usos_actuales + 1 WHERE id = $1', [pedido.cupon_id]);

    await client.query(
      `UPDATE pedidos SET estado = 'pagado', wompi_transaction_id = $1, actualizado_en = NOW(),
              notas_admin = CASE WHEN $3 THEN COALESCE(notas_admin || E'\n', '') || 'Revisar: algún producto quedó en 0 al confirmar el pago.' ELSE notas_admin END
       WHERE id = $2`,
      [tx.id, pedido.id, faltante]
    );
    await client.query('COMMIT');
    aviso = { pedido, items };
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err; // el webhook responde 500 y Wompi reintenta
  } finally {
    client.release();
  }

  if (aviso?.pedido.email_cliente) {
    enviarConfirmacionPedido(aviso.pedido.email_cliente, aviso.pedido.nombre_cliente, {
      numero_pedido: aviso.pedido.numero_pedido, total: aviso.pedido.total, items: aviso.items,
    }).catch(console.error);
  }
};

// ─── WEBHOOK de Wompi (fuente de verdad del estado del pago) ─
const webhook = async (req, res) => {
  try {
    const event = req.body;

    if (!verificarFirmaEvento(event)) {
      console.error('Firma de webhook Wompi inválida — evento ignorado');
      return res.status(400).json({ ok: false, mensaje: 'Firma inválida' });
    }

    const tx = event.data?.transaction;
    if (!tx) return res.json({ ok: true });

    // Un solo webhook de Wompi recibe eventos tanto de pedidos de tienda
    // como de pagos de citas — se distinguen por el prefijo de la referencia.
    if (tx.reference?.startsWith('CITA-')) {
      if (tx.status === 'APPROVED') {
        await confirmarPagoCita(tx.reference, tx);
      } else if (['DECLINED', 'VOIDED', 'ERROR'].includes(tx.status)) {
        await cancelarPagoCita(tx.reference);
      }
      return res.json({ ok: true });
    }

    if (tx.reference?.startsWith('TALL-')) {
      if (tx.status === 'APPROVED') {
        await confirmarPagoTaller(tx.reference, tx);
      } else if (['DECLINED', 'VOIDED', 'ERROR'].includes(tx.status)) {
        await cancelarPagoTaller(tx.reference);
      }
      return res.json({ ok: true });
    }

    if (tx.status === 'APPROVED') {
      await confirmarPagoPedido(tx);
    } else if (['DECLINED', 'VOIDED', 'ERROR'].includes(tx.status)) {
      await pool.query(
        `UPDATE pedidos SET estado = 'cancelado', actualizado_en = NOW() WHERE wompi_reference = $1 AND estado = 'pendiente'`,
        [tx.reference]
      ).catch(console.error);
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('Error procesando webhook Wompi:', err);
    res.status(500).json({ ok: false });
  }
};

// ─── Consultar el estado actual de un pedido por su referencia ─
const consultarEstado = async (req, res) => {
  const { reference } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT numero_pedido, estado, total FROM pedidos WHERE wompi_reference = $1`,
      [reference]
    );
    if (!rows[0]) return res.status(404).json({ ok: false, mensaje: 'Pedido no encontrado' });
    res.json({ ok: true, pedido: rows[0] });
  } catch (err) {
    console.error('Error consultando estado del pedido:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al consultar el pedido' });
  }
};

module.exports = { crearPedido, webhook, consultarEstado };
