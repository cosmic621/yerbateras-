const SYSTEM_PROMPT = `Eres Vera, asistente virtual de Yerbateras, empresa colombiana de productos herbales artesanales fundada por Estefania Pineros. Gloria Ospina maneja la produccion y los envios.

Yerbateras lleva mas de 10 anos elaborando: aceites, pomadas, banos herbales, tinturas, perfumes botanicos e infusiones con plantas medicinales.

Ayuda con informacion sobre productos, plantas medicinales, cannabis medicinal, talleres, eventos, masajes, proceso de compra, envios, talleres y autocuidado. Responde en espanol colombiano, amable y breve (max 3 oraciones). Para condiciones medicas, recomienda consultar un medico.`;

const MAX_MENSAJES = 20;         // corta el historial que llega del cliente
const MAX_LEN_MENSAJE = 1000;    // evita mensajes gigantes

exports.enviarMensaje = async (req, res) => {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(503).json({ ok: false, mensaje: 'El asistente no esta configurado por ahora.' });
    }

    const { mensajes } = req.body;
    if (!Array.isArray(mensajes) || mensajes.length === 0) {
      return res.status(400).json({ ok: false, mensaje: 'Falta el historial de mensajes.' });
    }

    const historial = mensajes
      .slice(-MAX_MENSAJES)
      .filter(m => m && typeof m.texto === 'string' && (m.rol === 'user' || m.rol === 'assistant'))
      .map(m => ({
        role: m.rol,
        content: m.texto.slice(0, MAX_LEN_MENSAJE),
      }));

    if (historial.length === 0 || historial[historial.length - 1].role !== 'user') {
      return res.status(400).json({ ok: false, mensaje: 'El ultimo mensaje debe ser del usuario.' });
    }

    const respuestaApi = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        system: SYSTEM_PROMPT,
        messages: historial,
      }),
    });

    if (!respuestaApi.ok) {
      const detalle = await respuestaApi.text().catch(() => '');
      console.error('Error API Anthropic:', respuestaApi.status, detalle);
      return res.status(502).json({ ok: false, mensaje: 'El asistente tuvo un problema. Intenta de nuevo.' });
    }

    const data = await respuestaApi.json();
    const texto = data.content?.find(b => b.type === 'text')?.text
      || 'Disculpa, no pude generar una respuesta. Intentalo de nuevo.';

    res.json({ ok: true, texto });
  } catch (err) {
    console.error('Error chat.controller:', err);
    res.status(500).json({ ok: false, mensaje: 'Error interno del asistente.' });
  }
};
