import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Paginas
import Landing        from './pages/Landing';
import Tienda         from './pages/Tienda';
import Producto       from './pages/Producto';
import Login          from './pages/Login';
import Registro       from './pages/Registro';
import VerificarEmail from './pages/VerificarEmail';
import Checkout       from './pages/Checkout';
import CheckoutExito  from './pages/CheckoutExito';
import MisPedidos     from './pages/MisPedidos';

import AdminDashboard  from './pages/admin/Dashboard';
import AdminProductos  from './pages/admin/Productos';
import AdminPedidos    from './pages/admin/Pedidos';
import AdminInventario from './pages/admin/Inventario';
import AdminUsuarios   from './pages/admin/Usuarios';

// Layout
import Navbar           from './components/layout/Navbar';
import Footer           from './components/layout/Footer';
import WhatsAppBtn      from './components/layout/WhatsAppBtn';
import CartDrawer       from './components/shop/CartDrawer';
import AsistenteVirtual from './components/layout/AsistenteVirtual';

const Spinner = () => (
  <div style={{minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12}}>
    <div style={{width:36, height:36, border:'3px solid #ddd6c2', borderTopColor:'#5C6B3A', borderRadius:'50%', animation:'spin 0.8s linear infinite'}} />
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    <span style={{fontFamily:'Georgia,serif', fontSize:'0.85rem', color:'#5C6B3A'}}>Cargando...</span>
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
    <Navbar />
    <CartDrawer />
    <AsistenteVirtual />
    <WhatsAppBtn />
    <main style={{paddingTop:64}}>{children}</main>
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
            <Route path="/"               element={<MainLayout><Landing /></MainLayout>} />
            <Route path="/tienda"         element={<MainLayout><Tienda /></MainLayout>} />
            <Route path="/tienda/:id"     element={<MainLayout><Producto /></MainLayout>} />
            <Route path="/login"          element={<Login />} />
            <Route path="/registro"       element={<Registro />} />
            <Route path="/verificar-email" element={<VerificarEmail />} />

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

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
