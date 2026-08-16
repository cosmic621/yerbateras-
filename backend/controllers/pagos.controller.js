const pool = require('../config/db');
const { enviarConfirmacionPedido } = require('../config/email');
const { generarReferencia, firmarIntegridad, verificarFirmaEvento } = require('../config/wompi');
const { validarCuponInterno } = require('./cupones.controller');
const { confirmarPagoCita, cancelarPagoCita } = require('./citas.controller');

// ─── CREAR pedido + datos para abrir el widget de Wompi ────
const crearPedido = async (req, res) => {
  const { direccion_id, notas_cliente, codigo_cupon } = req.body;
  const usuario_id = req.usuario.id;

  try {
    const carrito = await pool.query(
      `SELECT c.id FROM carritos c WHERE c.usuario_id = $1 AND c.activo = TRUE`,
      [usuario_id]
    );
    if (!carrito.rows[0]) return res.status(400).json({ ok: false, mensaje: 'Carrito vacío' });

    const items = await pool.query(
      `SELECT ci.cantidad, ci.precio_unitario, p.id AS producto_id, p.nombre, p.stock, p.imagen_principal
       FROM carrito_items ci JOIN productos p ON ci.producto_id = p.id
       WHERE ci.carrito_id = $1`,
      [carrito.rows[0].id]
    );
    if (!items.rows.length) return res.status(400).json({ ok: false, mensaje: 'Carrito vacío' });

    for (const item of items.rows) {
      if (item.stock < item.cantidad) {
        return res.status(400).json({ ok: false, mensaje: `Sin stock suficiente para: ${item.nombre}` });
      }
    }

    const subtotal = items.rows.reduce((s, i) => s + (i.cantidad * parseFloat(i.precio_unitario)), 0);
    const costo_envio = subtotal >= 150000 ? 0 : 10000;

    // Cupón opcional
    let descuento = 0;
    let cupon_id = null;
    if (codigo_cupon) {
      const resultado = await validarCuponInterno(codigo_cupon, subtotal);
      if (!resultado.valido) return res.status(400).json({ ok: false, mensaje: resultado.mensaje });
      descuento = resultado.descuento;
      cupon_id = resultado.cupon.id;
    }

    const total = Math.max(subtotal + costo_envio - descuento, 0);
    const amountInCents = Math.round(total * 100);
    const currency = 'COP';
    const reference = generarReferencia();
    const signature = firmarIntegridad(reference, amountInCents, currency);

    const pedido = await pool.query(
      `INSERT INTO pedidos (usuario_id, direccion_id, subtotal, descuento, costo_envio, total,
                            metodo_pago, wompi_reference, notas_cliente, numero_pedido, cupon_id)
       VALUES ($1,$2,$3,$4,$5,$6,'wompi',$7,$8,'',$9)
       RETURNING id, numero_pedido`,
      [usuario_id, direccion_id || null, subtotal, descuento, costo_envio, total, reference, notas_cliente || null, cupon_id]
    );

    for (const item of items.rows) {
      await pool.query(
        `INSERT INTO pedido_items (pedido_id, producto_id, nombre_producto, imagen_producto, cantidad, precio_unitario, subtotal)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [pedido.rows[0].id, item.producto_id, item.nombre, item.imagen_principal,
         item.cantidad, item.precio_unitario, item.cantidad * parseFloat(item.precio_unitario)]
      );
    }

    res.json({
      ok: true,
      pedido_id: pedido.rows[0].id,
      numero_pedido: pedido.rows[0].numero_pedido,
      reference,
      amountInCents,
      currency,
      publicKey: process.env.WOMPI_PUBLIC_KEY,
      signature,
      subtotal,
      descuento,
      costo_envio,
      total,
    });
  } catch (err) {
    console.error('Error creando pedido (Wompi):', err);
    res.status(500).json({ ok: false, mensaje: 'Error al procesar pago' });
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

    if (tx.status === 'APPROVED') {
      const { rows } = await pool.query(
        `UPDATE pedidos SET estado = 'pagado', wompi_transaction_id = $1, actualizado_en = NOW()
         WHERE wompi_reference = $2 AND estado != 'pagado'
         RETURNING id, numero_pedido, usuario_id, total, cupon_id`,
        [tx.id, tx.reference]
      );

      if (rows[0]) {
        const pedido = rows[0];
        const items = await pool.query('SELECT * FROM pedido_items WHERE pedido_id = $1', [pedido.id]);

        for (const item of items.rows) {
          await pool.query(
            'UPDATE productos SET stock = stock - $1, ventas_totales = ventas_totales + $1 WHERE id = $2',
            [item.cantidad, item.producto_id]
          );
        }

        if (pedido.cupon_id) {
          await pool.query('UPDATE cupones SET usos_actuales = usos_actuales + 1 WHERE id = $1', [pedido.cupon_id]);
        }

        const carritoQ = await pool.query(
          'SELECT id FROM carritos WHERE usuario_id = $1 AND activo = TRUE', [pedido.usuario_id]
        );
        if (carritoQ.rows[0]) {
          await pool.query('DELETE FROM carrito_items WHERE carrito_id = $1', [carritoQ.rows[0].id]);
        }

        const usuario = await pool.query('SELECT nombre, email FROM usuarios WHERE id = $1', [pedido.usuario_id]);
        if (usuario.rows[0]?.email) {
          enviarConfirmacionPedido(usuario.rows[0].email, usuario.rows[0].nombre, {
            numero_pedido: pedido.numero_pedido,
            total: pedido.total,
            items: items.rows,
          }).catch(console.error);
        }
      }
    } else if (['DECLINED', 'VOIDED', 'ERROR'].includes(tx.status)) {
      await pool.query(
        `UPDATE pedidos SET estado = 'cancelado', actualizado_en = NOW() WHERE wompi_reference = $1 AND estado != 'pagado'`,
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
      `SELECT numero_pedido, estado, total FROM pedidos WHERE wompi_reference = $1 AND usuario_id = $2`,
      [reference, req.usuario.id]
    );
    if (!rows[0]) return res.status(404).json({ ok: false, mensaje: 'Pedido no encontrado' });
    res.json({ ok: true, pedido: rows[0] });
  } catch (err) {
    console.error('Error consultando estado del pedido:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al consultar el pedido' });
  }
};

module.exports = { crearPedido, webhook, consultarEstado };
