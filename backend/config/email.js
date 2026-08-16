const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,   // App Password de Google
  },
});

const BASE_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// ─── Template base HTML ────────────────────────────────────
const htmlBase = (contenido) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Yerbateras</title>
  <style>
    body { margin:0; padding:0; background:#f5f5f0; font-family: Georgia, serif; }
    .wrapper { max-width:600px; margin:0 auto; background:#fff; }
    .header { background: linear-gradient(135deg, #1a4a2e 0%, #2d6a44 100%); padding:40px 30px; text-align:center; }
    .header h1 { color:#c9a227; margin:0; font-size:32px; letter-spacing:3px; text-transform:uppercase; }
    .header p { color:#9acd9a; margin:8px 0 0; font-size:13px; letter-spacing:1px; }
    .body { padding:40px 30px; }
    .body h2 { color:#1a4a2e; font-size:22px; margin-top:0; }
    .body p { color:#444; line-height:1.7; font-size:15px; }
    .btn { display:inline-block; background:#c9a227; color:#fff; padding:14px 32px; border-radius:4px; text-decoration:none; font-size:15px; font-weight:bold; margin:20px 0; letter-spacing:1px; }
    .footer { background:#1a4a2e; padding:20px 30px; text-align:center; }
    .footer p { color:#9acd9a; font-size:12px; margin:0; }
    .divider { border:none; border-top:2px solid #e8e0cc; margin:30px 0; }
    .badge { display:inline-block; background:#f0f7f0; border:1px solid #2d6a44; color:#1a4a2e; padding:6px 14px; border-radius:20px; font-size:12px; margin-bottom:20px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>🌿 Yerbateras</h1>
      <p>Medicina Natural con Certificación INVIMA</p>
    </div>
    <div class="body">${contenido}</div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Yerbateras · Medicina natural certificada</p>
      <p style="margin-top:8px">
        <a href="${BASE_URL}" style="color:#c9a227;text-decoration:none;">Visitar tienda</a> &nbsp;·&nbsp;
        <a href="mailto:info@yerbateras.co" style="color:#c9a227;text-decoration:none;">Contacto</a>
      </p>
    </div>
  </div>
</body>
</html>`;

// ─── Email: verificación de registro ──────────────────────
const enviarEmailVerificacion = async (email, nombre, token) => {
  const url = `${BASE_URL}/verificar-email?token=${token}`;
  const html = htmlBase(`
    <span class="badge">🏥 Certificado INVIMA</span>
    <h2>¡Bienvenido/a a Yerbateras, ${nombre}!</h2>
    <p>Gracias por registrarte en nuestra tienda de medicina natural. Para activar tu cuenta y comenzar a explorar nuestros productos certificados, confirma tu correo electrónico:</p>
    <a href="${url}" class="btn">✅ Verificar mi cuenta</a>
    <hr class="divider">
    <p style="font-size:13px;color:#888">Este enlace expira en <strong>24 horas</strong>. Si no creaste esta cuenta, ignora este mensaje.</p>
  `);

  await transporter.sendMail({
    from: `"🌿 Yerbateras" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '✅ Confirma tu cuenta en Yerbateras',
    html
  });
};

// ─── Email: confirmación de pedido ────────────────────────
const enviarConfirmacionPedido = async (email, nombre, pedido) => {
  const itemsHtml = pedido.items.map(i => `
    <tr>
      <td style="padding:10px;border-bottom:1px solid #eee">${i.nombre_producto}</td>
      <td style="padding:10px;border-bottom:1px solid #eee;text-align:center">${i.cantidad}</td>
      <td style="padding:10px;border-bottom:1px solid #eee;text-align:right">$${Number(i.precio_unitario).toLocaleString('es-CO')}</td>
    </tr>`).join('');

  const html = htmlBase(`
    <h2>¡Pedido confirmado! 🎉</h2>
    <p>Hola <strong>${nombre}</strong>, recibimos tu pedido y ya está siendo procesado.</p>
    <p><strong>Número de pedido:</strong> <span style="color:#1a4a2e;font-size:18px">${pedido.numero_pedido}</span></p>
    <hr class="divider">
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
      <thead>
        <tr style="background:#f0f7f0">
          <th style="padding:10px;text-align:left;color:#1a4a2e">Producto</th>
          <th style="padding:10px;text-align:center;color:#1a4a2e">Cant.</th>
          <th style="padding:10px;text-align:right;color:#1a4a2e">Precio</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
      <tfoot>
        <tr>
          <td colspan="2" style="padding:12px;text-align:right;font-weight:bold">Total:</td>
          <td style="padding:12px;text-align:right;font-weight:bold;color:#1a4a2e;font-size:18px">
            $${Number(pedido.total).toLocaleString('es-CO')} COP
          </td>
        </tr>
      </tfoot>
    </table>
    <hr class="divider">
    <a href="${BASE_URL}/mis-pedidos" class="btn">Ver mis pedidos</a>
    <p style="font-size:13px;color:#888">Recibirás una notificación cuando tu pedido sea enviado.</p>
  `);

  await transporter.sendMail({
    from: `"🌿 Yerbateras" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `📦 Pedido ${pedido.numero_pedido} confirmado — Yerbateras`,
    html
  });
};

// ─── Email: OTP para login con teléfono ───────────────────
const enviarOtpEmail = async (email, nombre, otp) => {
  const html = htmlBase(`
    <h2>Tu código de verificación</h2>
    <p>Hola ${nombre}, usa este código para iniciar sesión:</p>
    <div style="text-align:center;margin:30px 0">
      <span style="font-size:42px;font-weight:bold;letter-spacing:8px;color:#1a4a2e;background:#f0f7f0;padding:16px 30px;border-radius:8px">${otp}</span>
    </div>
    <p style="text-align:center;color:#888;font-size:13px">Expira en <strong>10 minutos</strong>. No compartas este código.</p>
  `);

  await transporter.sendMail({
    from: `"🌿 Yerbateras" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `🔐 Tu código de acceso: ${otp}`,
    html
  });
};

// ─── Email: verificación de cita de masaje ────────────────
const enviarVerificacionCita = async (email, nombre, token, cita) => {
  const url = `${BASE_URL}/citas/verificar?token=${token}`;
  const fecha = new Date(`${cita.fecha}T00:00:00`).toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
  const html = htmlBase(`
    <span class="badge">💆 Solicitud de cita</span>
    <h2>Hola ${nombre}, confirma tu cita</h2>
    <p>Recibimos tu solicitud para <strong>${cita.servicio_nombre}</strong>. Para asegurar tu horario, confírmala dentro de las próximas <strong>2 horas</strong>:</p>
    <div style="background:#f0f7f0;border-radius:8px;padding:16px 20px;margin:20px 0">
      <p style="margin:4px 0"><strong>📅 Fecha:</strong> ${fecha}</p>
      <p style="margin:4px 0"><strong>🕐 Hora:</strong> ${cita.hora_inicio.slice(0,5)} - ${cita.hora_fin.slice(0,5)}</p>
    </div>
    <a href="${url}" class="btn">✅ Confirmar mi cita</a>
    <hr class="divider">
    <p style="font-size:13px;color:#888">Si no confirmas a tiempo, el horario quedará libre para otra persona. Si no solicitaste esta cita, ignora este mensaje.</p>
  `);

  await transporter.sendMail({
    from: `"🌿 Yerbateras" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '💆 Confirma tu cita de masaje — Yerbateras',
    html
  });
};

// ─── Email: cita confirmada (al CLIENTE) ──────────────────
// Gratis y funciona siempre, sin depender de aprobaciones de WhatsApp Business.
const enviarCitaConfirmadaCliente = async (email, nombre, cita) => {
  const fecha = new Date(`${cita.fecha}T00:00:00`).toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
  const html = htmlBase(`
    <span class="badge">✅ Cita confirmada</span>
    <h2>¡Listo, ${nombre}! Tu cita quedó confirmada</h2>
    <div style="background:#f0f7f0;border-radius:8px;padding:16px 20px;margin:20px 0">
      <p style="margin:4px 0"><strong>💆 Servicio:</strong> ${cita.servicio_nombre}</p>
      <p style="margin:4px 0"><strong>📅 Fecha:</strong> ${fecha}</p>
      <p style="margin:4px 0"><strong>🕐 Hora:</strong> ${cita.hora_inicio.slice(0,5)} - ${cita.hora_fin.slice(0,5)}</p>
    </div>
    <p>Te esperamos. Si necesitas cambiar tu horario, escríbenos.</p>
    <hr class="divider">
    <p style="font-size:13px;color:#888">Gracias por confiar en Yerbateras.</p>
  `);

  await transporter.sendMail({
    from: `"🌿 Yerbateras" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '✅ ¡Tu cita está confirmada! — Yerbateras',
    html
  });
};

// ─── Email: alerta de NUEVA cita (al NEGOCIO) ─────────────
// Reemplaza la notificacion automatica de WhatsApp (que tiene costo y
// requiere aprobacion de Meta) por un correo instantaneo y gratuito,
// con un boton que abre WhatsApp directo con el cliente en un clic.
const enviarAlertaCitaNegocio = async (emailNegocio, cita) => {
  if (!emailNegocio) return;
  const fecha = new Date(`${cita.fecha}T00:00:00`).toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
  const telefonoLimpio = (cita.telefono_cliente || '').replace(/[^0-9]/g, '');
  const mensajeWa = encodeURIComponent(`Hola ${cita.nombre_cliente}, te escribimos de Yerbateras por tu cita de ${cita.servicio_nombre} el ${fecha} a las ${cita.hora_inicio.slice(0,5)}.`);
  const waUrl = `https://wa.me/${telefonoLimpio}?text=${mensajeWa}`;

  const html = htmlBase(`
    <span class="badge">🔔 Nueva cita agendada</span>
    <h2>Tienes una nueva cita confirmada</h2>
    <div style="background:#f0f7f0;border-radius:8px;padding:16px 20px;margin:20px 0">
      <p style="margin:4px 0"><strong>💆 Servicio:</strong> ${cita.servicio_nombre}</p>
      <p style="margin:4px 0"><strong>📅 Fecha:</strong> ${fecha}</p>
      <p style="margin:4px 0"><strong>🕐 Hora:</strong> ${cita.hora_inicio.slice(0,5)} - ${cita.hora_fin.slice(0,5)}</p>
      <p style="margin:4px 0"><strong>👤 Cliente:</strong> ${cita.nombre_cliente}</p>
      <p style="margin:4px 0"><strong>📞 Teléfono:</strong> ${cita.telefono_cliente}</p>
      <p style="margin:4px 0"><strong>✉️ Email:</strong> ${cita.email_cliente}</p>
      ${cita.notas ? `<p style="margin:4px 0"><strong>📝 Notas:</strong> ${cita.notas}</p>` : ''}
    </div>
    <a href="${waUrl}" class="btn" style="background:#25D366">💬 Escribirle por WhatsApp</a>
    <hr class="divider">
    <p style="font-size:13px;color:#888">También puedes ver y gestionar todas las citas del día en tu <a href="${BASE_URL}/agenda" style="color:#c9a227">agenda</a>.</p>
  `);

  await transporter.sendMail({
    from: `"🌿 Yerbateras" <${process.env.EMAIL_USER}>`,
    to: emailNegocio,
    subject: `🔔 Nueva cita: ${cita.nombre_cliente} — ${fecha}`,
    html
  });
};

// ─── Email: solicitud de cotización (al NEGOCIO) ──────────
const enviarSolicitudCotizacion = async (emailNegocio, cotizacion) => {
  if (!emailNegocio) return;
  const html = htmlBase(`
    <span class="badge">🏢 Nueva solicitud de cotización</span>
    <h2>${cotizacion.organizacion} quiere una cotización</h2>
    <div style="background:#f0f7f0;border-radius:8px;padding:16px 20px;margin:20px 0">
      <p style="margin:4px 0"><strong>🏢 Organización:</strong> ${cotizacion.organizacion}</p>
      <p style="margin:4px 0"><strong>👤 Contacto:</strong> ${cotizacion.nombre_contacto}</p>
      <p style="margin:4px 0"><strong>✉️ Email:</strong> ${cotizacion.email}</p>
      <p style="margin:4px 0"><strong>📞 Teléfono:</strong> ${cotizacion.telefono}</p>
      ${cotizacion.interes ? `<p style="margin:4px 0"><strong>📦 Interés:</strong> ${cotizacion.interes}</p>` : ''}
      ${cotizacion.cantidad_estimada ? `<p style="margin:4px 0"><strong>🔢 Cantidad estimada:</strong> ${cotizacion.cantidad_estimada}</p>` : ''}
      ${cotizacion.mensaje ? `<p style="margin:4px 0"><strong>📝 Mensaje:</strong> ${cotizacion.mensaje}</p>` : ''}
    </div>
    <a href="mailto:${cotizacion.email}" class="btn">✉️ Responder por correo</a>
  `);

  await transporter.sendMail({
    from: `"🌿 Yerbateras" <${process.env.EMAIL_USER}>`,
    to: emailNegocio,
    subject: `🏢 Cotización: ${cotizacion.organizacion}`,
    html
  });
};

// ─── Email: pago de cita recibido (al CLIENTE) ────────────
const enviarPagoCitaConfirmado = async (email, nombre, cita) => {
  const fecha = new Date(`${cita.fecha}T00:00:00`).toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
  const html = htmlBase(`
    <span class="badge">✅ Pago confirmado</span>
    <h2>¡Listo, ${nombre}! Tu cita está pagada y confirmada</h2>
    <div style="background:#f0f7f0;border-radius:8px;padding:16px 20px;margin:20px 0">
      <p style="margin:4px 0"><strong>💆 Servicio:</strong> ${cita.servicio_nombre}</p>
      <p style="margin:4px 0"><strong>📅 Fecha:</strong> ${fecha}</p>
      <p style="margin:4px 0"><strong>🕐 Hora:</strong> ${cita.hora_inicio.slice(0,5)} - ${cita.hora_fin.slice(0,5)}</p>
      <p style="margin:4px 0"><strong>💳 Monto pagado:</strong> $${Number(cita.monto_pagado).toLocaleString('es-CO')} COP</p>
    </div>
    <p>Te esperamos. Si necesitas cambiar tu horario, puedes reprogramarla desde tu cuenta o escribiéndonos.</p>
    <hr class="divider">
    <p style="font-size:13px;color:#888">Gracias por confiar en Yerbateras.</p>
  `);

  await transporter.sendMail({
    from: `"🌿 Yerbateras" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '✅ Pago recibido — tu cita está confirmada — Yerbateras',
    html
  });
};

module.exports = {
  enviarEmailVerificacion, enviarConfirmacionPedido, enviarOtpEmail, enviarVerificacionCita,
  enviarCitaConfirmadaCliente, enviarAlertaCitaNegocio, enviarSolicitudCotizacion, enviarPagoCitaConfirmado,
};
