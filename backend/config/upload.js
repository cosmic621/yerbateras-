const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Carpeta de subidas: se crea sola si no existe (multer no lo hace cuando el destino es una función).
const DIR = path.join(__dirname, '../uploads');
fs.mkdirSync(DIR, { recursive: true });

// Solo se aceptan estas extensiones, y la extension final del archivo se
// decide aqui (no se confia en el nombre que manda el cliente). SVG queda
// fuera a proposito: puede llevar scripts.
const EXT_PERMITIDAS = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' };
const MAX_MB = 10;

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, DIR),
  filename: (req, file, cb) => {
    const ext = EXT_PERMITIDAS[file.mimetype] || '.bin';
    cb(null, `${file.fieldname}_${Date.now()}_${Math.round(Math.random() * 1e6)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_MB * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (EXT_PERMITIDAS[file.mimetype]) return cb(null, true);
    const heic = /heic|heif/i.test(file.mimetype) || /\.(heic|heif)$/i.test(file.originalname);
    const err = new Error(heic
      ? 'Las fotos HEIC del iPhone no son compatibles. Conviértela a JPG o PNG (o envíatela por WhatsApp, que la convierte) e inténtalo de nuevo.'
      : 'Formato de imagen no permitido. Usa JPG, PNG, WEBP o GIF.');
    err.status = 400;
    cb(err);
  },
});

module.exports = { upload, MAX_MB };
