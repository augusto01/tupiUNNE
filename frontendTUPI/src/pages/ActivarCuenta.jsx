import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Key, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import Swal from 'sweetalert2';
import './ActivarCuenta.css';

const ActivarCuenta = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const handleSubmit = async (e) => {
    e.preventDefault();

    // FRENO ANTI-DOBLE SUBMIT: Si ya está procesando, no deja mandar otra petición
    if (loading) return;

    if (!token) {
      Swal.fire({
        icon: 'error',
        title: 'Token no encontrado',
        text: 'El enlace de activación es inválido o no contiene un token válido.',
        confirmButtonColor: '#0284c7'
      });
      return;
    }

    if (password.length < 8) {
      Swal.fire({
        icon: 'warning',
        title: 'Contraseña muy corta',
        text: 'La contraseña debe tener al menos 8 caracteres.',
        confirmButtonColor: '#0284c7'
      });
      return;
    }

    if (password !== confirmPassword) {
      Swal.fire({
        icon: 'warning',
        title: 'Contraseñas no coinciden',
        text: 'Asegúrate de escribir la misma contraseña en ambos campos.',
        confirmButtonColor: '#0284c7'
      });
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${BASE_URL}/usuarios/activar-cuenta`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'No se pudo activar la cuenta.');
      }

      // 🎯 1. LIMPIAR SESIÓN ANTERIOR (por si estaba logueado con Rectorado/Admin)
      localStorage.clear();

      // 🎯 2. GUARDAR LA NUEVA SESIÓN DEL USUARIO RECIÉN ACTIVADO
      if (data.token) {
        localStorage.setItem('tupi_token', data.token);
        localStorage.setItem('token', data.token);
      }
      if (data.usuario) {
        localStorage.setItem('tupi_user', JSON.stringify(data.usuario));
        localStorage.setItem('usuario', JSON.stringify(data.usuario));
      }

      setLoading(false);

      // 🎯 3. MOSTRAR LA ALERTA DE ÉXITO Y LUEGO NAVEGAR
      Swal.fire({
        icon: 'success',
        title: '¡Cuenta Activada!',
        text: `Hola ${data.usuario?.nombre || ''}, tu clave fue configurada correctamente.`,
        confirmButtonColor: '#059669',
        confirmButtonText: 'Ir al Panel Principal',
        allowOutsideClick: false
      }).then((result) => {
        if (result.isConfirmed || result.isDismissed) {
          // Forzamos la redirección y refresco para levantar la nueva sesión
          window.location.href = '/dashboard';
        }
      });

    } catch (err) {
      console.error('❌ Error en activación:', err);
      setLoading(false);
      
      Swal.fire({
        icon: 'error',
        title: 'Enlace Inválido o Expirado',
        text: err.message || 'Ocurrió un error al procesar la activación.',
        confirmButtonColor: '#0284c7'
      });
    }
  };

  return (
    <div className="activar-cuenta-wrapper">
      <div className="activar-card-box">
        <div className="activar-header">
          <div className="icon-badge">
            <ShieldCheck size={32} />
          </div>
          <h2>Activar Cuenta - TUPI UNNE</h2>
          <p>Configura tu clave de acceso personal para ingresar al sistema.</p>
        </div>

        <form onSubmit={handleSubmit} className="activar-form">
          <div className="form-group-activar">
            <label><Key size={14} /> Nueva Contraseña</label>
            <div className="password-input-wrapper">
              <input 
                type={showPassword ? "text" : "password"} 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                placeholder="Mínimo 8 caracteres"
                disabled={loading}
              />
              <button 
                type="button" 
                className="toggle-eye-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="form-group-activar">
            <label><Key size={14} /> Confirmar Contraseña</label>
            <div className="password-input-wrapper">
              <input 
                type={showConfirmPassword ? "text" : "password"} 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                required 
                placeholder="Repite tu contraseña"
                disabled={loading}
              />
              <button 
                type="button" 
                className="toggle-eye-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex="-1"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-activar-submit" disabled={loading}>
            {loading ? 'Activando Cuenta...' : 'Establecer Contraseña e Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ActivarCuenta;