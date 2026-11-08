// Las imágenes se guardan como "/uploads/archivo.jpg" y las sirve el BACKEND.
// El navegador las pediría al servidor del frontend (otro puerto/dominio) y no las encontraría,
// así que se les antepone la dirección del backend.
export const origenApi = (baseURL) => {
  try { return /^https?:\/\//.test(baseURL) ? new URL(baseURL).origin : ''; } catch { return ''; }
};

// Recorre la respuesta del API y completa toda ruta que empiece por /uploads/
export const completarUploads = (valor, origen) => {
  if (!origen) return valor;
  if (typeof valor === 'string') return valor.startsWith('/uploads/') ? origen + valor : valor;
  if (Array.isArray(valor)) return valor.map(v => completarUploads(v, origen));
  if (valor && typeof valor === 'object') {
    const out = {};
    for (const k of Object.keys(valor)) out[k] = completarUploads(valor[k], origen);
    return out;
  }
  return valor;
};
