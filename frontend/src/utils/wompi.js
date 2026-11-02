// Carga el widget de Wompi una sola vez y abre el checkout.
const WOMPI_WIDGET_SRC = 'https://checkout.wompi.co/widget.js';

export const cargarWompiScript = () => new Promise((resolve, reject) => {
  if (window.WidgetCheckout) return resolve();
  const existente = document.querySelector(`script[src="${WOMPI_WIDGET_SRC}"]`);
  if (existente) { existente.addEventListener('load', () => resolve()); return; }
  const script = document.createElement('script');
  script.src = WOMPI_WIDGET_SRC;
  script.onload = () => resolve();
  script.onerror = () => reject(new Error('No se pudo cargar el widget de pagos'));
  document.head.appendChild(script);
});

// pagoData = respuesta del backend {currency, amountInCents, reference, publicKey, signature}
export const abrirCheckoutWompi = (pagoData, cliente, onResultado) => {
  const checkout = new window.WidgetCheckout({
    currency: pagoData.currency,
    amountInCents: pagoData.amountInCents,
    reference: pagoData.reference,
    publicKey: pagoData.publicKey,
    signature: { integrity: pagoData.signature },
    customerData: { email: cliente.email, fullName: cliente.nombre, phoneNumber: cliente.telefono, phoneNumberPrefix: '+57' },
  });
  checkout.open((result) => onResultado(result?.transaction));
};

export const cop = (n) => `$${Number(n).toLocaleString('es-CO')}`;
