import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Menu, X, LogOut, Settings, Leaf } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

export default function Navbar() {
  const { usuario, logout, esAdmin } = useAuth();
  const { cantidadTotal, setAbierto } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const handleLogout = () => { logout(); navigate('/'); setUserMenu(false); };

  return (
    <nav style={{
      position:'fixed', top:0, left:0, right:0, zIndex:50,
      background: scrolled ? '#1E2E1A' : 'rgba(30,46,26,0.96)',
      backdropFilter: 'blur(8px)',
      borderBottom: scrolled ? '1px solid rgba(200,135,74,0.2)' : '1px solid transparent',
      transition: 'all 0.3s ease'
    }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div style={{width:32, height:32, background:'#C8874A', display:'flex', alignItems:'center', justifyContent:'center'}}>
            <span style={{fontFamily:'Georgia,serif', fontWeight:'bold', color:'#1E2E1A', fontSize:'0.9rem', fontStyle:'italic'}}>Y</span>
          </div>
          <span style={{fontFamily:'Georgia,serif', fontWeight:'bold', color:'#F5F0E1', fontSize:'1.15rem', letterSpacing:'0.05em'}}>
            Yerbateras
          </span>
        </Link>

        {/* Nav links — desktop */}
        <div className="hidden md:flex items-center gap-8">
          {[['/', 'Inicio'], ['/tienda', 'Tienda'], ['/#nosotros', 'Nosotros'], ['/#equipo', 'El equipo']].map(([to, label]) => (
            <a key={to} href={to}
              style={{color:'#c8bfa8', fontFamily:'Georgia,serif', fontSize:'0.85rem', letterSpacing:'0.04em', transition:'color 0.2s'}}
              onMouseEnter={e => e.target.style.color='#C8874A'}
              onMouseLeave={e => e.target.style.color='#c8bfa8'}>
              {label}
            </a>
          ))}
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-3">
          {/* Carrito */}
          {usuario && (
            <button onClick={() => setAbierto(true)} style={{position:'relative', padding:'6px', color:'#c8bfa8', background:'none', border:'none', cursor:'pointer'}}>
              <ShoppingCart size={20} />
              {cantidadTotal > 0 && (
                <span style={{
                  position:'absolute', top:-2, right:-2,
                  background:'#C8874A', color:'#1E2E1A',
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
                <div style={{width:22, height:22, background:'#C8874A', display:'flex', alignItems:'center', justifyContent:'center'}}>
                  <span style={{color:'#1E2E1A', fontSize:'0.7rem', fontWeight:'bold'}}>{usuario.nombre?.[0]?.toUpperCase()}</span>
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
                      style={{display:'flex', alignItems:'center', gap:10, padding:'10px 16px', color:'#2d4a22', fontFamily:'Georgia,serif', fontSize:'0.85rem', textDecoration:'none'}}
                      onMouseEnter={e => e.currentTarget.style.background='#f5f0e1'}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                      <Settings size={14} /> Panel Admin
                    </Link>
                  )}
                  <Link to="/mis-pedidos" onClick={() => setUserMenu(false)}
                    style={{display:'flex', alignItems:'center', gap:10, padding:'10px 16px', color:'#2d4a22', fontFamily:'Georgia,serif', fontSize:'0.85rem', textDecoration:'none'}}
                    onMouseEnter={e => e.currentTarget.style.background='#f5f0e1'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                    <ShoppingCart size={14} /> Mis pedidos
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
              style={{background:'#C8874A', color:'#1E2E1A', padding:'8px 20px', fontFamily:'Georgia,serif', fontWeight:'bold', fontSize:'0.85rem', letterSpacing:'0.03em', textDecoration:'none', display:'inline-block'}}>
              Ingresar
            </Link>
          )}

          {/* Menu movil */}
          <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}
            style={{padding:'6px', color:'#c8bfa8', background:'none', border:'none', cursor:'pointer'}}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Menu movil */}
      {menuOpen && (
        <div style={{background:'#1E2E1A', borderTop:'1px solid rgba(200,135,74,0.2)', padding:'8px 24px 16px'}}>
          {[['/', 'Inicio'], ['/tienda', 'Tienda'], ['/#nosotros', 'Nosotros'], ['/#equipo', 'El equipo']].map(([to, label]) => (
            <a key={to} href={to} onClick={() => setMenuOpen(false)}
              style={{display:'block', padding:'12px 0', color:'#c8bfa8', fontFamily:'Georgia,serif', fontSize:'0.9rem', borderBottom:'1px solid rgba(245,240,225,0.06)', textDecoration:'none'}}>
              {label}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
}
