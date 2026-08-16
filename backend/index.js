if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const authRoutes     = require('./routes/auth.routes');
const productosRoutes = require('./routes/productos.routes');
const carritoRoutes  = require('./routes/carrito.routes');
const pedidosRoutes  = require('./routes/pedidos.routes');
const pagosRoutes    = require('./routes/pagos.routes');
const adminRoutes    = require('./routes/admin.routes');
const tiendaRoutes   = require('./routes/tienda.routes');
const reportesRoutes = require('./routes/reportes.routes');
const citasRoutes    = require('./routes/citas.routes');
const newsletterRoutes = require('./routes/newsletter.routes');
const cotizacionesRoutes = require('./routes/cotizaciones.routes');
const botiquinRoutes = require('./routes/botiquin.routes');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth',      authRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/carrito',   carritoRoutes);
app.use('/api/pedidos',   pedidosRoutes);
app.use('/api/pagos',     pagosRoutes);
app.use('/api/admin',     adminRoutes);
app.use('/api/tienda',    tiendaRoutes);
app.use('/api/admin/reportes', reportesRoutes);
app.use('/api/citas',     citasRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/cotizaciones', cotizacionesRoutes);
app.use('/api/botiquin', botiquinRoutes);

app.get('/health', (req, res) =>
  res.json({ status:'ok', service:'Yerbateras API', ts: new Date() })
);

app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({ ok:false, mensaje: err.message || 'Error interno' });
});

app.listen(PORT, () =>
  console.log(`🌿 Yerbateras API corriendo en http://localhost:${PORT}`)
);

module.exports = app;
