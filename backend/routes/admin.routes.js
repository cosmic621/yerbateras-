const express = require('express');
const { verificarToken, soloAdmin } = require('../middlewares/auth.middleware');
const c = require('../controllers/admin.controller');
const citasC = require('../controllers/citas.controller');
const cuponesC = require('../controllers/cupones.controller');
const resenasC = require('../controllers/resenas.controller');
const newsletterC = require('../controllers/newsletter.controller');
const cotizacionesC = require('../controllers/cotizaciones.controller');
const botiquinC = require('../controllers/botiquin.controller');
const sitioC = require('../controllers/sitio.controller');
const eventosC = require('../controllers/eventos.controller');
const talleresC = require('../controllers/talleres.controller');
const { upload } = require('../config/upload');
const bannersC = require('../controllers/banners.controller');

const router = express.Router();
router.use(verificarToken, soloAdmin);
router.get('/dashboard', c.getDashboard);
router.get('/inventario', c.getInventario);
router.post('/inventario/ajuste', c.ajustarStock);
router.get('/pedidos', c.getPedidos);
router.patch('/pedidos/:id/estado', c.cambiarEstadoPedido);
router.get('/usuarios', c.getUsuarios);
router.patch('/usuarios/:id/toggle', c.toggleUsuario);
router.get('/configuracion', c.getConfiguracion);
router.put('/configuracion', c.actualizarConfiguracion);
router.get('/citas', citasC.listarAgendaAdmin);
router.patch('/citas/:id/estado', citasC.actualizarEstadoCita);
router.get('/citas/horario', citasC.obtenerHorarioAtencion);
router.put('/citas/horario', citasC.actualizarHorarioAtencion);
router.get('/citas/servicios', citasC.listarServiciosAdmin);
router.post('/citas/servicios', citasC.crearServicioMasaje);
router.put('/citas/servicios/:id', citasC.actualizarServicioMasaje);
router.delete('/citas/servicios/:id', citasC.eliminarServicioMasaje);
router.get('/categorias', c.getCategorias);
router.post('/categorias', c.crearCategoria);
router.put('/categorias/:id', c.actualizarCategoria);
router.delete('/categorias/:id', c.eliminarCategoria);
router.get('/cupones', cuponesC.listarCupones);
router.post('/cupones', cuponesC.crearCupon);
router.put('/cupones/:id', cuponesC.actualizarCupon);
router.delete('/cupones/:id', cuponesC.eliminarCupon);
router.get('/resenas', resenasC.listarResenasAdmin);
router.patch('/resenas/:id/aprobar', resenasC.aprobarResena);
router.delete('/resenas/:id', resenasC.eliminarResena);
router.get('/newsletter', newsletterC.listarSuscriptores);
router.get('/cotizaciones', cotizacionesC.listarCotizacionesAdmin);
router.patch('/cotizaciones/:id/estado', cotizacionesC.actualizarEstadoCotizacion);
router.get('/lineas-cuidado', c.getLineasCuidado);
router.post('/lineas-cuidado', c.crearLineaCuidado);
router.put('/lineas-cuidado/:id', c.actualizarLineaCuidado);
router.delete('/lineas-cuidado/:id', c.eliminarLineaCuidado);
router.get('/botiquin/preguntas', botiquinC.listarPreguntasAdmin);
router.post('/botiquin/preguntas', botiquinC.crearPregunta);
router.put('/botiquin/preguntas/:id', botiquinC.actualizarPregunta);
router.delete('/botiquin/preguntas/:id', botiquinC.eliminarPregunta);
router.post('/botiquin/respuestas', botiquinC.crearRespuesta);
router.put('/botiquin/respuestas/:id', botiquinC.actualizarRespuesta);
router.delete('/botiquin/respuestas/:id', botiquinC.eliminarRespuesta);
router.put('/botiquin/respuestas/:id/productos', botiquinC.asociarProductos);

// Productos y kits (incluye desactivados) + activar/desactivar
router.get('/productos', c.getProductosAdmin);
router.patch('/productos/:id/toggle', c.toggleProducto);
router.patch('/productos/:id/destacado', c.toggleDestacado);
router.patch('/productos/:id/promocion', c.fijarPromocion);

// Carrusel de la pagina principal (imagen = campo "imagen")
router.get('/banners', bannersC.listarBannersAdmin);
router.post('/banners', upload.single('imagen'), bannersC.crearBanner);
router.put('/banners/:id', upload.single('imagen'), bannersC.actualizarBanner);
router.delete('/banners/:id', bannersC.eliminarBanner);

// Secciones y temporadas
router.get('/secciones', sitioC.listarSeccionesAdmin);
router.post('/secciones', sitioC.crearTemporada);
router.patch('/secciones/:clave', sitioC.actualizarSeccion);
router.delete('/secciones/:clave', sitioC.eliminarTemporada);

// Eventos (flyer = campo "flyer")
router.get('/eventos', eventosC.listarEventosAdmin);
router.post('/eventos', upload.single('flyer'), eventosC.crearEvento);
router.put('/eventos/:id', upload.single('flyer'), eventosC.actualizarEvento);
router.delete('/eventos/:id', eventosC.eliminarEvento);

// Talleres e inscripciones
router.get('/talleres', talleresC.listarTalleresAdmin);
router.post('/talleres', upload.single('flyer'), talleresC.crearTaller);
router.put('/talleres/:id', upload.single('flyer'), talleresC.actualizarTaller);
router.delete('/talleres/:id', talleresC.eliminarTaller);
router.get('/talleres/:id/inscripciones', talleresC.listarInscripciones);
router.post('/talleres/inscripciones/:id/pago-manual', talleresC.registrarPagoManual);
router.patch('/talleres/inscripciones/:id/cancelar', talleresC.cancelarInscripcion);

module.exports = router;
