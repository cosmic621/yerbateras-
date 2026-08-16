import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Menu, X, LogOut, Settings, Search, Truck, ShieldCheck, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

export default function Navbar() {
  const { usuario, logout, esAdmin } = useAuth();
  const { cantidadTotal, setAbierto } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const handleLogout = () => { logout(); navigate('/'); setUserMenu(false); };

  const handleBuscar = (e) => {
    e.preventDefault();
    navigate(`/tienda${busqueda.trim() ? `?buscar=${encodeURIComponent(busqueda.trim())}` : ''}`);
    setMenuOpen(false);
  };

  return (
    <div style={{position:'fixed', top:0, left:0, right:0, zIndex:50}}>
      {/* Barra de anuncios */}
      <div style={{background:'#146b42', padding:'6px 0'}}>
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-center gap-6 flex-wrap">
          <span style={{display:'flex', alignItems:'center', gap:6, color:'#d6f0e2', fontFamily:'Georgia,serif', fontSize:'0.72rem', letterSpacing:'0.03em'}}>
            <Truck size={12} /> Envíos a toda Colombia
          </span>
          <span style={{display:'flex', alignItems:'center', gap:6, color:'#d6f0e2', fontFamily:'Georgia,serif', fontSize:'0.72rem', letterSpacing:'0.03em'}}>
            <ShieldCheck size={12} /> Certificación INVIMA en todos los productos
          </span>
        </div>
      </div>

      <nav style={{
        background: scrolled ? '#052a1c' : 'rgba(30,46,26,0.97)',
        backdropFilter: 'blur(8px)',
        borderBottom: scrolled ? '1px solid rgba(200,135,74,0.2)' : '1px solid transparent',
        transition: 'all 0.3s ease'
      }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-12 h-16 flex items-center gap-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group shrink-0">
          <div style={{width:32, height:32, background:'#e0a83e', display:'flex', alignItems:'center', justifyContent:'center'}}>
            <span style={{fontFamily:'Georgia,serif', fontWeight:'bold', color:'#052a1c', fontSize:'0.9rem', fontStyle:'italic'}}>Y</span>
          </div>
          <span style={{fontFamily:'Georgia,serif', fontWeight:'bold', color:'#F5F0E1', fontSize:'1.15rem', letterSpacing:'0.05em'}} className="hidden sm:inline">
            Yerbateras
          </span>
        </Link>

        {/* Nav links — desktop */}
        <div className="hidden lg:flex items-center gap-6 shrink-0">
          {[['/', 'Inicio'], ['/botiquin', 'Botiquín'], ['/nosotros', 'Nosotros'], ['/citas', 'Agendar cita']].map(([to, label]) => (
            <a key={to} href={to}
              style={{color:'#a8dec0', fontFamily:'Georgia,serif', fontSize:'0.83rem', letterSpacing:'0.03em', transition:'color 0.2s', whiteSpace:'nowrap'}}
              onMouseEnter={e => e.target.style.color='#e0a83e'}
              onMouseLeave={e => e.target.style.color='#a8dec0'}>
              {label}
            </a>
          ))}
        </div>

        {/* Buscador */}
        <form onSubmit={handleBuscar} className="hidden md:flex flex-1 max-w-md" style={{position:'relative'}}>
          <input
            type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar productos..."
            style={{
              width:'100%', padding:'8px 40px 8px 14px', background:'rgba(245,240,225,0.08)',
              border:'1px solid rgba(245,240,225,0.15)', color:'#F5F0E1', fontFamily:'Georgia,serif',
              fontSize:'0.85rem', outline:'none',
            }}
          />
          <button type="submit" aria-label="Buscar" style={{position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#6ec194', cursor:'pointer'}}>
            <Search size={16} />
          </button>
        </form>

        {/* Acciones */}
        <div className="flex items-center gap-3 ml-auto lg:ml-0 shrink-0">
          {/* Carrito */}
          {usuario && (
            <button onClick={() => setAbierto(true)} style={{position:'relative', padding:'6px', color:'#a8dec0', background:'none', border:'none', cursor:'pointer'}}>
              <ShoppingCart size={20} />
              {cantidadTotal > 0 && (
                <span style={{
                  position:'absolute', top:-2, right:-2,
                  background:'#e0a83e', color:'#052a1c',
                  fontSize:'0.65rem', fontWeight:'bold',
                  width:18, height:18, borderRadius:'50%',
                  display:'flex', alignItems:'center', justifyContent:'center'
                }}>
                  {cantidadTotal > 9 ? '9+' : cantidadTotal}
                </span>
              )}
            </button>
          )}

          {/* Usuario */}
          {usuario ? (
            <div style={{position:'relative'}}>
              <button onClick={() => setUserMenu(!userMenu)}
                style={{display:'flex', alignItems:'center', gap:8, border:'1px solid rgba(200,135,74,0.3)', padding:'6px 12px', background:'none', cursor:'pointer'}}>
                <div style={{width:22, height:22, background:'#e0a83e', display:'flex', alignItems:'center', justifyContent:'center'}}>
                  <span style={{color:'#052a1c', fontSize:'0.7rem', fontWeight:'bold'}}>{usuario.nombre?.[0]?.toUpperCase()}</span>
                </div>
                <span style={{color:'#F5F0E1', fontFamily:'Georgia,serif', fontSize:'0.85rem'}} className="hidden sm:block">
                  {usuario.nombre?.split(' ')[0]}
                </span>
              </button>
              {userMenu && (
                <div style={{
                  position:'absolute', right:0, top:'calc(100% + 4px)',
                  width:200, background:'white',
                  border:'1px solid #ddd6c2', boxShadow:'0 8px 24px rgba(0,0,0,0.12)',
                  zIndex:60, padding:'4px 0'
                }}>
                  {esAdmin && (
                    <Link to="/admin" onClick={() => setUserMenu(false)}
                      style={{display:'flex', alignItems:'center', gap:10, padding:'10px 16px', color:'#0a3d28', fontFamily:'Georgia,serif', fontSize:'0.85rem', textDecoration:'none'}}
                      onMouseEnter={e => e.currentTarget.style.background='#F5F0E1'}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                      <Settings size={14} /> Panel Admin
                    </Link>
                  )}
                  <Link to="/mis-pedidos" onClick={() => setUserMenu(false)}
                    style={{display:'flex', alignItems:'center', gap:10, padding:'10px 16px', color:'#0a3d28', fontFamily:'Georgia,serif', fontSize:'0.85rem', textDecoration:'none'}}
                    onMouseEnter={e => e.currentTarget.style.background='#F5F0E1'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                    <ShoppingCart size={14} /> Mis pedidos
                  </Link>
                  <Link to="/mis-citas" onClick={() => setUserMenu(false)}
                    style={{display:'flex', alignItems:'center', gap:10, padding:'10px 16px', color:'#0a3d28', fontFamily:'Georgia,serif', fontSize:'0.85rem', textDecoration:'none'}}
                    onMouseEnter={e => e.currentTarget.style.background='#F5F0E1'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                    <Calendar size={14} /> Mis citas
                  </Link>
                  <div style={{borderTop:'1px solid #ddd6c2', margin:'4px 0'}} />
                  <button onClick={handleLogout}
                    style={{display:'flex', alignItems:'center', gap:10, padding:'10px 16px', color:'#c0392b', fontFamily:'Georgia,serif', fontSize:'0.85rem', background:'none', border:'none', cursor:'pointer', width:'100%', textAlign:'left'}}
                    onMouseEnter={e => e.currentTarget.style.background='#fef5f5'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                    <LogOut size={14} /> Cerrar sesion
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login"
              style={{background:'#e0a83e', color:'#052a1c', padding:'8px 20px', fontFamily:'Georgia,serif', fontWeight:'bold', fontSize:'0.85rem', letterSpacing:'0.03em', textDecoration:'none', display:'inline-block', whiteSpace:'nowrap'}}>
              Ingresar
            </Link>
          )}

          {/* Menu movil */}
          <button className="lg:hidden" onClick={() => setMenuOpen(!menuOpen)}
            style={{padding:'6px', color:'#a8dec0', background:'none', border:'none', cursor:'pointer'}}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Menu movil */}
      {menuOpen && (
        <div style={{background:'#052a1c', borderTop:'1px solid rgba(200,135,74,0.2)', padding:'16px 24px'}}>
          <form onSubmit={handleBuscar} style={{position:'relative', marginBottom:12}}>
            <input
              type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar productos..."
              style={{width:'100%', padding:'10px 40px 10px 14px', background:'rgba(245,240,225,0.08)', border:'1px solid rgba(245,240,225,0.15)', color:'#F5F0E1', fontFamily:'Georgia,serif', fontSize:'0.85rem', outline:'none', boxSizing:'border-box'}}
            />
            <button type="submit" aria-label="Buscar" style={{position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#6ec194', cursor:'pointer'}}>
              <Search size={16} />
            </button>
          </form>
          {[['/', 'Inicio'], ['/botiquin', 'Botiquín'], ['/nosotros', 'Nosotros'], ['/citas', 'Agendar cita']].map(([to, label]) => (
            <a key={to} href={to} onClick={() => setMenuOpen(false)}
              style={{display:'block', padding:'12px 0', color:'#a8dec0', fontFamily:'Georgia,serif', fontSize:'0.9rem', borderBottom:'1px solid rgba(245,240,225,0.06)', textDecoration:'none'}}>
              {label}
            </a>
          ))}
        </div>
      )}
      </nav>
    </div>
  );
}
