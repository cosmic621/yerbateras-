import { useEffect, useState } from 'react';
import { TrendingUp, ShoppingBag, Users, Package, AlertTriangle, Download, FileText, Table } from 'lucide-react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import api from '../../services/api';

// ── Descarga Excel ────────────────────────────────────────
async function descargarExcel(periodo) {
  try {
    const { data } = await api.get(`/admin/reportes/excel?periodo=${periodo}`, { responseType:'blob' });
    const url  = window.URL.createObjectURL(new Blob([data]));
    const link = document.createElement('a');
    link.href  = url;
    link.setAttribute('download', `yerbateras-reporte-${periodo}-${new Date().toISOString().split('T')[0]}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch {
    alert('Error al generar Excel. Asegurate de tener los datos cargados.');
  }
}

// ── Descarga PDF ──────────────────────────────────────────
async function descargarPDF(periodo) {
  try {
    const { data } = await api.get(`/admin/reportes/pdf?periodo=${periodo}`, { responseType:'blob' });
    const url  = window.URL.createObjectURL(new Blob([data], { type:'application/pdf' }));
    const link = document.createElement('a');
    link.href  = url;
    link.setAttribute('download', `yerbateras-reporte-${periodo}-${new Date().toISOString().split('T')[0]}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch {
    alert('Error al generar PDF.');
  }
}

// ── Tarjeta metrica ───────────────────────────────────────
const MetricCard = ({ icon: Icon, label, value, sub, color = '#5C6B3A' }) => (
  <div style={{
    background:'white', border:'1px solid #e8e3d8',
    borderRadius:8, padding:'1.25rem',
    display:'flex', flexDirection:'column', gap:12
  }}>
    <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
      <span style={{fontFamily:'Georgia,serif', fontSize:'0.8rem', color:'#8fa882', fontWeight:'bold', letterSpacing:'0.05em', textTransform:'uppercase'}}>
        {label}
      </span>
      <div style={{width:36, height:36, borderRadius:8, background:`${color}15`, display:'flex', alignItems:'center', justifyContent:'center'}}>
        <Icon size={18} color={color} />
      </div>
    </div>
    <div>
      <p style={{fontFamily:'Georgia,serif', fontSize:'1.6rem', fontWeight:'bold', color:'#1E2E1A', margin:0, lineHeight:1}}>{value}</p>
      {sub && <p style={{fontFamily:'Georgia,serif', fontSize:'0.78rem', color:'#8fa882', margin:'6px 0 0'}}>{sub}</p>}
    </div>
  </div>
);

// ── Mini barra de progreso ────────────────────────────────
const BarraEstado = ({ label, val, total, color }) => {
  const pct = total > 0 ? Math.round((val / total) * 100) : 0;
  return (
    <div style={{marginBottom:12}}>
      <div style={{display:'flex', justifyContent:'space-between', marginBottom:5}}>
        <span style={{fontFamily:'Georgia,serif', fontSize:'0.82rem', color:'#3d5a35'}}>{label}</span>
        <span style={{fontFamily:'Georgia,serif', fontSize:'0.82rem', fontWeight:'bold', color:'#1E2E1A'}}>{val}</span>
      </div>
      <div style={{height:6, background:'#f0ede8', borderRadius:3, overflow:'hidden'}}>
        <div style={{height:'100%', width:`${pct}%`, background:color, borderRadius:3, transition:'width 0.6s ease'}} />
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  const [metricas, setMetricas]   = useState(null);
  const [cargando, setCargando]   = useState(true);
  const [periodo, setPeriodo]     = useState('mensual');
  const [descargando, setDescargando] = useState('');

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(r => setMetricas(r.data.metricas))
      .finally(() => setCargando(false));
  }, []);

  const handleDescargar = async (tipo) => {
    setDescargando(tipo);
    if (tipo === 'excel') await descargarExcel(periodo);
    else await descargarPDF(periodo);
    setDescargando('');
  };

  const hoy = new Date().toLocaleDateString('es-CO', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

  const S = {
    header: { display:'flex', flexDirection:'column', gap:4, marginBottom:'2rem' },
    h1:     { fontFamily:'Georgia,serif', fontSize:'1.6rem', fontWeight:'bold', color:'#1E2E1A', margin:0 },
    fecha:  { fontFamily:'Georgia,serif', fontSize:'0.82rem', color:'#8fa882' },
    grid4:  { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:'1rem', marginBottom:'1.5rem' },
    grid2:  { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:'1rem', marginBottom:'1.5rem' },
    card:   { background:'white', border:'1px solid #e8e3d8', borderRadius:8, padding:'1.25rem' },
    ctit:   { fontFamily:'Georgia,serif', fontSize:'0.82rem', fontWeight:'bold', color:'#2d4a22', letterSpacing:'0.05em', textTransform:'uppercase', marginBottom:'1rem' },
    sel:    { fontFamily:'Georgia,serif', fontSize:'0.85rem', border:'1px solid #ddd6c2', padding:'7px 12px', color:'#1E2E1A', background:'#faf8f4', cursor:'pointer', borderRadius:4 },
    btnD:   { display:'flex', alignItems:'center', gap:6, padding:'8px 14px', fontFamily:'Georgia,serif', fontSize:'0.82rem', fontWeight:'bold', border:'1px solid', borderRadius:4, cursor:'pointer', transition:'all 0.2s' },
  };

  if (cargando) return (
    <AdminSidebar>
      <div style={{display:'flex', alignItems:'center', justifyContent:'center', height:300}}>
        <div style={{width:32, height:32, border:'3px solid #e8e3d8', borderTopColor:'#5C6B3A', borderRadius:'50%', animation:'spin 0.8s linear infinite'}} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </AdminSidebar>
  );

  const p = metricas?.pedidos || {};
  const totalVentas = Number(metricas?.total_ventas || 0);

  return (
    <AdminSidebar>
      <div style={{maxWidth:1100}}>

        {/* Header */}
        <div style={S.header}>
          <div style={{display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12}}>
            <div>
              <h1 style={S.h1}>Dashboard</h1>
              <p style={S.fecha}>{hoy}</p>
            </div>

            {/* Panel de descarga */}
            <div style={{display:'flex', alignItems:'center', gap:10, background:'white', border:'1px solid #e8e3d8', borderRadius:8, padding:'10px 14px', flexWrap:'wrap'}}>
              <span style={{fontFamily:'Georgia,serif', fontSize:'0.8rem', color:'#8fa882', fontWeight:'bold'}}>Exportar reporte:</span>
              <select value={periodo} onChange={e => setPeriodo(e.target.value)} style={S.sel}>
                <option value="diario">Hoy</option>
                <option value="mensual">Este mes</option>
                <option value="anual">Este ano</option>
              </select>
              <button
                onClick={() => handleDescargar('excel')}
                disabled={!!descargando}
                style={{...S.btnD, borderColor:'#5C6B3A', color: descargando === 'excel' ? '#8fa882' : '#5C6B3A', background: descargando === 'excel' ? '#f5f0e1' : 'white'}}
              >
                <Table size={14} />
                {descargando === 'excel' ? 'Generando...' : 'Excel'}
              </button>
              <button
                onClick={() => handleDescargar('pdf')}
                disabled={!!descargando}
                style={{...S.btnD, borderColor:'#C8874A', color: descargando === 'pdf' ? '#8fa882' : '#C8874A', background: descargando === 'pdf' ? '#faf5ee' : 'white'}}
              >
                <FileText size={14} />
                {descargando === 'pdf' ? 'Generando...' : 'PDF'}
              </button>
            </div>
          </div>
        </div>

        {/* Metricas principales */}
        <div style={S.grid4}>
          <MetricCard icon={TrendingUp}  label="Ventas totales"    value={`$${totalVentas.toLocaleString('es-CO')}`} sub="COP acumulado"                              color="#5C6B3A" />
          <MetricCard icon={ShoppingBag} label="Pedidos totales"   value={p.total || 0}                              sub={`${p.pendientes || 0} pendientes`}           color="#C8874A" />
          <MetricCard icon={Users}       label="Clientes"          value={metricas?.total_usuarios || 0}             sub="Registrados"                                 color="#1E2E1A" />
          <MetricCard icon={Package}     label="Productos activos" value={metricas?.productos?.total || 0}           sub={metricas?.productos?.bajo_stock > 0 ? `${metricas.productos.bajo_stock} con bajo stock` : 'Stock saludable'} color={metricas?.productos?.bajo_stock > 0 ? '#B85E1A' : '#5C6B3A'} />
        </div>

        {/* Fila 2: estado pedidos + ventas ultimos dias */}
        <div style={S.grid2}>
          {/* Estado pedidos */}
          <div style={S.card}>
            <p style={S.ctit}>Estado de pedidos</p>
            <BarraEstado label="Pagados"    val={p.pagados   || 0} total={p.total || 1} color="#5C6B3A" />
            <BarraEstado label="Preparando" val={p.preparando|| 0} total={p.total || 1} color="#C8874A" />
            <BarraEstado label="Enviados"   val={p.enviados  || 0} total={p.total || 1} color="#1E2E1A" />
            <BarraEstado label="Entregados" val={p.entregados|| 0} total={p.total || 1} color="#3d6a30" />
            <BarraEstado label="Cancelados" val={p.cancelados|| 0} total={p.total || 1} color="#B85E1A" />
          </div>

          {/* Ventas 30 dias — mini grafico de barras */}
          <div style={S.card}>
            <p style={S.ctit}>Ventas — ultimos 30 dias</p>
            {metricas?.ventas_30_dias?.length > 0 ? (
              <>
                <div style={{display:'flex', alignItems:'flex-end', gap:3, height:100, marginBottom:8}}>
                  {metricas.ventas_30_dias.slice(-20).map((d, i) => {
                    const max = Math.max(...metricas.ventas_30_dias.map(v => parseFloat(v.ventas)));
                    const pct = max > 0 ? (parseFloat(d.ventas) / max) * 100 : 0;
                    return (
                      <div key={i} title={`$${Number(d.ventas).toLocaleString('es-CO')}`}
                        style={{flex:1, background:'#5C6B3A', borderRadius:'2px 2px 0 0', minHeight:4, height:`${Math.max(4, pct)}%`, transition:'height 0.5s', cursor:'pointer', opacity:0.7}}
                        onMouseEnter={e => e.target.style.opacity = 1}
                        onMouseLeave={e => e.target.style.opacity = 0.7}
                      />
                    );
                  })}
                </div>
                <p style={{fontFamily:'Georgia,serif', fontSize:'0.75rem', color:'#8fa882', margin:0}}>
                  Pasa el cursor sobre cada barra para ver el valor
                </p>
              </>
            ) : (
              <div style={{height:100, display:'flex', alignItems:'center', justifyContent:'center'}}>
                <p style={{fontFamily:'Georgia,serif', fontSize:'0.85rem', color:'#8fa882'}}>Sin ventas en este periodo</p>
              </div>
            )}
          </div>
        </div>

        {/* Alerta bajo stock */}
        {metricas?.productos?.bajo_stock > 0 && (
          <div style={{background:'#fef9ec', border:'1px solid #f0c660', borderRadius:8, padding:'1rem 1.25rem', display:'flex', alignItems:'flex-start', gap:12}}>
            <AlertTriangle size={18} color="#C8874A" style={{marginTop:2, flexShrink:0}} />
            <div>
              <p style={{fontFamily:'Georgia,serif', fontSize:'0.88rem', fontWeight:'bold', color:'#7a4a10', margin:'0 0 4px'}}>
                {metricas.productos.bajo_stock} producto(s) con stock bajo o agotado
              </p>
              <p style={{fontFamily:'Georgia,serif', fontSize:'0.8rem', color:'#a06820', margin:0}}>
                Revisa el inventario para reabastecer antes de que se agoten.
              </p>
            </div>
          </div>
        )}
      </div>
    </AdminSidebar>
  );
}
