const pool = require('../config/db');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

// ── Helpers de fechas ─────────────────────────────────────
const getRango = (periodo) => {
  const ahora = new Date();
  let desde;
  if (periodo === 'diario') {
    desde = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  } else if (periodo === 'mensual') {
    desde = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  } else {
    desde = new Date(ahora.getFullYear(), 0, 1);
  }
  return { desde, hasta: ahora };
};

const labelPeriodo = { diario: 'Hoy', mensual: 'Este mes', anual: 'Este año' };

// ── Obtener datos del reporte ──────────────────────────────
const getDatosReporte = async (periodo) => {
  const { desde, hasta } = getRango(periodo);

  const [ventas, pedidos, topProductos, resumen] = await Promise.all([
    // Ventas por dia
    pool.query(`
      SELECT DATE(creado_en) AS fecha,
             COUNT(*)::int   AS total_pedidos,
             SUM(total)      AS total_ventas
      FROM pedidos
      WHERE estado IN ('pagado','enviado','entregado')
        AND creado_en >= $1 AND creado_en <= $2
      GROUP BY DATE(creado_en) ORDER BY fecha
    `, [desde, hasta]),

    // Resumen de pedidos
    pool.query(`
      SELECT
        COUNT(*)::int                                               AS total,
        COUNT(*) FILTER(WHERE estado='pagado')::int                AS pagados,
        COUNT(*) FILTER(WHERE estado='preparando')::int            AS preparando,
        COUNT(*) FILTER(WHERE estado='enviado')::int               AS enviados,
        COUNT(*) FILTER(WHERE estado='entregado')::int             AS entregados,
        COUNT(*) FILTER(WHERE estado='cancelado')::int             AS cancelados,
        COALESCE(SUM(total) FILTER(WHERE estado IN ('pagado','enviado','entregado')), 0) AS total_ventas
      FROM pedidos WHERE creado_en >= $1 AND creado_en <= $2
    `, [desde, hasta]),

    // Top 10 productos
    pool.query(`
      SELECT pi.nombre_producto, SUM(pi.cantidad)::int AS unidades,
             SUM(pi.subtotal) AS ingresos
      FROM pedido_items pi
      JOIN pedidos p ON pi.pedido_id = p.id
      WHERE p.estado IN ('pagado','enviado','entregado')
        AND p.creado_en >= $1 AND p.creado_en <= $2
      GROUP BY pi.nombre_producto
      ORDER BY unidades DESC LIMIT 10
    `, [desde, hasta]),

    // Clientes nuevos
    pool.query(`
      SELECT COUNT(*)::int AS nuevos
      FROM usuarios
      WHERE rol_id = 2 AND creado_en >= $1 AND creado_en <= $2
    `, [desde, hasta]),
  ]);

  return {
    periodo,
    label: labelPeriodo[periodo] || periodo,
    desde: desde.toLocaleDateString('es-CO'),
    hasta: hasta.toLocaleDateString('es-CO'),
    resumen: pedidos.rows[0],
    ventasPorDia: ventas.rows,
    topProductos: topProductos.rows,
    clientesNuevos: resumen.rows[0]?.nuevos || 0,
  };
};

// ── DESCARGAR EXCEL ───────────────────────────────────────
const descargarExcel = async (req, res) => {
  const periodo = req.query.periodo || 'mensual';
  try {
    const datos = await getDatosReporte(periodo);
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Yerbateras';
    wb.created = new Date();

    // Colores de marca
    const VERDE   = '1E2E1A';
    const CREMA   = 'F5F0E1';
    const DORADO  = 'C8874A';
    const CLARO   = 'EAF0E5';

    const headerStyle = (bg = VERDE, fg = CREMA) => ({
      font: { bold: true, color: { argb: fg }, size: 11, name: 'Calibri' },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } },
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: { bottom: { style: 'thin', color: { argb: DORADO } } },
    });

    const cellStyle = (bold = false, align = 'left') => ({
      font: { bold, size: 10, name: 'Calibri', color: { argb: '1E2E1A' } },
      alignment: { horizontal: align, vertical: 'middle' },
      border: { bottom: { style: 'hair', color: { argb: 'DDD6C2' } } },
    });

    const altaRow = (row) => {
      row.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: CLARO } };
      });
    };

    // ── Hoja 1: Resumen ──────────────────────────────────
    const hResumen = wb.addWorksheet('Resumen');
    hResumen.columns = [{ width: 35 }, { width: 25 }];
    hResumen.addRow(['YERBATERAS — REPORTE DE VENTAS', '']).eachCell(c => Object.assign(c, headerStyle()));
    hResumen.mergeCells('A1:B1');
    hResumen.addRow([`Periodo: ${datos.label}  (${datos.desde} – ${datos.hasta})`, '']).eachCell(c => {
      c.font = { italic: true, size: 10, color: { argb: '5a7052' } };
    });
    hResumen.mergeCells('A2:B2');
    hResumen.addRow([]);

    const filasTit = ['INDICADOR', 'VALOR'];
    const r3 = hResumen.addRow(filasTit);
    r3.eachCell((c, i) => Object.assign(c, headerStyle(DORADO, VERDE)));
    r3.height = 22;

    const filas = [
      ['Total de ventas (COP)', `$${Number(datos.resumen.total_ventas).toLocaleString('es-CO')}`],
      ['Total de pedidos', datos.resumen.total],
      ['Pedidos pagados', datos.resumen.pagados],
      ['Pedidos en preparacion', datos.resumen.preparando],
      ['Pedidos enviados', datos.resumen.enviados],
      ['Pedidos entregados', datos.resumen.entregados],
      ['Pedidos cancelados', datos.resumen.cancelados],
      ['Clientes nuevos', datos.clientesNuevos],
    ];

    filas.forEach((f, i) => {
      const row = hResumen.addRow(f);
      row.height = 20;
      row.getCell(1).style = cellStyle(false, 'left');
      row.getCell(2).style = cellStyle(true, 'right');
      if (i % 2 === 0) altaRow(row);
    });

    // ── Hoja 2: Ventas por dia ───────────────────────────
    const hDias = wb.addWorksheet('Ventas por dia');
    hDias.columns = [
      { header: 'Fecha', key: 'fecha', width: 18 },
      { header: 'Pedidos', key: 'total_pedidos', width: 14 },
      { header: 'Ventas (COP)', key: 'total_ventas', width: 22 },
    ];
    const rTit = hDias.getRow(1);
    rTit.eachCell(c => Object.assign(c, headerStyle()));
    rTit.height = 22;

    datos.ventasPorDia.forEach((d, i) => {
      const row = hDias.addRow({
        fecha: new Date(d.fecha).toLocaleDateString('es-CO'),
        total_pedidos: d.total_pedidos,
        total_ventas: `$${Number(d.total_ventas).toLocaleString('es-CO')}`,
      });
      row.height = 18;
      row.eachCell(c => { c.font = { size: 10, name: 'Calibri' }; c.alignment = { vertical: 'middle' }; });
      if (i % 2 === 0) altaRow(row);
    });

    if (!datos.ventasPorDia.length) {
      hDias.addRow(['Sin datos en este periodo', '', '']);
    }

    // ── Hoja 3: Top productos ────────────────────────────
    const hProd = wb.addWorksheet('Top productos');
    hProd.columns = [
      { header: '#', key: 'pos', width: 6 },
      { header: 'Producto', key: 'nombre', width: 40 },
      { header: 'Unidades', key: 'unidades', width: 14 },
      { header: 'Ingresos (COP)', key: 'ingresos', width: 22 },
    ];
    hProd.getRow(1).eachCell(c => Object.assign(c, headerStyle()));
    hProd.getRow(1).height = 22;

    datos.topProductos.forEach((p, i) => {
      const row = hProd.addRow({
        pos: i + 1,
        nombre: p.nombre_producto,
        unidades: p.unidades,
        ingresos: `$${Number(p.ingresos).toLocaleString('es-CO')}`,
      });
      row.height = 18;
      row.eachCell(c => { c.font = { size: 10, name: 'Calibri' }; c.alignment = { vertical: 'middle' }; });
      if (i % 2 === 0) altaRow(row);
    });

    if (!datos.topProductos.length) hProd.addRow(['', 'Sin datos en este periodo', '', '']);

    // Enviar
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=yerbateras-reporte-${periodo}.xlsx`);
    await wb.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error('Error Excel:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al generar Excel' });
  }
};

// ── DESCARGAR PDF ─────────────────────────────────────────
const descargarPDF = async (req, res) => {
  const periodo = req.query.periodo || 'mensual';
  try {
    const datos = await getDatosReporte(periodo);
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=yerbateras-reporte-${periodo}.pdf`);
    doc.pipe(res);

    const W = 495; // ancho util
    const VERDE  = '#1E2E1A';
    const DORADO = '#C8874A';
    const CREMA  = '#F5F0E1';
    const GRIS   = '#8fa882';

    // ── Encabezado ─────────────────────────────────────
    doc.rect(50, 50, W, 70).fill(VERDE);
    doc.fillColor(CREMA).fontSize(22).font('Helvetica-Bold')
       .text('YERBATERAS', 65, 65);
    doc.fillColor(DORADO).fontSize(10).font('Helvetica')
       .text('Reporte de ventas y cuentas', 65, 92);
    doc.fillColor(CREMA).fontSize(9)
       .text(`${datos.label}  ·  ${datos.desde} – ${datos.hasta}`, 65, 107);

    // Logo letra Y
    doc.rect(W + 10, 55, 50, 50).fill(DORADO);
    doc.fillColor(VERDE).fontSize(28).font('Helvetica-Bold').text('Y', W + 24, 62);

    doc.moveDown(2);

    // ── Resumen ejecutivo ──────────────────────────────
    const yRes = 140;
    doc.fillColor(VERDE).fontSize(12).font('Helvetica-Bold').text('Resumen ejecutivo', 50, yRes);
    doc.moveTo(50, yRes + 16).lineTo(545, yRes + 16).strokeColor(DORADO).lineWidth(1.5).stroke();

    const metricas = [
      { label: 'Total ventas',     val: `$${Number(datos.resumen.total_ventas).toLocaleString('es-CO')} COP` },
      { label: 'Total pedidos',    val: String(datos.resumen.total) },
      { label: 'Pagados',          val: String(datos.resumen.pagados) },
      { label: 'Entregados',       val: String(datos.resumen.entregados) },
      { label: 'Cancelados',       val: String(datos.resumen.cancelados) },
      { label: 'Clientes nuevos',  val: String(datos.clientesNuevos) },
    ];

    const colW = W / 3;
    metricas.forEach((m, i) => {
      const col = i % 3;
      const fila = Math.floor(i / 3);
      const x = 50 + col * colW;
      const y = yRes + 30 + fila * 65;

      doc.rect(x + 2, y, colW - 8, 55).fill(fila % 2 === 0 ? '#f5f0e1' : '#eaf0e5');
      doc.fillColor(GRIS).fontSize(8).font('Helvetica').text(m.label.toUpperCase(), x + 10, y + 8);
      doc.fillColor(VERDE).fontSize(15).font('Helvetica-Bold').text(m.val, x + 10, y + 24);
    });

    // ── Ventas por dia ─────────────────────────────────
    const yVentas = yRes + 165;
    doc.fillColor(VERDE).fontSize(12).font('Helvetica-Bold').text('Ventas por dia', 50, yVentas);
    doc.moveTo(50, yVentas + 16).lineTo(545, yVentas + 16).strokeColor(DORADO).lineWidth(1.5).stroke();

    if (datos.ventasPorDia.length === 0) {
      doc.fillColor(GRIS).fontSize(10).font('Helvetica').text('Sin datos en este periodo', 50, yVentas + 25);
    } else {
      // Cabecera tabla
      const cols = [{ x:50, w:140, label:'Fecha' }, { x:200, w:100, label:'Pedidos' }, { x:310, w:235, label:'Ventas (COP)' }];
      const yTH = yVentas + 22;
      doc.rect(50, yTH, W, 20).fill(VERDE);
      cols.forEach(c => {
        doc.fillColor(CREMA).fontSize(9).font('Helvetica-Bold').text(c.label, c.x + 4, yTH + 5, { width: c.w });
      });

      datos.ventasPorDia.forEach((d, i) => {
        const yRow = yTH + 20 + i * 18;
        if (yRow > 740) return; // no salir de pagina
        if (i % 2 === 0) doc.rect(50, yRow, W, 18).fill('#eaf0e5');
        doc.fillColor(VERDE).fontSize(9).font('Helvetica');
        doc.text(new Date(d.fecha).toLocaleDateString('es-CO'), 54, yRow + 4);
        doc.text(String(d.total_pedidos), 204, yRow + 4);
        doc.text(`$${Number(d.total_ventas).toLocaleString('es-CO')}`, 314, yRow + 4);
      });
    }

    // ── Nueva pagina: Top productos ────────────────────
    doc.addPage();
    doc.rect(50, 50, W, 40).fill(VERDE);
    doc.fillColor(CREMA).fontSize(14).font('Helvetica-Bold').text('Top productos mas vendidos', 65, 62);

    if (datos.topProductos.length === 0) {
      doc.fillColor(GRIS).fontSize(10).font('Helvetica').text('Sin datos en este periodo', 50, 110);
    } else {
      const cols2 = [{ x:50, w:30, label:'#' }, { x:85, w:260, label:'Producto' }, { x:350, w:80, label:'Unidades' }, { x:435, w:110, label:'Ingresos (COP)' }];
      const yTH2 = 105;
      doc.rect(50, yTH2, W, 20).fill(DORADO);
      cols2.forEach(c => {
        doc.fillColor(VERDE).fontSize(9).font('Helvetica-Bold').text(c.label, c.x + 3, yTH2 + 5, { width: c.w });
      });
      datos.topProductos.forEach((p, i) => {
        const yRow = yTH2 + 20 + i * 20;
        if (i % 2 === 0) doc.rect(50, yRow, W, 20).fill('#f5f0e1');
        doc.fillColor(VERDE).fontSize(9).font('Helvetica');
        doc.text(String(i + 1), 53, yRow + 5);
        doc.text(p.nombre_producto, 88, yRow + 5, { width: 255 });
        doc.text(String(p.unidades), 353, yRow + 5);
        doc.text(`$${Number(p.ingresos).toLocaleString('es-CO')}`, 438, yRow + 5);
      });
    }

    // ── Pie de pagina ──────────────────────────────────
    doc.fontSize(8).fillColor(GRIS).font('Helvetica')
       .text(`Generado el ${new Date().toLocaleDateString('es-CO', { year:'numeric', month:'long', day:'numeric' })} · Yerbateras · Certificado INVIMA`, 50, 780, { align:'center', width: W });

    doc.end();
  } catch (err) {
    console.error('Error PDF:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al generar PDF' });
  }
};

module.exports = { descargarExcel, descargarPDF };
