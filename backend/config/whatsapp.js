// Envía notificaciones de WhatsApp cuando se confirma una cita:
// una al WhatsApp del NEGOCIO y otra al WhatsApp del CLIENTE.
//
// Requiere en .env:
//   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN  (los mismos que ya usa el OTP por SMS)
//   TWILIO_WHATSAPP_FROM   -> número de WhatsApp habilitado en Twilio, formato: whatsapp:+14155238886
//   WHATSAPP_NEGOCIO       -> número del negocio que recibe las notificaciones, formato: whatsapp:+573001234567
//
// NOTA IMPORTANTE (Sandbox de Twilio):
// Mientras uses el Sandbox de Twilio (gratis, para pruebas), Twilio SOLO entrega
// mensajes a números que se hayan "unido" al sandbox escribiendo el código que
// Twilio te da (ej. "join palabra-clave") desde su WhatsApp al número del sandbox.
// Esto aplica tanto al negocio como a cada cliente:
//   - El negocio se une UNA vez y ya queda.
//   - Cada cliente tendría que unirse tambien, lo cual no es realista para produccion.
// Para produccion real (que le llegue a cualquier cliente sin que se una a nada)
// necesitas: un numero de WhatsApp Business aprobado por Meta + una plantilla
// (Content Template) aprobada. Guia: https://www.twilio.com/docs/whatsapp/tutorial/send-whatsapp-notification-messages-templates
//
// Por eso, mientras no tengas la plantilla aprobada, te recomendamos usar el
// mensaje al CLIENTE solo como algo informativo de prueba, y confiar en el
// EMAIL (que si le llega a cualquier persona) como la confirmacion oficial.

const formatearFecha = (fecha) => {
  const d = new Date(`${fecha}T00:00:00`);
  return d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

const normalizarWhatsApp = (numero) => {
  if (!numero) return null;
  const limpio = numero.replace(/[^0-9+]/g, '');
  const conMas = limpio.startsWith('+') ? limpio : `+${limpio}`;
  return `whatsapp:${conMas}`;
};

// Notifica al NEGOCIO (dueño / persona encargada de WhatsApp)
const notificarNegocio = async (cita) => {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_WHATSAPP_FROM || !process.env.WHATSAPP_NEGOCIO) {
    console.warn('WhatsApp negocio no configurado (faltan TWILIO_WHATSAPP_FROM / WHATSAPP_NEGOCIO). Se omite notificación.');
    return false;
  }

  const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

  const cuerpo =
    `🌿 *Nueva cita confirmada*\n\n` +
    `💆 Servicio: ${cita.servicio_nombre}\n` +
    `📅 Fecha: ${formatearFecha(cita.fecha)}\n` +
    `🕐 Hora: ${cita.hora_inicio.slice(0, 5)} - ${cita.hora_fin.slice(0, 5)}\n` +
    `👤 Cliente: ${cita.nombre_cliente}\n` +
    `📞 Teléfono: ${cita.telefono_cliente}\n` +
    `✉️ Email: ${cita.email_cliente}` +
    (cita.notas ? `\n📝 Notas: ${cita.notas}` : '');

  await twilio.messages.create({
    from: process.env.TWILIO_WHATSAPP_FROM,
    to: process.env.WHATSAPP_NEGOCIO,
    body: cuerpo,
  });

  return true;
};

// Notifica al CLIENTE que agendó la cita
const notificarCliente = async (cita) => {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_WHATSAPP_FROM) {
    console.warn('WhatsApp no configurado (falta TWILIO_WHATSAPP_FROM). Se omite notificación al cliente.');
    return false;
  }
  const destino = normalizarWhatsApp(cita.telefono_cliente);
  if (!destino) return false;

  const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

  const cuerpo =
    `🌿 *¡Tu cita en Yerbateras está confirmada!*\n\n` +
    `💆 Servicio: ${cita.servicio_nombre}\n` +
    `📅 Fecha: ${formatearFecha(cita.fecha)}\n` +
    `🕐 Hora: ${cita.hora_inicio.slice(0, 5)} - ${cita.hora_fin.slice(0, 5)}\n\n` +
    `Te esperamos. Si necesitas cambiar tu horario, respondenos por este mismo WhatsApp.`;

  await twilio.messages.create({
    from: process.env.TWILIO_WHATSAPP_FROM,
    to: destino,
    body: cuerpo,
  });

  return true;
};

// Envía ambas notificaciones sin que el fallo de una bloquee a la otra
const notificarNuevaCita = async (cita) => {
  const [negocio, cliente] = await Promise.allSettled([
    notificarNegocio(cita),
    notificarCliente(cita),
  ]);
  if (negocio.status === 'rejected') console.error('Error notificando al negocio:', negocio.reason);
  if (cliente.status === 'rejected') console.error('Error notificando al cliente:', cliente.reason);
  return (negocio.status === 'fulfilled' && negocio.value) || (cliente.status === 'fulfilled' && cliente.value);
};

module.exports = { notificarNuevaCita };
