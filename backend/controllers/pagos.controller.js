const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const pool = require('../config/db');
const { enviarConfirmacionPedido } = require('../config/email');

// ─── CREAR Payment Intent ──────────────────────────────────
const crearPaymentIntent = async (req, res) => {
  const { direccion_id, notas_cliente } = req.body;
  const usuario_id = req.usuario.id;

  try {
    // Obtener carrito
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

    // Validar stock
    for (const item of items.rows) {
      if (item.stock < item.cantidad) {
        return res.status(400).json({ ok: false, mensaje: `Sin stock suficiente para: ${item.nombre}` });
      }
    }

    const subtotal = items.rows.reduce((s, i) => s + (i.cantidad * parseFloat(i.precio_unitario)), 0);
    const costo_envio = subtotal >= 150000 ? 0 : 10000;
    const total = subtotal + costo_envio;

    // Crear PaymentIntent en Stripe (en centavos)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100),
      currency: 'cop',
      metadata: { usuario_id, carrito_id: carrito.rows[0].id }
    });

    // Crear pedido en BD (estado: pendiente)
    const pedido = await pool.query(
      `INSERT INTO pedidos (usuario_id, direccion_id, subtotal, costo_envio, total,
                            stripe_payment_intent_id, notas_cliente, numero_pedido)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'')
       RETURNING id, numero_pedido`,
      [usuario_id, direccion_id || null, subtotal, costo_envio, total, paymentIntent.id, notas_cliente || null]
    );

    // Insertar items del pedido
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
      client_secret: paymentIntent.client_secret,
      pedido_id: pedido.rows[0].id,
      numero_pedido: pedido.rows[0].numero_pedido,
      total
    });
  } catch (err) {
    console.error('Error PaymentIntent:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al procesar pago' });
  }
};

// ─── WEBHOOK de Stripe (confirmar pago) ───────────────────
const webhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object;
    try {
      // Actualizar pedido
      const { rows } = await pool.query(
        `UPDATE pedidos SET estado = 'pagado', stripe_charge_id = $1, actualizado_en = NOW()
         WHERE stripe_payment_intent_id = $2
         RETURNING id, numero_pedido, usuario_id, total`,
        [intent.latest_charge, intent.id]
      );

      if (rows[0]) {
        const pedido = rows[0];

        // Descontar stock y limpiar carrito
        const items = await pool.query(
          'SELECT * FROM pedido_items WHERE pedido_id = $1', [pedido.id]
        );
        for (const item of items.rows) {
          await pool.query(
            'UPDATE productos SET stock = stock - $1, ventas_totales = ventas_totales + $1 WHERE id = $2',
            [item.cantidad, item.producto_id]
          );
        }

        // Limpiar carrito
        const carritoQ = await pool.query(
          'SELECT id FROM carritos WHERE usuario_id = $1 AND activo = TRUE', [pedido.usuario_id]
        );
        if (carritoQ.rows[0]) {
          await pool.query('DELETE FROM carrito_items WHERE carrito_id = $1', [carritoQ.rows[0].id]);
        }

        // Email de confirmación
        const usuario = await pool.query('SELECT nombre, email FROM usuarios WHERE id = $1', [pedido.usuario_id]);
        if (usuario.rows[0]?.email) {
          const itemsEmail = await pool.query('SELECT * FROM pedido_items WHERE pedido_id = $1', [pedido.id]);
          enviarConfirmacionPedido(usuario.rows[0].email, usuario.rows[0].nombre, {
            numero_pedido: pedido.numero_pedido,
            total: pedido.total,
            items: itemsEmail.rows
          }).catch(console.error);
        }
      }
    } catch (err) {
      console.error('Error procesando webhook:', err);
    }
  }

  if (event.type === 'payment_intent.payment_failed') {
    const intent = event.data.object;
    await pool.query(
      `UPDATE pedidos SET estado = 'cancelado' WHERE stripe_payment_intent_id = $1`,
      [intent.id]
    ).catch(console.error);
  }

  res.json({ received: true });
};

// ─── CONFIRMAR pago manualmente (fallback) ─────────────────
const confirmarPago = async (req, res) => {
  const { payment_intent_id } = req.body;
  try {
    const intent = await stripe.paymentIntents.retrieve(payment_intent_id);
    if (intent.status !== 'succeeded') {
      return res.status(400).json({ ok: false, mensaje: 'Pago no completado' });
    }
    const { rows } = await pool.query(
      `SELECT * FROM pedidos WHERE stripe_payment_intent_id = $1`, [payment_intent_id]
    );
    res.json({ ok: true, pedido: rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: 'Error al confirmar pago' });
  }
};

module.exports = { crearPaymentIntent, webhook, confirmarPago };
