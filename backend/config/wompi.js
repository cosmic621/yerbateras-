const crypto = require('crypto');

// Genera una referencia única de pago. Wompi exige que cada referencia
// se use una sola vez (evita transacciones duplicadas por error).
// Se usa un prefijo distinto para pedidos ("YRB-") y citas ("CITA-") para
// que el webhook (que es un solo endpoint para todo) sepa a cuál de las
// dos tablas debe actualizar cuando llega la confirmacion del pago.
const generarReferencia = () =>
  `YRB-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

const generarReferenciaCita = () =>
  `CITA-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

// Firma de integridad exigida por Wompi para el Widget/Web Checkout.
// Formula oficial (el orden importa): SHA256(referencia + monto_en_centavos + moneda + llave_de_integridad)
// https://docs.wompi.co/en/docs/colombia/widget-checkout-web/
const firmarIntegridad = (reference, amountInCents, currency = 'COP') => {
  const cadena = `${reference}${amountInCents}${currency}${process.env.WOMPI_INTEGRITY_KEY}`;
  return crypto.createHash('sha256').update(cadena).digest('hex');
};

// Obtiene un valor anidado de un objeto a partir de un path tipo "transaction.id"
const obtenerValorAnidado = (obj, path) =>
  path.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), obj);

// Verifica la firma que Wompi envía en cada evento de webhook.
// Wompi indica en el propio payload (event.signature.properties) qué
// campos concatenar, así que lo hacemos dinámico en vez de asumir campos fijos.
const verificarFirmaEvento = (event) => {
  const { signature, timestamp } = event;
  if (!signature?.properties?.length || !signature?.checksum || !timestamp) return false;

  const cadena = signature.properties
    .map(prop => obtenerValorAnidado(event, prop))
    .join('') + timestamp + process.env.WOMPI_EVENTS_KEY;

  const checksumCalculado = crypto.createHash('sha256').update(cadena).digest('hex');
  return checksumCalculado.toUpperCase() === signature.checksum.toUpperCase();
};

module.exports = { generarReferencia, generarReferenciaCita, firmarIntegridad, verificarFirmaEvento };
