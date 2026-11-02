// Limitador de intentos en memoria (suficiente para una sola instancia).
// Se usa en el login de admin para frenar fuerza bruta.
const intentos = new Map();

const limitarIntentos = ({ max = 5, ventanaMs = 15 * 60 * 1000 } = {}) => (req, res, next) => {
  const clave = `${req.ip}|${String(req.body?.email || req.query?.email || '').toLowerCase()}`;
  const ahora = Date.now();
  const reg = intentos.get(clave);
  if (reg && ahora < reg.hasta && reg.n >= max) {
    return res.status(429).json({ ok: false, mensaje: 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.' });
  }
  // el controlador llama a res.locals.falloLogin() cuando las credenciales son malas
  res.locals.falloLogin = () => {
    const r = intentos.get(clave);
    if (!r || ahora >= r.hasta) intentos.set(clave, { n: 1, hasta: ahora + ventanaMs });
    else r.n += 1;
  };
  res.locals.exitoLogin = () => intentos.delete(clave);
  next();
};

module.exports = { limitarIntentos };
