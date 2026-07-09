const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const pool = require('../config/db');
const { enviarEmailVerificacion, enviarOtpEmail } = require('../config/email');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generarToken = (usuario) =>
  jwt.sign(
    { id: usuario.id, email: usuario.email, rol: usuario.rol },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

const generarOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// ─── REGISTRO con email ────────────────────────────────────
const registrar = async (req, res) => {
  const { nombre, apellido, email, telefono, password } = req.body;
  try {
    // Verificar duplicados
    const existe = await pool.query(
      'SELECT id FROM usuarios WHERE email = $1 OR telefono = $2',
      [email, telefono || null]
    );
    if (existe.rows[0]) {
      return res.status(409).json({ ok: false, mensaje: 'El email o teléfono ya está registrado' });
    }

    const hash = await bcrypt.hash(password, 12);
    const tokenVerif = crypto.randomBytes(32).toString('hex');
    const expira = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    const { rows } = await pool.query(
      `INSERT INTO usuarios (nombre, apellido, email, telefono, password_hash, proveedor_auth,
                             token_verificacion, token_expira)
       VALUES ($1,$2,$3,$4,$5,'email',$6,$7)
       RETURNING id, nombre, email, rol_id`,
      [nombre, apellido || null, email, telefono || null, hash, tokenVerif, expira]
    );

    // Enviar email de verificación (no bloqueante)
    enviarEmailVerificacion(email, nombre, tokenVerif).catch(console.error);

    res.status(201).json({
      ok: true,
      mensaje: 'Registro exitoso. Revisa tu correo para verificar tu cuenta.',
      usuario: { id: rows[0].id, nombre: rows[0].nombre, email: rows[0].email }
    });
  } catch (err) {
    console.error('Error registro:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al registrar usuario' });
  }
};

// ─── VERIFICAR EMAIL ───────────────────────────────────────
const verificarEmail = async (req, res) => {
  const { token } = req.query;
  try {
    const { rows } = await pool.query(
      `SELECT id FROM usuarios
       WHERE token_verificacion = $1 AND token_expira > NOW() AND verificado = FALSE`,
      [token]
    );
    if (!rows[0]) {
      return res.status(400).json({ ok: false, mensaje: 'Token inválido o expirado' });
    }
    await pool.query(
      `UPDATE usuarios SET verificado = TRUE, token_verificacion = NULL, token_expira = NULL
       WHERE id = $1`,
      [rows[0].id]
    );
    res.json({ ok: true, mensaje: '¡Cuenta verificada! Ya puedes iniciar sesión.' });
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: 'Error al verificar cuenta' });
  }
};

// ─── LOGIN con email ───────────────────────────────────────
const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const { rows } = await pool.query(
      `SELECT u.*, r.nombre AS rol FROM usuarios u
       JOIN roles r ON u.rol_id = r.id
       WHERE u.email = $1 AND u.activo = TRUE`,
      [email]
    );
    const usuario = rows[0];
    if (!usuario || !usuario.password_hash) {
      return res.status(401).json({ ok: false, mensaje: 'Credenciales inválidas' });
    }

    const valido = await bcrypt.compare(password, usuario.password_hash);
    if (!valido) {
      return res.status(401).json({ ok: false, mensaje: 'Credenciales inválidas' });
    }

    if (!usuario.verificado) {
      return res.status(403).json({ ok: false, mensaje: 'Debes verificar tu correo electrónico', requiere_verificacion: true });
    }

    await pool.query('UPDATE usuarios SET ultimo_login = NOW() WHERE id = $1', [usuario.id]);

    const token = generarToken(usuario);
    res.json({
      ok: true,
      token,
      usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol, avatar_url: usuario.avatar_url }
    });
  } catch (err) {
    console.error('ERROR LOGIN:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al iniciar sesión' });
  }
};

// ─── LOGIN / REGISTRO con Google ───────────────────────────
const loginGoogle = async (req, res) => {
  const { credential } = req.body;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const { sub: googleId, email, name, picture } = ticket.getPayload();

    // Buscar o crear usuario
    let { rows } = await pool.query(
      `SELECT u.*, r.nombre AS rol FROM usuarios u
       JOIN roles r ON u.rol_id = r.id
       WHERE u.google_id = $1 OR u.email = $2`,
      [googleId, email]
    );

    let usuario = rows[0];
    if (!usuario) {
      const ins = await pool.query(
        `INSERT INTO usuarios (nombre, email, google_id, avatar_url, proveedor_auth, verificado)
         VALUES ($1,$2,$3,$4,'google',TRUE)
         RETURNING id, nombre, email, rol_id`,
        [name, email, googleId, picture]
      );
      // Obtener con rol
      const full = await pool.query(
        `SELECT u.*, r.nombre AS rol FROM usuarios u JOIN roles r ON u.rol_id = r.id WHERE u.id = $1`,
        [ins.rows[0].id]
      );
      usuario = full.rows[0];
    } else if (!usuario.google_id) {
      // Vincular Google a cuenta existente
      await pool.query(
        'UPDATE usuarios SET google_id=$1, avatar_url=$2, verificado=TRUE WHERE id=$3',
        [googleId, picture, usuario.id]
      );
    }

    await pool.query('UPDATE usuarios SET ultimo_login=NOW() WHERE id=$1', [usuario.id]);

    const token = generarToken(usuario);
    res.json({
      ok: true, token,
      usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol, avatar_url: usuario.avatar_url }
    });
  } catch (err) {
    console.error('Error Google login:', err);
    res.status(400).json({ ok: false, mensaje: 'Error al autenticar con Google' });
  }
};

// ─── ENVIAR OTP al teléfono ────────────────────────────────
const enviarOtp = async (req, res) => {
  const { telefono } = req.body;
  if (!telefono) return res.status(400).json({ ok: false, mensaje: 'Teléfono requerido' });

  try {
    const otp = generarOtp();
    const expira = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    // Buscar o crear usuario por teléfono
    let { rows } = await pool.query('SELECT id FROM usuarios WHERE telefono = $1', [telefono]);
    if (!rows[0]) {
      await pool.query(
        `INSERT INTO usuarios (nombre, telefono, proveedor_auth, verificado, otp_code, otp_expira)
         VALUES ('Usuario', $1, 'phone', FALSE, $2, $3)`,
        [telefono, otp, expira]
      );
    } else {
      await pool.query(
        'UPDATE usuarios SET otp_code=$1, otp_expira=$2 WHERE telefono=$3',
        [otp, expira, telefono]
      );
    }

    // Enviar SMS vía Twilio
    if (process.env.TWILIO_ACCOUNT_SID) {
      const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      await twilio.messages.create({
        body: `🌿 Tu código de Yerbateras: ${otp}. Expira en 10 min.`,
        from: process.env.TWILIO_PHONE,
        to: telefono
      });
    }

    res.json({ ok: true, mensaje: 'Código enviado al teléfono' });
  } catch (err) {
    console.error('Error OTP:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al enviar código' });
  }
};

// ─── VERIFICAR OTP ─────────────────────────────────────────
const verificarOtp = async (req, res) => {
  const { telefono, otp } = req.body;
  try {
    const { rows } = await pool.query(
      `SELECT u.*, r.nombre AS rol FROM usuarios u
       JOIN roles r ON u.rol_id = r.id
       WHERE u.telefono = $1 AND u.otp_code = $2 AND u.otp_expira > NOW()`,
      [telefono, otp]
    );
    if (!rows[0]) {
      return res.status(400).json({ ok: false, mensaje: 'Código inválido o expirado' });
    }
    const usuario = rows[0];
    await pool.query(
      'UPDATE usuarios SET otp_code=NULL, otp_expira=NULL, verificado=TRUE, ultimo_login=NOW() WHERE id=$1',
      [usuario.id]
    );
    const token = generarToken(usuario);
    res.json({
      ok: true, token,
      usuario: { id: usuario.id, nombre: usuario.nombre, telefono: usuario.telefono, rol: usuario.rol }
    });
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: 'Error al verificar OTP' });
  }
};

// ─── PERFIL del usuario autenticado ───────────────────────
const obtenerPerfil = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.nombre, u.apellido, u.email, u.telefono, u.avatar_url,
              u.verificado, u.creado_en, r.nombre AS rol
       FROM usuarios u JOIN roles r ON u.rol_id = r.id WHERE u.id = $1`,
      [req.usuario.id]
    );
    res.json({ ok: true, usuario: rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: 'Error al obtener perfil' });
  }
};

module.exports = { registrar, verificarEmail, login, loginGoogle, enviarOtp, verificarOtp, obtenerPerfil };
