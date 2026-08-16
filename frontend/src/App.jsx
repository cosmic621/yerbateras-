import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Paginas
import Nosotros       from './pages/Nosotros';
import Botiquin       from './pages/Botiquin';
import Tienda         from './pages/Tienda';
import Producto       from './pages/Producto';
import Login          from './pages/Login';
import Registro       from './pages/Registro';
import VerificarEmail from './pages/VerificarEmail';
import Citas          from './pages/Citas';
import Checkout       from './pages/Checkout';
import CheckoutExito  from './pages/CheckoutExito';
import MisPedidos     from './pages/MisPedidos';
import MisCitas       from './pages/MisCitas';

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

// Layout
import Navbar           from './components/layout/Navbar';
import Footer           from './components/layout/Footer';
import WhatsAppBtn      from './components/layout/WhatsAppBtn';
import CotizacionBtn    from './components/layout/CotizacionBtn';
import HojasTransicion  from './components/layout/HojasTransicion';
import CartDrawer       from './components/shop/CartDrawer';
import AsistenteVirtual from './components/layout/AsistenteVirtual';

const Spinner = () => (
  <div style={{minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12}}>
    <div style={{width:36, height:36, border:'3px solid #ddd6c2', borderTopColor:'#146b42', borderRadius:'50%', animation:'spin 0.8s linear infinite'}} />
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    <span style={{fontFamily:'Georgia,serif', fontSize:'0.85rem', color:'#146b42'}}>Cargando...</span>
  </div>
);

const PrivateRoute = ({ children }) => {
  const { usuario, cargando } = useAuth();
  if (cargando) return <Spinner />;
  return usuario ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { usuario, cargando, esAdmin } = useAuth();
  if (cargando) return <Spinner />;
  if (!usuario) return <Navigate to="/login" replace />;
  if (!esAdmin) return <Navigate to="/" replace />;
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
    <main style={{paddingTop:96}}>{children}</main>
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
        <CartProvider>
          <Routes>
            {/* Publicas */}
            <Route path="/"               element={<MainLayout><Tienda /></MainLayout>} />
            <Route path="/tienda"         element={<MainLayout><Tienda /></MainLayout>} />
            <Route path="/nosotros"       element={<MainLayout><Nosotros /></MainLayout>} />
            <Route path="/botiquin"       element={<MainLayout><Botiquin /></MainLayout>} />
            <Route path="/tienda/:id"     element={<MainLayout><Producto /></MainLayout>} />
            <Route path="/login"          element={<Login />} />
            <Route path="/registro"       element={<Registro />} />
            <Route path="/verificar-email" element={<VerificarEmail />} />
            <Route path="/citas"           element={<MainLayout><Citas /></MainLayout>} />
            <Route path="/mis-citas"       element={<PrivateRoute><MainLayout><MisCitas /></MainLayout></PrivateRoute>} />

            {/* Privadas cliente */}
            <Route path="/checkout"        element={<PrivateRoute><MainLayout><Checkout /></MainLayout></PrivateRoute>} />
            <Route path="/checkout/exito"  element={<PrivateRoute><MainLayout><CheckoutExito /></MainLayout></PrivateRoute>} />
            <Route path="/mis-pedidos"     element={<PrivateRoute><MainLayout><MisPedidos /></MainLayout></PrivateRoute>} />

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
            <Route path="/admin/cupones"    element={<AdminRoute><AdminLayout><AdminCupones /></AdminLayout></AdminRoute>} />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
