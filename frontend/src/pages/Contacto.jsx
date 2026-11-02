import BandaTitulo from '../components/ui/BandaTitulo';
import { Mail, Phone, Instagram } from 'lucide-react';

export default function Contacto() {
  const Fila = ({ icon: Icon, children }) => <li className="flex items-center gap-3 text-xl text-verde-800"><Icon size={20} className="text-dorado-600" />{children}</li>;
  return (
    <>
      <BandaTitulo>Contacto</BandaTitulo>
      <div className="max-w-xl mx-auto px-6 py-14 text-center">
        <p className="text-2xl text-verde-800 leading-relaxed mb-8">¿Dudas sobre un producto, un masaje o un taller? Escríbenos, con gusto te respondemos.</p>
        <ul className="inline-block text-left space-y-4">
          <Fila icon={Phone}><a href="https://wa.me/573102631592" target="_blank" rel="noreferrer" className="hover:text-dorado-700">+57 310 263 1592 (WhatsApp)</a></Fila>
          <Fila icon={Mail}><a href="mailto:info@yerbateras.co" className="hover:text-dorado-700">info@yerbateras.co</a></Fila>
          <Fila icon={Instagram}><a href="https://www.instagram.com/yerbaterass/" target="_blank" rel="noreferrer" className="hover:text-dorado-700">@yerbaterass</a></Fila>
        </ul>
        <div className="mt-10">
          <button onClick={() => window.dispatchEvent(new Event('abrir-cotizacion'))} className="btn-outline">Cotización para empresas y grupos</button>
        </div>
      </div>
    </>
  );
}
