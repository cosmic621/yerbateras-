import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

// Se muestra en /admin (y subrutas) cuando no hay una sesión de administrador.
// No hay enlace a esta página en el sitio: solo se llega escribiendo la URL.
export default function AdminLogin() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [ver, setVer] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return setError('Escribe tu correo y contraseña');
    setCargando(true); setError('');
    try {
      const { data } = await api.post('/auth/admin-login', form);
      login(data.token, data.usuario); // el guard de /admin se re-evalúa y muestra el panel
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudo iniciar sesión');
    } finally { setCargando(false); }
  };

  const inp = 'w-full pl-10 pr-3 py-3 border border-crema-300 bg-crema-50 text-sm outline-none focus:border-dorado-500';

  return (
    <div className="min-h-screen bg-verde-900 flex items-center justify-center px-4">
      <form onSubmit={enviar} noValidate className="bg-white w-full max-w-sm p-8 shadow-2xl">
        <div className="text-center mb-6">
          <span className="inline-flex w-11 h-11 bg-verde-900 text-crema-100 items-center justify-center font-display italic font-bold text-lg mb-3">Y</span>
          <h1 className="font-display text-xl font-bold text-verde-900">Panel de administración</h1>
          <p className="text-xs text-verde-500 mt-1">Acceso solo para administradores</p>
        </div>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-2.5 mb-4">{error}</div>}
        <div className="relative mb-3"><Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-verde-400" />
          <input type="email" autoComplete="username" className={inp} placeholder="Correo" value={form.email} onChange={e => { setForm({ ...form, email: e.target.value }); setError(''); }} /></div>
        <div className="relative mb-5"><Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-verde-400" />
          <input type={ver ? 'text' : 'password'} autoComplete="current-password" className={inp} placeholder="Contraseña" value={form.password} onChange={e => { setForm({ ...form, password: e.target.value }); setError(''); }} />
          <button type="button" onClick={() => setVer(!ver)} aria-label="Mostrar contraseña" className="absolute right-3 top-1/2 -translate-y-1/2 text-verde-400">{ver ? <EyeOff size={15} /> : <Eye size={15} />}</button></div>
        <button type="submit" disabled={cargando} className="btn-primary w-full disabled:opacity-60">{cargando ? 'Ingresando...' : 'Ingresar'}</button>
      </form>
    </div>
  );
}
