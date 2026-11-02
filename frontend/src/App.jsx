import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { SiteProvider, useSite } from './context/SiteContext';

// Paginas
import Nosotros       from './pages/Nosotros';
import Inicio         from './pages/Inicio';
import Temporada      from './pages/Temporada';
import Eventos        from './pages/Eventos';
import Talleres       from './pages/Talleres';
import Tienda         from './pages/Tienda';
import Producto       from './pages/Producto';
import Citas          from './pages/Citas';
import Checkout       from './pages/Checkout';
import CheckoutExito  from './pages/CheckoutExito';
import Seguimiento    from './pages/Seguimiento';
import CitaGestion    from './pages/CitaGestion';
import Contacto       from './pages/Contacto';

import AdminDashboard  from './pages/admin/Dashboard';
import AdminProductos  from './pages/admin/Productos';
import AdminPedidos    from './pages/admin/Pedidos';
import AdminInventario from './pages/admin/Inventario';
import AdminUsuarios   from './pages/admin/Usuarios';
import AdminCitas      from './pages/admin/Citas';
import AdminCategorias from './pages/admin/Categorias';
import AdminLineasCuidado from './pages/admin/LineasCuidado';
import AdminBotiquin    from './pages/admin/Botiquin';
import AdminResenas    from './pages/admin/Resenas';
import AdminCupones    from './pages/admin/Cupones';
import AdminLogin      from './pages/admin/AdminLogin';
import AdminCarrusel   from './pages/admin/Carrusel';
import AdminDestacados from './pages/admin/Destacados';
import AdminSecciones  from './pages/admin/Secciones';
import AdminEventos    from './pages/admin/Eventos';
import AdminTalleres   from './pages/admin/Talleres';

// Layout
import Navbar           from './components/layout/Navbar';
import Footer           from './components/layout/Footer';
import WhatsAppBtn      from './components/layout/WhatsAppBtn';
import CotizacionBtn    from './components/layout/CotizacionBtn';
import HojasTransicion  from './components/layout/HojasTransicion';
import CartDrawer       from './components/shop/CartDrawer';
import AsistenteVirtual from './components/layout/AsistenteVirtual';
import KitModal         from './components/shop/KitModal';

const Spinner = () => (
  <div style={{minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12}}>
    <div style={{width:36, height:36, border:'3px solid #dcd8c9', borderTopColor:'#2f6549', borderRadius:'50%', animation:'spin 0.8s linear infinite'}} />
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    <span style={{fontFamily:'var(--font-marca)', fontSize:'0.85rem', color:'#2f6549'}}>Cargando...</span>
  </div>
);

const AdminRoute = ({ children }) => {
  const { usuario, cargando, esAdmin } = useAuth();
  if (cargando) return <Spinner />;
  // Sin sesión de administrador se muestra el login de admin en la misma URL (/admin...)
  if (!usuario || !esAdmin) return <AdminLogin />;
  return children;
};

// Si el admin apagó una sección, su URL redirige al inicio
const Seccion = ({ clave, children }) => {
  const { activa, cargado } = useSite();
  if (cargado && !activa(clave)) return <Navigate to="/" replace />;
  return children;
};

const MainLayout = ({ children }) => (
  <>
    <HojasTransicion />
    <Navbar />
    <CartDrawer />
    <AsistenteVirtual />
    <WhatsAppBtn />
    <CotizacionBtn />
    <KitModal />
    <main style={{paddingTop:72}}>{children}</main>
    <Footer />
  </>
);

const AdminLayout = ({ children }) => (
  <div style={{minHeight:'100vh', background:'#f5f5f5'}}>{children}</div>
);

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SiteProvider>
        <CartProvider>
          <Routes>
            {/* Publicas */}
            <Route path="/"               element={<MainLayout><Inicio /></MainLayout>} />
            <Route path="/tienda"         element={<MainLayout><Tienda /></MainLayout>} />
            <Route path="/nosotros"       element={<MainLayout><Nosotros /></MainLayout>} />
            <Route path="/botiquin"       element={<Navigate to="/tienda?kit=1" replace />} />
            <Route path="/temporada/:clave" element={<MainLayout><Temporada /></MainLayout>} />
            <Route path="/eventos"         element={<Seccion clave="eventos"><MainLayout><Eventos /></MainLayout></Seccion>} />
            <Route path="/talleres"        element={<Seccion clave="talleres"><MainLayout><Talleres /></MainLayout></Seccion>} />
            <Route path="/tienda/:id"     element={<MainLayout><Producto /></MainLayout>} />
            <Route path="/contacto"        element={<MainLayout><Contacto /></MainLayout>} />
            <Route path="/citas"           element={<Seccion clave="citas"><MainLayout><Citas /></MainLayout></Seccion>} />
            <Route path="/cita/:token"     element={<MainLayout><CitaGestion /></MainLayout>} />

            {/* Compra sin cuenta */}
            <Route path="/checkout"        element={<MainLayout><Checkout /></MainLayout>} />
            <Route path="/checkout/exito"  element={<MainLayout><CheckoutExito /></MainLayout>} />
            <Route path="/pedido"          element={<MainLayout><Seguimiento /></MainLayout>} />

            {/* Admin */}
            <Route path="/admin"            element={<AdminRoute><AdminLayout><AdminDashboard /></AdminLayout></AdminRoute>} />
            <Route path="/admin/productos"  element={<AdminRoute><AdminLayout><AdminProductos /></AdminLayout></AdminRoute>} />
            <Route path="/admin/pedidos"    element={<AdminRoute><AdminLayout><AdminPedidos /></AdminLayout></AdminRoute>} />
            <Route path="/admin/inventario" element={<AdminRoute><AdminLayout><AdminInventario /></AdminLayout></AdminRoute>} />
            <Route path="/admin/usuarios"   element={<AdminRoute><AdminLayout><AdminUsuarios /></AdminLayout></AdminRoute>} />
            <Route path="/admin/citas"      element={<AdminRoute><AdminLayout><AdminCitas /></AdminLayout></AdminRoute>} />
            <Route path="/admin/categorias" element={<AdminRoute><AdminLayout><AdminCategorias /></AdminLayout></AdminRoute>} />
            <Route path="/admin/lineas-cuidado" element={<AdminRoute><AdminLayout><AdminLineasCuidado /></AdminLayout></AdminRoute>} />
            <Route path="/admin/botiquin"   element={<AdminRoute><AdminLayout><AdminBotiquin /></AdminLayout></AdminRoute>} />
            <Route path="/admin/resenas"    element={<AdminRoute><AdminLayout><AdminResenas /></AdminLayout></AdminRoute>} />
            <Route path="/admin/carrusel"   element={<AdminRoute><AdminLayout><AdminCarrusel /></AdminLayout></AdminRoute>} />
            <Route path="/admin/destacados" element={<AdminRoute><AdminLayout><AdminDestacados /></AdminLayout></AdminRoute>} />
            <Route path="/admin/secciones" element={<AdminRoute><AdminLayout><AdminSecciones /></AdminLayout></AdminRoute>} />
            <Route path="/admin/eventos"   element={<AdminRoute><AdminLayout><AdminEventos /></AdminLayout></AdminRoute>} />
            <Route path="/admin/talleres"  element={<AdminRoute><AdminLayout><AdminTalleres /></AdminLayout></AdminRoute>} />
            <Route path="/admin/cupones"    element={<AdminRoute><AdminLayout><AdminCupones /></AdminLayout></AdminRoute>} />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </CartProvider>
        </SiteProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
