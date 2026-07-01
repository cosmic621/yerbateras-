const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// ─── Verificar token JWT ───────────────────────────────────
const verificarToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ ok: false, mensaje: 'Token requerido' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verificar que el usuario siga activo en BD
    const { rows } = await pool.query(
      `SELECT u.id, u.nombre, u.email, u.telefono, u.verificado, u.activo,
              r.nombre AS rol
       FROM usuarios u
       JOIN roles r ON u.rol_id = r.id
       WHERE u.id = $1`,
      [decoded.id]
    );

    if (!rows[0] || !rows[0].activo) {
      return res.status(401).json({ ok: false, mensaje: 'Usuario no autorizado' });
    }

    req.usuario = rows[0];
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ ok: false, mensaje: 'Token expirado, inicia sesión de nuevo' });
    }
    return res.status(401).json({ ok: false, mensaje: 'Token inválido' });
  }
};

// ─── Requerir rol admin ───────────────────────────────────
const soloAdmin = (req, res, next) => {
  if (req.usuario?.rol !== 'admin') {
    return res.status(403).json({ ok: false, mensaje: 'Acceso restringido a administradores' });
  }
  next();
};

// ─── Verificar email confirmado ────────────────────────────
const requiereVerificado = (req, res, next) => {
  if (!req.usuario?.verificado) {
    return res.status(403).json({ ok: false, mensaje: 'Debes verificar tu correo electrónico primero' });
  }
  next();
};

// ─── Validación de inputs (helper) ─────────────────────────
const validarInputs = (campos) => (req, res, next) => {
  const errores = [];
  campos.forEach(({ campo, tipo, requerido, min, max, regex }) => {
    const val = req.body[campo];
    if (requerido && (val === undefined || val === null || val === '')) {
      errores.push(`El campo "${campo}" es requerido`);
      return;
    }
    if (val !== undefined && val !== '') {
      if (tipo === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
        errores.push(`El campo "${campo}" debe ser un email válido`);
      }
      if (tipo === 'phone' && !/^\+?[0-9]{7,15}$/.test(val)) {
        errores.push(`El campo "${campo}" debe ser un número de teléfono válido`);
      }
      if (tipo === 'number' && isNaN(Number(val))) {
        errores.push(`El campo "${campo}" debe ser un número`);
      }
      if (min && String(val).length < min) {
        errores.push(`"${campo}" debe tener al menos ${min} caracteres`);
      }
      if (max && String(val).length > max) {
        errores.push(`"${campo}" no puede tener más de ${max} caracteres`);
      }
      if (regex && !regex.test(val)) {
        errores.push(`El formato del campo "${campo}" no es válido`);
      }
    }
  });
  if (errores.length) {
    return res.status(400).json({ ok: false, mensaje: 'Errores de validación', errores });
  }
  next();
};

module.exports = { verificarToken, soloAdmin, requiereVerificado, validarInputs };
