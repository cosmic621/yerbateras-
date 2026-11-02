import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, MapPin, ExternalLink } from 'lucide-react';
import api from '../services/api';
import BandaTitulo from '../components/ui/BandaTitulo';

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const pad = (n) => String(n).padStart(2, '0');

// Calendario mensual: al pasar el cursor (o tocar en el celular) por un día con evento
// se despliega un recuadro con el flyer.
export default function Eventos() {
  const hoy = new Date();
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth()); // 0-11
  const [eventos, setEventos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [dia, setDia] = useState(null); // día (número) con el recuadro abierto
  const [fijo, setFijo] = useState(false); // abierto por clic/toque

  useEffect(() => {
    setCargando(true); setDia(null);
    api.get(`/eventos?mes=${anio}-${pad(mes + 1)}`)
      .then(r => setEventos(r.data.eventos || []))
      .catch(() => setEventos([]))
      .finally(() => setCargando(false));
  }, [anio, mes]);

  const cambiarMes = (d) => {
    const f = new Date(anio, mes + d, 1);
    setAnio(f.getFullYear()); setMes(f.getMonth());
  };

  const porDia = {};
  eventos.forEach(e => { const d = Number(e.fecha.slice(8, 10)); (porDia[d] ||= []).push(e); });

  const diasMes = new Date(anio, mes + 1, 0).getDate();
  const offset = (new Date(anio, mes, 1).getDay() + 6) % 7; // lunes = 0
  const celdas = [...Array(offset).fill(null), ...Array.from({ length: diasMes }, (_, i) => i + 1)];
  const nombreMes = new Date(anio, mes, 1).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
  const esHoy = (d) => d === hoy.getDate() && mes === hoy.getMonth() && anio === hoy.getFullYear();

  return (
    <div className="bg-crema-50 min-h-screen">
      <BandaTitulo>Eventos</BandaTitulo>
      <p className="text-center text-xl text-verde-600 mt-8 px-6">Pasa el cursor sobre un día marcado para ver el flyer del evento.</p>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-5">
          <button onClick={() => cambiarMes(-1)} aria-label="Mes anterior" className="p-2 border border-crema-300 bg-white hover:border-dorado-500"><ChevronLeft size={18} /></button>
          <h2 className="font-display text-2xl font-bold text-verde-900 capitalize">{nombreMes}</h2>
          <button onClick={() => cambiarMes(1)} aria-label="Mes siguiente" className="p-2 border border-crema-300 bg-white hover:border-dorado-500"><ChevronRight size={18} /></button>
        </div>

        <div className="grid grid-cols-7 bg-verde-900 text-crema-100 text-center text-xs font-bold uppercase tracking-wider">
          {DIAS.map(d => <div key={d} className="py-2">{d}</div>)}
        </div>

        <div className={`grid grid-cols-7 border-l border-t border-crema-300 bg-white ${cargando ? 'opacity-50' : ''}`}>
          {celdas.map((d, i) => {
            const evs = d ? porDia[d] : null;
            const abierto = dia === d && evs;
            return (
              <div key={i}
                className={`relative h-16 sm:h-24 border-r border-b border-crema-300 p-1.5 ${evs ? 'cursor-pointer bg-dorado-50 hover:bg-dorado-100' : ''}`}
                onMouseEnter={() => evs && !fijo && setDia(d)}
                onMouseLeave={() => !fijo && setDia(null)}
                onClick={() => { if (!evs) return; if (dia === d && fijo) { setDia(null); setFijo(false); } else { setDia(d); setFijo(true); } }}>
                {d && <span className={`text-sm ${esHoy(d) ? 'bg-verde-900 text-crema-100 px-1.5 py-0.5 font-bold' : 'text-verde-800'}`}>{d}</span>}
                {evs && (
                  <div className="mt-1 hidden sm:block">
                    {evs.slice(0, 2).map(e => <p key={e.id} className="text-[0.65rem] leading-tight truncate text-verde-900 font-semibold">• {e.titulo}</p>)}
                    {evs.length > 2 && <p className="text-[0.65rem] text-verde-500">+{evs.length - 2} más</p>}
                  </div>
                )}
                {evs && <span className="sm:hidden absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-dorado-500" />}

                {abierto && (
                  <div onClick={e => e.stopPropagation()}
                    className={`absolute z-30 top-full mt-1 w-72 max-w-[80vw] bg-white border border-crema-300 shadow-card-hover text-left cursor-default ${(i % 7) > 3 ? 'right-0' : 'left-0'}`}>
                    {evs.map(e => (
                      <div key={e.id} className="border-b border-crema-200 last:border-0">
                        {e.flyer_url && <img src={e.flyer_url} alt={`Flyer: ${e.titulo}`} className="w-full max-h-72 object-contain bg-crema-100" />}
                        <div className="p-3">
                          <p className="font-display font-bold text-verde-900 leading-snug">{e.titulo}</p>
                          {e.hora_inicio && <p className="text-xs text-verde-600 flex items-center gap-1 mt-1"><Clock size={12} /> {e.hora_inicio}{e.hora_fin ? ` – ${e.hora_fin}` : ''}</p>}
                          {e.lugar && <p className="text-xs text-verde-600 flex items-center gap-1 mt-0.5"><MapPin size={12} /> {e.lugar}</p>}
                          {e.descripcion && <p className="text-xs text-verde-700 mt-2 leading-relaxed">{e.descripcion}</p>}
                          {e.enlace && <a href={e.enlace} target="_blank" rel="noreferrer" className="text-xs text-dorado-700 font-semibold flex items-center gap-1 mt-2">Más información <ExternalLink size={11} /></a>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {!cargando && eventos.length === 0 && <p className="text-center font-body text-verde-600 mt-6">No hay eventos programados este mes.</p>}
      </div>
    </div>
  );
}
