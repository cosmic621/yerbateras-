#!/usr/bin/env node
// Crea (o actualiza) el usuario administrador para entrar a /admin.
//
//   cd backend
//   node scripts/crear-admin.js correo@ejemplo.com "Tu Nombre" "UnaContraseñaLarga"
//
// Si el correo ya existe, se le cambia la contraseña y se le da rol de administrador.
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

(async () => {
  const [email, nombre, password] = process.argv.slice(2);
  if (!email || !nombre || !password) {
    console.error('Uso: node scripts/crear-admin.js correo@ejemplo.com "Tu Nombre" "Contraseña"');
    process.exit(1);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { console.error('El correo no es válido.'); process.exit(1); }
  if (password.length < 10) { console.error('Usa una contraseña de al menos 10 caracteres (es la llave de todo el panel).'); process.exit(1); }

  try {
    const rol = await pool.query("SELECT id FROM roles WHERE nombre = 'admin'");
    if (!rol.rows[0]) { console.error("No existe el rol 'admin'. ¿Corriste sql/schema.sql?"); process.exit(1); }
    const hash = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(
      `INSERT INTO usuarios (nombre, email, password_hash, rol_id, verificado, activo, proveedor_auth)
       VALUES ($1, $2, $3, $4, TRUE, TRUE, 'email')
       ON CONFLICT (email) DO UPDATE SET password_hash = $3, rol_id = $4, verificado = TRUE, activo = TRUE
       RETURNING id, email`,
      [nombre.trim(), email.trim(), hash, rol.rows[0].id]
    );
    console.log(`✔ Administrador listo: ${rows[0].email}\n  Entra en /admin con ese correo y tu contraseña.`);
    process.exit(0);
  } catch (err) {
    console.error('No se pudo crear el administrador:', err.message);
    process.exit(1);
  }
})();
