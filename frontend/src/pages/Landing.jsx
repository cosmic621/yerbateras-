import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Award, ArrowRight, Star, CheckCircle, Instagram, Facebook, Leaf, Package, BookOpen, Heart } from 'lucide-react';
import api from '../services/api';

const INSTAGRAM = 'https://www.instagram.com/yerbaterass/';
const FACEBOOK  = 'https://www.facebook.com/share/1NTDTKzjRM/?mibextid=wwXIfr';
const WHATSAPP  = 'https://wa.me/573102631592';

// ── HERO ──────────────────────────────────────────────────
const Hero = () => (
  <section className="relative min-h-screen flex items-center overflow-hidden" style={{background:'linear-gradient(135deg, #1E2E1A 0%, #2d4a22 50%, #1E2E1A 100%)'}}>
    {/* Fondo texturizado */}
    <div className="absolute inset-0" style={{backgroundImage:"url(\"data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5z' fill='%23ffffff' fill-opacity='0.02' fill-rule='evenodd'/%3E%3C/svg%3E\")"}} />
    
    {/* Linea dorada decorativa izquierda */}
    <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-transparent via-tierra-400 to-transparent opacity-60" />

    <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 py-32 w-full">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        {/* Texto */}
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px w-12 bg-tierra-400" />
            <span className="text-tierra-400 font-body text-xs tracking-widest uppercase font-semibold">Certificacion INVIMA</span>
          </div>

          <h1 className="font-display font-bold leading-none mb-6" style={{fontSize:'clamp(2.5rem,5vw,4.5rem)', color:'#F5F0E1'}}>
            El poder<br />
            <span style={{color:'#C8874A', fontStyle:'italic'}}>curativo</span><br />
            de las plantas
          </h1>

          <p className="font-body leading-relaxed mb-3" style={{color:'#c8bfa8', fontSize:'1.1rem', maxWidth:'480px'}}>
            Productos herbales elaborados artesanalmente con plantas medicinales seleccionadas por sus propiedades terapeuticas y aromaticas.
          </p>
          <p className="font-body leading-relaxed mb-10" style={{color:'#8fa882', fontSize:'0.95rem', maxWidth:'460px'}}>
            Aceites, pomadas, banos herbales, tinturas, perfumes botanicos e infusiones para el bienestar fisico, emocional y espiritual.
          </p>

          <div className="flex flex-wrap gap-4 mb-14">
            <Link to="/tienda"
              className="inline-flex items-center gap-2 font-body font-semibold tracking-wide px-8 py-4 transition-all duration-200"
              style={{background:'#C8874A', color:'#1E2E1A', fontSize:'0.9rem'}}>
              Explorar productos <ArrowRight size={16} />
            </Link>
            <a href="#nosotros"
              className="inline-flex items-center gap-2 font-body font-semibold tracking-wide px-8 py-4 transition-all duration-200 border"
              style={{borderColor:'rgba(245,240,225,0.25)', color:'#F5F0E1', fontSize:'0.9rem'}}>
              Conocer mas
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 pt-10 border-t" style={{borderColor:'rgba(245,240,225,0.08)'}}>
            {[
              { num: '10+', label: 'Anos de trayectoria' },
              { num: '100%', label: 'Artesanal' },
              { num: 'INVIMA', label: 'Certificado' },
            ].map(s => (
              <div key={s.label}>
                <div className="font-display font-bold" style={{fontSize:'1.8rem', color:'#C8874A'}}>{s.num}</div>
                <div className="font-body mt-1" style={{color:'#8fa882', fontSize:'0.78rem', textTransform:'uppercase', letterSpacing:'0.05em'}}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Lado derecho — tarjeta visual */}
        <div className="hidden lg:flex justify-center items-center">
          <div className="relative w-80 h-96">
            {/* Tarjeta principal */}
            <div className="absolute inset-0 rounded-none border" style={{background:'rgba(92,107,58,0.15)', borderColor:'rgba(200,135,74,0.25)'}}>
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6" style={{background:'rgba(200,135,74,0.15)', border:'1px solid rgba(200,135,74,0.3)'}}>
                  <Leaf size={36} style={{color:'#C8874A'}} />
                </div>
                <p className="font-display text-center font-bold text-xl mb-2" style={{color:'#F5F0E1'}}>Yerbateras</p>
                <p className="font-body text-center text-xs tracking-widest uppercase" style={{color:'#8fa882'}}>Herbolaria artesanal</p>
                <div className="w-8 h-px my-5" style={{background:'#C8874A'}} />
                <p className="font-body text-center text-sm leading-relaxed" style={{color:'#c8bfa8'}}>
                  Mas de 10 anos recuperando saberes ancestrales y el poder de las plantas para el cuidado cotidiano.
                </p>
              </div>
            </div>
            {/* Borde decorativo */}
            <div className="absolute -top-3 -right-3 w-full h-full border" style={{borderColor:'rgba(200,135,74,0.15)'}} />
          </div>
        </div>
      </div>
    </div>
  </section>
);

// ── FRANJA DE CONFIANZA ───────────────────────────────────
const Confianza = () => (
  <div className="py-5 border-y" style={{background:'#F5F0E1', borderColor:'#ddd6c2'}}>
    <div className="max-w-7xl mx-auto px-6">
      <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
        {[
          { icon: Shield, text: 'Certificacion INVIMA' },
          { icon: Leaf, text: 'Elaboracion artesanal' },
          { icon: Heart, text: 'Saberes ancestrales' },
          { icon: Package, text: 'Envios a todo Colombia' },
          { icon: BookOpen, text: 'Talleres educativos' },
        ].map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-2">
            <Icon size={15} style={{color:'#5C6B3A'}} />
            <span className="font-body text-sm font-semibold" style={{color:'#2d4a22', letterSpacing:'0.02em'}}>{text}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ── NOSOTROS ──────────────────────────────────────────────
const Nosotros = () => (
  <section id="nosotros" className="py-28" style={{background:'#F5F0E1'}}>
    <div className="max-w-7xl mx-auto px-6 lg:px-12">
      <div className="grid lg:grid-cols-2 gap-20 items-start">
        <div>
          <div className="flex items-center gap-3 mb-5">
            <div className="h-px w-10" style={{background:'#C8874A'}} />
            <span className="font-body text-xs tracking-widest uppercase font-semibold" style={{color:'#C8874A'}}>Quienes somos</span>
          </div>
          <h2 className="font-display font-bold leading-tight mb-6" style={{fontSize:'clamp(1.8rem,3vw,2.8rem)', color:'#1E2E1A'}}>
            Mas de 10 anos<br />cultivando bienestar
          </h2>
          <p className="font-body leading-relaxed mb-5" style={{color:'#3d5a35', fontSize:'1.05rem'}}>
            Creamos productos herbales y experiencias educativas que promueven el autocuidado, el bienestar, el placer y la conexion con la naturaleza a traves de las plantas medicinales.
          </p>
          <p className="font-body leading-relaxed mb-8" style={{color:'#4a5e42', fontSize:'0.95rem'}}>
            Recuperamos saberes ancestrales, remedios populares y el poder de las plantas para el cuidado cotidiano. Nuestra linea incluye aceites, pomadas, banos herbales, tinturas, perfumes botanicos e infusiones.
          </p>

          <div className="grid grid-cols-2 gap-3 mb-8">
            {[
              'Saberes ancestrales',
              'Elaboracion artesanal',
              'Plantas medicinales',
              'Certificado INVIMA',
              'Perfumes botanicos',
              'Banos herbales',
            ].map(t => (
              <div key={t} className="flex items-center gap-2 py-2 px-3 border" style={{borderColor:'#c8bfa8', background:'white'}}>
                <CheckCircle size={13} style={{color:'#5C6B3A', flexShrink:0}} />
                <span className="font-body text-sm" style={{color:'#2d4a22'}}>{t}</span>
              </div>
            ))}
          </div>

          <Link to="/tienda" className="inline-flex items-center gap-2 font-body font-semibold text-sm tracking-wide px-6 py-3 transition-colors"
            style={{background:'#1E2E1A', color:'#F5F0E1'}}>
            Ver todos los productos <ArrowRight size={15} />
          </Link>
        </div>

        {/* Columna derecha */}
        <div className="space-y-5">
          {/* Tarjeta INVIMA */}
          <div className="p-8 border-l-4" style={{background:'#1E2E1A', borderLeftColor:'#C8874A'}}>
            <div className="flex items-start gap-4">
              <div className="p-3 shrink-0" style={{background:'rgba(200,135,74,0.15)'}}>
                <Award size={22} style={{color:'#C8874A'}} />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg mb-2" style={{color:'#F5F0E1'}}>Certificacion INVIMA</h3>
                <p className="font-body text-sm leading-relaxed" style={{color:'#a8b8a0'}}>
                  Todos nuestros productos cuentan con registro sanitario INVIMA, garantizando los mas altos estandares de calidad, seguridad y eficacia en cada elaboracion.
                </p>
              </div>
            </div>
          </div>

          {/* Tarjeta productos */}
          <div className="p-8 border" style={{background:'white', borderColor:'#ddd6c2'}}>
            <h3 className="font-display font-bold text-base mb-4" style={{color:'#1E2E1A'}}>Nuestra linea de productos</h3>
            <div className="space-y-2">
              {['Aceites esenciales y de portador','Pomadas y cremas topicas','Banos herbales terapeuticos','Tinturas y extractos botanicos','Perfumes botanicos naturales','Infusiones y tes medicinales'].map(p => (
                <div key={p} className="flex items-center gap-2 py-1.5 border-b last:border-0" style={{borderColor:'#ede8da'}}>
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{background:'#C8874A'}} />
                  <span className="font-body text-sm" style={{color:'#3d5a35'}}>{p}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// ── POR QUE — verde oscuro fondo, letras claras ───────────
const PorQue = () => (
  <section style={{background:'#1E2E1A', padding:'5rem 0'}}>
    <div className="max-w-7xl mx-auto px-6 lg:px-12">
      <div className="text-center mb-14">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="h-px w-10" style={{background:'#C8874A'}} />
          <span className="font-body text-xs tracking-widest uppercase font-semibold" style={{color:'#C8874A'}}>Nuestra diferencia</span>
          <div className="h-px w-10" style={{background:'#C8874A'}} />
        </div>
        <h2 className="font-display font-bold" style={{fontSize:'clamp(1.8rem,3vw,2.5rem)', color:'#F5F0E1'}}>
          Por que elegir Yerbateras
        </h2>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { num:'01', titulo:'Certificado INVIMA', desc:'Registro sanitario oficial que garantiza seguridad y calidad en cada producto elaborado artesanalmente.' },
          { num:'02', titulo:'Elaboracion artesanal', desc:'Cada producto es hecho a mano con ingredientes de origen vegetal cuidadosamente seleccionados.' },
          { num:'03', titulo:'10 anos de saber', desc:'Trayectoria comprobada en fitoterapia, herbolaria y educacion popular sobre plantas medicinales.' },
          { num:'04', titulo:'Saberes ancestrales', desc:'Recuperamos remedios populares y tradiciones botanicas para el cuidado cotidiano y el bienestar.' },
        ].map((f) => (
          <div key={f.num} className="p-7 border transition-all duration-300 group" style={{borderColor:'rgba(245,240,225,0.08)', background:'rgba(245,240,225,0.03)'}}>
            <div className="font-display font-bold mb-4" style={{fontSize:'2rem', color:'rgba(200,135,74,0.3)'}}>{f.num}</div>
            <h3 className="font-display font-bold text-base mb-3" style={{color:'#F5F0E1'}}>{f.titulo}</h3>
            <p className="font-body text-sm leading-relaxed" style={{color:'#8fa882'}}>{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ── EQUIPO ────────────────────────────────────────────────
const Equipo = () => (
  <section id="equipo" style={{background:'#F5F0E1', padding:'5rem 0'}}>
    <div className="max-w-7xl mx-auto px-6 lg:px-12">
      <div className="mb-14">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px w-10" style={{background:'#C8874A'}} />
          <span className="font-body text-xs tracking-widest uppercase font-semibold" style={{color:'#C8874A'}}>El equipo</span>
        </div>
        <h2 className="font-display font-bold" style={{fontSize:'clamp(1.8rem,3vw,2.5rem)', color:'#1E2E1A'}}>
          Quienes hacen posible Yerbateras
        </h2>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Estefania */}
        <div className="flex flex-col overflow-hidden border" style={{borderColor:'#ddd6c2', background:'white'}}>
          <div className="px-8 py-6 flex items-center gap-5" style={{background:'#1E2E1A'}}>
            <div className="w-16 h-16 flex items-center justify-center shrink-0 font-display font-bold text-2xl" style={{background:'#C8874A', color:'#1E2E1A'}}>
              E
            </div>
            <div>
              <h3 className="font-display font-bold text-xl leading-tight" style={{color:'#F5F0E1'}}>
                Estefania Pineros
              </h3>
              <p className="font-body text-xs font-semibold tracking-widest uppercase mt-1.5" style={{color:'#C8874A'}}>
                Fundadora y cara publica
              </p>
            </div>
          </div>
          <div className="px-8 py-7 flex-1" style={{background:'white'}}>
            <p className="font-body leading-relaxed mb-6" style={{color:'#2d4a22', fontSize:'0.95rem'}}>
              Herbolaria con mas de 10 anos investigando y elaborando productos naturales. Facilita talleres sobre plantas medicinales, autocuidado y saberes ancestrales. Es la voz y cara de Yerbateras, compartiendo el conocimiento herbolario con la comunidad.
            </p>
            <div className="space-y-2">
              {['Investigacion y desarrollo herbolario','Talleres de plantas medicinales','Vocera y representante de la marca','Educacion popular y autocuidado'].map(item => (
                <div key={item} className="flex items-center gap-2.5 text-sm font-body py-1 border-b last:border-0" style={{color:'#3d5a35', borderColor:'#ede8da'}}>
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{background:'#C8874A'}} />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Gloria */}
        <div className="flex flex-col overflow-hidden border" style={{borderColor:'#ddd6c2', background:'white'}}>
          <div className="px-8 py-6 flex items-center gap-5" style={{background:'#5C6B3A'}}>
            <div className="w-16 h-16 flex items-center justify-center shrink-0 font-display font-bold text-2xl" style={{background:'#F5F0E1', color:'#1E2E1A'}}>
              G
            </div>
            <div>
              <h3 className="font-display font-bold text-xl leading-tight" style={{color:'#F5F0E1'}}>
                Gloria Ospina
              </h3>
              <p className="font-body text-xs font-semibold tracking-widest uppercase mt-1.5" style={{color:'#e8dfc8'}}>
                Encargada de produccion y envios
              </p>
            </div>
          </div>
          <div className="px-8 py-7 flex-1" style={{background:'white'}}>
            <p className="font-body leading-relaxed mb-6" style={{color:'#2d4a22', fontSize:'0.95rem'}}>
              Responsable de la elaboracion artesanal de cada uno de los productos Yerbateras, garantizando la calidad en cada proceso. Gestiona el despacho y seguimiento de todos los pedidos para que lleguen perfectos a cada cliente.
            </p>
            <div className="space-y-2">
              {['Elaboracion artesanal de productos','Control de calidad en cada proceso','Gestion y despacho de envios','Manejo de inventario y materias primas'].map(item => (
                <div key={item} className="flex items-center gap-2.5 text-sm font-body py-1 border-b last:border-0" style={{color:'#3d5a35', borderColor:'#ede8da'}}>
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{background:'#5C6B3A'}} />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// ── PRODUCTOS DESTACADOS ──────────────────────────────────
const ProductosDestacados = () => {
  const [productos, setProductos] = useState([]);
  useEffect(() => {
    api.get('/productos?destacados=true&limit=4')
      .then(r => setProductos(r.data.productos || []))
      .catch(() => {});
  }, []);

  if (!productos.length) return null;

  return (
    <section style={{background:'#F5F0E1', padding:'5rem 0', borderTop:'1px solid #ddd6c2'}}>
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex items-end justify-between mb-12">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px w-10" style={{background:'#C8874A'}} />
              <span className="font-body text-xs tracking-widest uppercase font-semibold" style={{color:'#C8874A'}}>Seleccion especial</span>
            </div>
            <h2 className="font-display font-bold" style={{fontSize:'clamp(1.6rem,2.5vw,2.2rem)', color:'#1E2E1A'}}>
              Productos destacados
            </h2>
          </div>
          <Link to="/tienda" className="hidden md:flex items-center gap-2 font-body text-sm font-semibold transition-colors" style={{color:'#5C6B3A'}}>
            Ver todos <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {productos.map(p => (
            <Link to={`/tienda/${p.id}`} key={p.id} className="group overflow-hidden border transition-all duration-300 hover:shadow-lg" style={{background:'white', borderColor:'#ddd6c2'}}>
              <div className="h-48 flex items-center justify-center overflow-hidden" style={{background:'#ede8da'}}>
                {p.imagen_principal
                  ? <img src={p.imagen_principal} alt={p.nombre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  : <Leaf size={40} style={{color:'#c8bfa8'}} />}
              </div>
              <div className="p-5">
                <p className="font-body text-xs tracking-widest uppercase mb-1.5 font-semibold" style={{color:'#C8874A'}}>{p.categoria}</p>
                <h3 className="font-display font-bold text-base mb-2 leading-snug line-clamp-2" style={{color:'#1E2E1A'}}>{p.nombre}</h3>
                <p className="font-body text-xs leading-relaxed line-clamp-2 mb-4" style={{color:'#5a7052'}}>{p.descripcion_corta}</p>
                <div className="flex items-center justify-between pt-3 border-t" style={{borderColor:'#ede8da'}}>
                  <span className="font-display font-bold text-lg" style={{color:'#5C6B3A'}}>
                    ${Number(p.precio).toLocaleString('es-CO')}
                  </span>
                  {p.calificacion_promedio > 0 && (
                    <span className="flex items-center gap-1 text-xs font-body" style={{color:'#C8874A'}}>
                      <Star size={11} fill="currentColor" /> {Number(p.calificacion_promedio).toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-8 md:hidden">
          <Link to="/tienda" className="inline-flex items-center gap-2 font-body font-semibold px-6 py-3 text-sm" style={{background:'#1E2E1A', color:'#F5F0E1'}}>
            Ver todos los productos <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  );
};

// ── CTA CONTACTO ──────────────────────────────────────────
const CtaContacto = () => (
  <section style={{background:'#5C6B3A', padding:'4rem 0'}}>
    <div className="max-w-5xl mx-auto px-6 text-center">
      <h2 className="font-display font-bold mb-3" style={{fontSize:'clamp(1.5rem,2.5vw,2rem)', color:'#F5F0E1'}}>
        Conecta con Yerbateras
      </h2>
      <p className="font-body mb-8" style={{color:'#c8dfc0', fontSize:'1rem', maxWidth:'500px', margin:'0 auto 2rem'}}>
        Siguenos en redes sociales o escribenos directamente para conocer nuestros productos y talleres.
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        <a href={INSTAGRAM} target="_blank" rel="noreferrer"
          className="inline-flex items-center gap-2.5 font-body font-semibold text-sm px-6 py-3 transition-all duration-200 border"
          style={{background:'transparent', color:'#F5F0E1', borderColor:'rgba(245,240,225,0.3)'}}>
          <Instagram size={17} /> @yerbaterass
        </a>
        <a href={FACEBOOK} target="_blank" rel="noreferrer"
          className="inline-flex items-center gap-2.5 font-body font-semibold text-sm px-6 py-3 transition-all duration-200 border"
          style={{background:'transparent', color:'#F5F0E1', borderColor:'rgba(245,240,225,0.3)'}}>
          <Facebook size={17} /> Facebook
        </a>
        <a href={WHATSAPP} target="_blank" rel="noreferrer"
          className="inline-flex items-center gap-2.5 font-body font-semibold text-sm px-6 py-3 transition-all duration-200"
          style={{background:'#C8874A', color:'#1E2E1A'}}>
          <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          Escribenos por WhatsApp
        </a>
      </div>
    </div>
  </section>
);


// ── CARRUSEL BOTANICO ─────────────────────────────────────
const Carrusel = () => {
  const [cur, setCur]     = useState(0);
  const [paused, setPaused] = useState(false);
  const AUTO_MS = 5000;
  const TOTAL   = 5;

  // Auto-avance
  useEffect(() => {
    if (paused) return;
    const t = setTimeout(() => setCur(c => (c + 1) % TOTAL), AUTO_MS);
    return () => clearTimeout(t);
  }, [cur, paused]);

  const move  = (dir) => setCur(c => (c + dir + TOTAL) % TOTAL);
  const goTo  = (i)   => setCur(i);

  // Touch
  const touchRef = { x: 0 };
  const onTouchStart = (e) => { touchRef.x = e.touches[0].clientX; };
  const onTouchEnd   = (e) => {
    const diff = touchRef.x - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) move(diff > 0 ? 1 : -1);
  };

  const slides = [
    {
      bg: 'linear-gradient(160deg,#1E2E1A 0%,#2d4a22 60%,#1a3518 100%)',
      tag: 'Certificacion INVIMA',
      title: <>El poder curativo<br /><em style={{color:'#C8874A'}}>de las plantas</em></>,
      desc: 'Elaboramos productos herbales artesanales con plantas medicinales seleccionadas por sus propiedades terapeuticas. Mas de 10 anos recuperando saberes ancestrales.',
      cta: { label:'Conocer mas', href:'#nosotros', gold: true },
      deco: (
        <>
          <svg style={{position:'absolute',top:-30,right:-20,width:260,height:260,opacity:0.08,transform:'rotate(20deg)',pointerEvents:'none'}} viewBox="0 0 200 200">
            <path d="M100 10 Q160 10 180 80 Q200 150 100 190 Q0 150 20 80 Q40 10 100 10Z" fill="#5C6B3A"/>
            <path d="M100 10 L100 190" stroke="#8fa882" strokeWidth="1.5" fill="none" strokeDasharray="4 4"/>
            <path d="M100 50 Q70 60 50 90" stroke="#8fa882" strokeWidth="0.8" fill="none"/>
            <path d="M100 80 Q130 90 150 120" stroke="#8fa882" strokeWidth="0.8" fill="none"/>
            <path d="M100 110 Q65 120 45 145" stroke="#8fa882" strokeWidth="0.8" fill="none"/>
          </svg>
          <svg style={{position:'absolute',bottom:-40,left:-10,width:200,height:200,opacity:0.06,pointerEvents:'none'}} viewBox="0 0 200 200">
            <ellipse cx="100" cy="100" rx="70" ry="95" fill="#3d5a35"/>
            <line x1="100" y1="10" x2="100" y2="190" stroke="#5C6B3A" strokeWidth="1.2"/>
          </svg>
        </>
      ),
    },
    {
      bg: '#162210',
      tag: 'Linea de productos',
      title: <>Aceites, tinturas<br /><em style={{color:'#8fa882'}}>y mucho mas</em></>,
      desc: 'Aceites esenciales, pomadas, banos herbales, tinturas, perfumes botanicos e infusiones. Cada producto elaborado a mano con ingredientes 100% naturales.',
      extra: (
        <div style={{display:'flex',gap:8,justifyContent:'center',flexWrap:'wrap',marginBottom:20}}>
          {['Aceites','Pomadas','Tinturas','Infusiones','Banos herbales'].map(p => (
            <span key={p} style={{fontFamily:'Georgia,serif',fontSize:'0.72rem',color:'#8fa882',border:'1px solid rgba(143,168,130,0.3)',padding:'3px 10px',letterSpacing:'0.05em'}}>{p}</span>
          ))}
        </div>
      ),
      cta: { label:'Ver tienda', href:'/tienda', gold: false },
      deco: (
        <svg style={{position:'absolute',top:20,left:-30,width:240,height:240,opacity:0.07,transform:'rotate(-10deg)',pointerEvents:'none'}} viewBox="0 0 200 200">
          <path d="M30 180 Q80 20 160 30 Q200 35 170 100 Q140 160 30 180Z" fill="#C8874A"/>
        </svg>
      ),
    },
    {
      bg: 'linear-gradient(135deg,#1E2E1A 0%,#3d5a35 100%)',
      tag: 'El equipo',
      title: <>Estefania Pineros<br /></>,
      desc: 'Herbolaria y fundadora. Mas de 10 anos investigando plantas medicinales, elaborando productos naturales y facilitando talleres sobre autocuidado y saberes ancestrales.',
      extraLeft: true,
      cta: { label:'Conocer el equipo', href:'#equipo', gold: true },
      deco: (
        <div style={{position:'absolute',right:'8%',top:'50%',transform:'translateY(-50%)',width:160,height:160,borderRadius:'50%',border:'1px solid rgba(200,135,74,0.2)',display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'none'}}>
          <div style={{width:120,height:120,borderRadius:'50%',border:'1px solid rgba(200,135,74,0.15)',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <div style={{width:76,height:76,background:'rgba(200,135,74,0.12)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <span style={{fontFamily:'Georgia,serif',fontSize:'2rem',fontWeight:'bold',color:'#C8874A',fontStyle:'italic'}}>E</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      bg: '#111e0f',
      tag: 'Calidad garantizada',
      title: <>Certificacion<br /><em style={{color:'#C8874A'}}>INVIMA</em></>,
      desc: 'Todos nuestros productos cuentan con registro sanitario INVIMA. Elaboracion artesanal con los mas altos estandares de calidad, seguridad y eficacia.',
      extra: (
        <div style={{display:'flex',gap:28,justifyContent:'center',marginBottom:24}}>
          {[['10+','Anos'],['100%','Natural'],['INVIMA','Cert.']].map(([n,l]) => (
            <div key={l} style={{textAlign:'center'}}>
              <div style={{fontFamily:'Georgia,serif',fontSize:'1.4rem',fontWeight:'bold',color:'#C8874A'}}>{n}</div>
              <div style={{fontFamily:'Georgia,serif',fontSize:'0.68rem',color:'#5a7052',letterSpacing:'0.06em',textTransform:'uppercase',marginTop:2}}>{l}</div>
            </div>
          ))}
        </div>
      ),
      cta: { label:'Ver certificaciones', href:'#nosotros', gold: true },
      deco: (
        <svg style={{position:'absolute',left:'50%',top:'50%',transform:'translate(-50%,-50%)',width:420,height:420,opacity:0.04,pointerEvents:'none'}} viewBox="0 0 400 400">
          <circle cx="200" cy="200" r="180" stroke="#F5F0E1" strokeWidth="1" fill="none"/>
          <circle cx="200" cy="200" r="130" stroke="#F5F0E1" strokeWidth="0.8" fill="none" strokeDasharray="6 6"/>
          <circle cx="200" cy="200" r="80" stroke="#F5F0E1" strokeWidth="0.6" fill="none"/>
        </svg>
      ),
    },
    {
      bg: 'linear-gradient(160deg,#2d4a22 0%,#1E2E1A 100%)',
      tag: 'Conecta con nosotras',
      title: <>Escribenos<br /><em style={{color:'#C8874A'}}>cuando quieras</em></>,
      desc: 'Siguenos en redes sociales o escribenos directamente. Estamos aqui para orientarte sobre nuestros productos, talleres y todo lo relacionado con las plantas medicinales.',
      extra: (
        <div style={{display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap',marginBottom:20}}>
          <a href="https://www.instagram.com/yerbaterass/" target="_blank" rel="noreferrer"
            style={{display:'inline-flex',alignItems:'center',gap:8,padding:'9px 18px',border:'1px solid rgba(245,240,225,0.25)',color:'#F5F0E1',fontFamily:'Georgia,serif',fontSize:'0.8rem',textDecoration:'none'}}>
            <Instagram size={15}/> @yerbaterass
          </a>
          <a href="https://wa.me/573102631592" target="_blank" rel="noreferrer"
            style={{display:'inline-flex',alignItems:'center',gap:8,padding:'9px 18px',background:'#C8874A',color:'#1E2E1A',fontFamily:'Georgia,serif',fontSize:'0.8rem',fontWeight:'bold',textDecoration:'none'}}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            WhatsApp
          </a>
        </div>
      ),
      cta: null,
      deco: (
        <>
          <svg style={{position:'absolute',top:0,right:0,width:240,height:240,opacity:0.05,transform:'rotate(45deg)',pointerEvents:'none'}} viewBox="0 0 200 200">
            <path d="M100 0 Q200 0 200 100 Q200 200 100 200 Q0 200 0 100 Q0 0 100 0Z" fill="#C8874A"/>
          </svg>
          <svg style={{position:'absolute',bottom:0,left:0,width:160,height:160,opacity:0.05,pointerEvents:'none'}} viewBox="0 0 150 150">
            <path d="M0 150 Q0 0 150 0 L0 0Z" fill="#8fa882"/>
          </svg>
        </>
      ),
    },
  ];

  const thumbs = [
    { label:'Inicio',    icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg> },
    { label:'Productos', icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg> },
    { label:'Fundadora', icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
    { label:'INVIMA',    icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> },
    { label:'Contacto',  icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg> },
  ];

  const s = slides[cur];

  return (
    <section style={{background:'#1E2E1A', overflow:'hidden', border:'none'}}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}>

      {/* Barra de progreso */}
      <div style={{height:2, background:'rgba(245,240,225,0.06)', position:'relative'}}>
        <div key={cur} style={{
          position:'absolute', left:0, top:0, height:'100%', background:'#C8874A',
          animation: paused ? 'none' : `progress-fill ${AUTO_MS}ms linear forwards`,
        }}/>
        <style>{`@keyframes progress-fill{from{width:0%}to{width:100%}}`}</style>
      </div>

      {/* Slide principal */}
      <div style={{position:'relative', minHeight:440, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', padding:'4rem 2rem'}}>
        {/* Fondo */}
        <div style={{position:'absolute', inset:0, background:s.bg, transition:'background 0.6s ease'}} />

        {/* Decoraciones botanicas */}
        {s.deco}

        {/* Lineas laterales doradas */}
        <div style={{position:'absolute', left:60, top:'50%', transform:'translateY(-50%)', width:1, height:50, background:'linear-gradient(180deg,transparent,#C8874A,transparent)', opacity:0.4}} />
        <div style={{position:'absolute', right:60, top:'50%', transform:'translateY(-50%)', width:1, height:50, background:'linear-gradient(180deg,transparent,#C8874A,transparent)', opacity:0.4}} />

        {/* Contenido */}
        <div style={{
          position:'relative', zIndex:2, textAlign: s.extraLeft ? 'left' : 'center',
          maxWidth:520, padding: s.extraLeft ? '0 0 0 48px' : '0 2rem',
          marginLeft: s.extraLeft ? 0 : 'auto',
          marginRight: s.extraLeft ? 'auto' : 'auto',
          transition:'opacity 0.4s ease',
        }}>
          {/* Tag */}
          <div style={{display:'inline-flex', alignItems:'center', gap:7, padding:'4px 14px', border:'1px solid rgba(200,135,74,0.45)', color:'#C8874A', fontFamily:'Georgia,serif', fontSize:'0.7rem', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:16}}>
            <div style={{width:5, height:5, borderRadius:'50%', background:'#C8874A'}} />
            {s.tag}
          </div>

          {/* Titulo */}
          <h2 style={{fontFamily:'Georgia,serif', fontWeight:'bold', fontSize:'clamp(1.6rem,3.5vw,2.4rem)', color:'#F5F0E1', lineHeight:1.2, margin:'0 0 14px'}}>
            {s.title}
          </h2>

          {/* Linea */}
          {s.extraLeft && <div style={{width:36, height:2, background:'#C8874A', margin:'0 0 16px'}} />}

          {/* Descripcion */}
          <p style={{fontFamily:'Georgia,serif', fontSize:'0.9rem', lineHeight:1.8, color:'#a8b8a0', margin:'0 0 20px', maxWidth:440}}>
            {s.desc}
          </p>

          {/* Extra (tags, stats, links) */}
          {s.extra}

          {/* CTA */}
          {s.cta && (
            <Link to={s.cta.href}
              style={{
                display:'inline-flex', alignItems:'center', gap:8,
                padding:'10px 24px', textDecoration:'none',
                fontFamily:'Georgia,serif', fontSize:'0.85rem', fontWeight:'bold', letterSpacing:'0.04em',
                background: s.cta.gold ? '#C8874A' : 'transparent',
                color: s.cta.gold ? '#1E2E1A' : '#F5F0E1',
                border: s.cta.gold ? 'none' : '1px solid rgba(245,240,225,0.3)',
              }}>
              {s.cta.label} &rarr;
            </Link>
          )}
        </div>
      </div>

      {/* Controles flechas */}
      {[{dir:-1, side:'left', path:'M15 18l-6-6 6-6'}, {dir:1, side:'right', path:'M9 18l6-6-6-6'}].map(({dir, side, path}) => (
        <button key={side} onClick={() => move(dir)} aria-label={dir === -1 ? 'Anterior' : 'Siguiente'}
          style={{
            position:'absolute', top:'45%', [side]: 16, transform:'translateY(-50%)',
            width:38, height:38, background:'rgba(245,240,225,0.07)',
            border:'1px solid rgba(245,240,225,0.18)', cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center', zIndex:10,
            transition:'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background='rgba(200,135,74,0.22)'; e.currentTarget.style.borderColor='rgba(200,135,74,0.5)'; }}
          onMouseLeave={e => { e.currentTarget.style.background='rgba(245,240,225,0.07)'; e.currentTarget.style.borderColor='rgba(245,240,225,0.18)'; }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#F5F0E1" strokeWidth="2" strokeLinecap="round"><path d={path}/></svg>
        </button>
      ))}

      {/* Dots */}
      <div style={{display:'flex', justifyContent:'center', gap:7, padding:'12px 0 4px', position:'relative', zIndex:5}}>
        {slides.map((_, i) => (
          <button key={i} onClick={() => goTo(i)} aria-label={`Diapositiva ${i+1}`}
            style={{
              width: i === cur ? 22 : 7, height:7, padding:0,
              borderRadius: i === cur ? 4 : '50%',
              background: i === cur ? '#C8874A' : 'rgba(245,240,225,0.25)',
              border:'none', cursor:'pointer', transition:'all 0.35s ease',
            }} />
        ))}
      </div>

      {/* Miniaturas / Tabs */}
      <div style={{display:'flex', borderTop:'1px solid rgba(245,240,225,0.06)'}}>
        {thumbs.map((t, i) => (
          <button key={i} onClick={() => goTo(i)}
            style={{
              flex:1, padding:'11px 8px', background: i === cur ? 'rgba(200,135,74,0.09)' : 'transparent',
              border:'none', borderTop: i === cur ? '2px solid #C8874A' : '2px solid transparent',
              cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:4, transition:'all 0.2s',
            }}>
            <span style={{color: i === cur ? '#C8874A' : '#5a7052', transition:'color 0.2s', lineHeight:0}}>
              {t.icon}
            </span>
            <span style={{fontFamily:'Georgia,serif', fontSize:'0.68rem', color: i === cur ? '#C8874A' : '#5a7052', letterSpacing:'0.05em', whiteSpace:'nowrap'}}>
              {t.label}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
};

export default function Landing() {
  return (
    <>
      <Hero />
      <Confianza />
      <Carrusel />
      <Nosotros />
      <PorQue />
      <Equipo />
      <ProductosDestacados />
      <CtaContacto />
    </>
  );
}