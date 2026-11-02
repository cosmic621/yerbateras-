# Cambios de esta versión

## Para ponerlo en marcha
1. Base de datos: `psql -d yerbateras -f backend/sql/mejoras-v4.sql` (se puede correr más de una vez).
2. `npm install` en `backend/` y `frontend/`, igual que antes. No hay variables de entorno nuevas
   (si ya usas `EMAIL_NEGOCIO`, también recibe el aviso de cada inscripción a taller).
3. Administración: entra a **`/admin`** (no hay enlace en el sitio). Sin sesión de administrador se muestra
   el login de admin en esa misma dirección.

## Qué hay de nuevo
- **Diseño**: paleta verde `#0f3c27` + crema + dorado apagado; menú desplegable por categorías / guía de cuidado /
  kits / temporadas; nuevo inicio (`/`) con categorías, más vendidos, kits, servicios, talleres y eventos.
- **Secciones y temporadas** (Admin → "Secciones y temporadas"): prende/apaga masajes, talleres, eventos, kits,
  "Arma tu kit" y temporadas (Navidad viene creada; puedes crear más). Al apagar una temporada se ocultan sus productos.
- **Kits** = productos marcados como kit (Admin → Productos y kits). Cada artículo tiene botón de activar/desactivar y
  campo "Temporada".
- **Eventos**: calendario mensual; al pasar el cursor por un día se ve el flyer (en celular, al tocar).
- **Talleres**: inscripción con pago mínimo del 50% (configurable por taller, nunca menos de 50%), cupos con reserva de
  30 minutos, saldo registrable desde el admin.
- **Arma tu kit**: ahora es una ventana emergente dentro de la tienda (`/botiquin` redirige).
- **Masajes**: política de 24 horas (solo reprogramación, sin devolución), aceptada antes de pagar y exigida en el servidor.
- Se quitó INVIMA del sitio y de los correos, y el pago contraentrega.
- **Cotización para empresas**: se mantiene y ahora incluye talleres.

## Tipografía y contenido (segunda ronda)
- **Fuente de toda la web: Patrick Hand** (instalada localmente con `@fontsource/patrick-hand`, sin Google Fonts).
  Es la más cercana al flyer "Inicia tu ritual con esta frase" (se comparó con Delius, Mali, Gochi Hand y otras).
  Solo existe en un peso, por eso se desactivó el "negrita falso" (`font-synthesis: none`) y la jerarquía se hace con
  tamaño, color y espaciado. Para cambiar de fuente: `src/index.css` (variable `--font-marca`) y `tailwind.config.js`.
- **Contenido oficial** (PDF "CONTENIDO SECCIONES") colocado en `Nosotros`, `Masajes` (`/citas`) y `Talleres`,
  con piezas compartidas en `src/components/ui/Seccion.jsx`.

## Tercera ronda: sin cuentas, carrusel, destacados y diseño limpio
**Base de datos:** correr también `backend/sql/mejoras-v5.sql` (después de v4; se puede repetir).

- **Sin login para clientes.** Se quitaron login, registro, verificación de correo, OTP/SMS y Google. El correo es solo un dato
  del pago (y la confirmación llega ahí). El único login que existe es el de administración en `/admin`.
  - Carrito en el navegador; el servidor valida precios y stock (`POST /api/carrito/validar`) y **nunca confía en el precio que manda el navegador**.
  - Checkout como invitada: nombre, correo, celular y dirección. Casilla opcional para recibir novedades por correo.
  - **Seguir mi pedido** (`/pedido`): número de pedido + correo.
  - **Citas**: el correo de confirmación trae un enlace privado (`/cita/<código>`) para ver y reprogramar (regla de 24 h).
  - Admin: "Usuarios" ahora es **Clientes** (quienes han comprado) y en Pedidos se ve el celular y la dirección de envío.
- **Carrusel de portada** (Admin → Carrusel): imágenes con título, texto y botón opcionales; avance automático, flechas, puntos y deslizar en celular.
- **Destacados de la semana y promociones** (Admin → Destacados y promos): estrella para destacar y % de descuento para promocionar.
  La portada muestra "Destacados de la semana" y "En promoción". El descuento ahora **sí se cobra** (antes se mostraba pero se cobraba el precio completo).
- **Diseño más limpio**: menú con logo centrado, enlaces a los lados y banda beige con el título de cada página; tienda con una sola fila de
  filtros y cuadrícula simple; portada, pie de página y carrito con mucho menos contenido. Se quitó el botón flotante de cotización
  (sigue en Servicios, pie de página y Contacto). Se conservan las hojas que caen al navegar y el efecto de gota.
- **Contacto** (`/contacto`) con WhatsApp, correo e Instagram.

**Pendiente / a tener en cuenta**
- Ya no se pueden escribir reseñas nuevas (antes exigían cuenta); las existentes se siguen mostrando.
- Pagos: el webhook ahora valida el monto, descuenta stock en una transacción y no se repite si Wompi reenvía el evento.

## Correcciones hechas de paso
- Webhook de Wompi: la firma se buscaba en el lugar equivocado del evento (debe leerse desde `data`).
- `actualizarProducto`: lista blanca de columnas (antes el SQL se armaba con las llaves del body).
- Subida de imágenes: solo JPG/PNG/WEBP/GIF (se bloquea SVG).
- Citas: hora de Colombia, y se valida que el horario sea futuro y esté dentro del horario de atención.
- Correos: se escapa el texto del usuario (evita inyección de HTML).
- Login de admin con límite de intentos.
