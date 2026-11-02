const multer = require('multer');
const path = require('path');

// Solo se aceptan estas extensiones, y la extension final del archivo se
// decide aqui (no se confia en el nombre que manda el cliente). SVG queda
// fuera a proposito: puede llevar scripts.
const EXT_PERMITIDAS = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' };

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => {
    const ext = EXT_PERMITIDAS[file.mimetype] || '.bin';
    cb(null, `${file.fieldname}_${Date.now()}_${Math.round(Math.random() * 1e6)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!EXT_PERMITIDAS[file.mimetype]) return cb(new Error('Solo imágenes JPG, PNG, WEBP o GIF'));
    cb(null, true);
  },
});

module.exports = { upload };
