import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, Users, BarChart3, LogOut, Menu, X, ExternalLink, Calendar, Tag, MessageSquare, Ticket, Heart, GitBranch, ToggleRight, GraduationCap, CalendarDays, Images, Star } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const links = [
  { to: '/admin',              icon: LayoutDashboard, label: 'Dashboard'         },
  { to: '/admin/carrusel',     icon: Images,          label: 'Carrusel (portada)' },
  { to: '/admin/destacados',   icon: Star,            label: 'Destacados y promos' },
  { to: '/admin/secciones',    icon: ToggleRight,     label: 'Secciones y temporadas' },
  { to: '/admin/productos',    icon: Package,         label: 'Productos y kits'  },
  { to: '/admin/categorias',   icon: Tag,             label: 'Tipos de prep.'    },
  { to: '/admin/lineas-cuidado', icon: Heart,         label: 'Líneas de cuidado' },
  { to: '/admin/botiquin',     icon: GitBranch,       label: 'Botiquín'          },
  { to: '/admin/inventario',   icon: BarChart3,        label: 'Inventario'       },
  { to: '/admin/pedidos',      icon: ShoppingBag,      label: 'Pedidos'          },
  { to: '/admin/citas',        icon: Calendar,         label: 'Citas / masajes'  },
  { to: '/admin/talleres',     icon: GraduationCap,    label: 'Talleres'         },
  { to: '/admin/eventos',      icon: CalendarDays,     label: 'Eventos'          },
  { to: '/admin/resenas',      icon: MessageSquare,    label: 'Reseñas'          },
  { to: '/admin/cupones',      icon: Ticket,           label: 'Cupones'          },
  { to: '/admin/usuarios',     icon: Users,            label: 'Clientes'         },
];

const S = {
  sidebar: {
    width: 220,
    minHeight: '100vh',
    background: '#0f3c27',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    borderRight: '1px solid rgba(200,135,74,0.15)',
  },
  logoWrap: {
    padding: '20px 20px 16px',
    borderBottom: '1px solid rgba(245,240,225,0.06)',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  logoBox: {
    width: 32, height: 32,
    background: '#c6a15b',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  nav: { flex: 1, padding: '12px 10px' },
  footer: {
    padding: '12px 10px',
    borderTop: '1px solid rgba(245,240,225,0.06)',
  },
};

const NavLink = ({ to, icon: Icon, label, active }) => (
  <Link to={to} style={{
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '9px 12px', marginBottom: 2, textDecoration: 'none',
    borderRadius: 6, transition: 'all 0.15s',
    background: active ? '#c6a15b' : 'transparent',
    color: active ? '#0f3c27' : '#9dbfa9',
    fontFamily: 'var(--font-marca)', fontSize: '0.84rem',
    fontWeight: active ? 'bold' : 'normal',
  }}
  onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(245,240,225,0.06)'; e.currentTarget.style.color = '#f6f3eb'; }}}
  onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9dbfa9'; }}}>
    <Icon size={16} />
    {label}
  </Link>
);

export default function AdminSidebar({ children }) {
  const { pathname } = useLocation();
  const { logout, usuario } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };

  const SidebarContent = () => (
    <div style={S.sidebar}>
      {/* Logo */}
      <div style={S.logoWrap}>
        <div style={S.logoBox}>
          <span style={{ fontFamily:'var(--font-marca)', fontWeight:'bold', color:'#0f3c27', fontStyle:'italic', fontSize:'0.9rem' }}>Y</span>
        </div>
        <div>
          <p style={{ fontFamily:'var(--font-marca)', fontWeight:'bold', color:'#f6f3eb', fontSize:'0.9rem', margin:0, lineHeight:1.2 }}>Yerbateras</p>
          <p style={{ fontFamily:'var(--font-marca)', fontSize:'0.7rem', color:'#2f6549', margin:0 }}>Panel Admin</p>
        </div>
      </div>

      {/* Nav */}
      <nav style={S.nav}>
        <p style={{ fontFamily:'var(--font-marca)', fontSize:'0.65rem', color:'#16422e', letterSpacing:'0.1em', textTransform:'uppercase', padding:'8px 12px 6px', margin:0 }}>
          Menu
        </p>
        {links.map(l => (
          <NavLink key={l.to} {...l} active={pathname === l.to} />
        ))}
      </nav>

      {/* Footer */}
      <div style={S.footer}>
        <Link to="/" target="_blank"
          style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', color:'#2f6549', fontFamily:'var(--font-marca)', fontSize:'0.8rem', textDecoration:'none', marginBottom:4 }}
          onMouseEnter={e => e.currentTarget.style.color = '#9dbfa9'}
          onMouseLeave={e => e.currentTarget.style.color = '#2f6549'}>
          <ExternalLink size={14} /> Ver sitio
        </Link>
        <button onClick={handleLogout}
          style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', color:'#c0392b', fontFamily:'var(--font-marca)', fontSize:'0.8rem', background:'none', border:'none', cursor:'pointer', width:'100%' }}
          onMouseEnter={e => e.currentTarget.style.color = '#e74c3c'}
          onMouseLeave={e => e.currentTarget.style.color = '#c0392b'}>
          <LogOut size={14} /> Cerrar sesion
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#fbfaf6' }}>
      {/* Sidebar desktop */}
      <div className="hidden md:flex" style={{ position:'sticky', top:0, height:'100vh' }}>
        <SidebarContent />
      </div>

      {/* Overlay movil */}
      {open && (
        <div onClick={() => setOpen(false)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:40 }} />
      )}
      {open && (
        <div style={{ position:'fixed', left:0, top:0, height:'100%', zIndex:50 }}>
          <SidebarContent />
        </div>
      )}

      {/* Main */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
        {/* Top bar */}
        <header style={{
          background: 'white',
          borderBottom: '1px solid #ebe7dc',
          padding: '0 24px',
          height: 56,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 20,
        }}>
          <button className="md:hidden" onClick={() => setOpen(!open)}
            style={{ background:'none', border:'none', cursor:'pointer', color:'#2f6549' }}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div style={{ flex:1 }} />
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontFamily:'var(--font-marca)', fontSize:'0.82rem', color:'#2f6549' }} className="hidden sm:block">
              {usuario?.nombre}
            </span>
            <div style={{
              width: 32, height: 32, background: '#0f3c27',
              borderRadius: '50%', display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              <span style={{ color:'#c6a15b', fontFamily:'var(--font-marca)', fontWeight:'bold', fontSize:'0.85rem' }}>
                {usuario?.nombre?.[0]?.toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        {/* Contenido */}
        <main style={{ flex:1, padding:'28px 28px', overflowAuto:'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
