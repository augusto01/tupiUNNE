import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Key, ShieldCheck, Eye, EyeOff, Loader2 } from 'lucide-react';
import Swal from 'sweetalert2';
import './ActivarCuenta.css';

const ActivarCuenta = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    // 1. Validar presencia del token
    if (!token) {
      Swal.fire({
        icon: 'error',
        title: 'Token no encontrado',
        text: 'El enlace de activación es inválido o no contiene un token válido.',
        confirmButtonColor: '#0284c7'
      });
      return;
    }

    // 2. Validar longitud mínima de 8 caracteres
    if (password.trim().length < 8) {
      Swal.fire({
        icon: 'warning',
        title: 'Contraseña muy corta',
        text: 'La contraseña debe tener un mínimo de 8 caracteres.',
        confirmButtonColor: '#0284c7'
      });
      return;
    }

    // 3. Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
      Swal.fire({
        icon: 'warning',
        title: 'Las contraseñas no coinciden',
        text: 'Asegúrate de ingresar exactamente la misma contraseña en ambos campos.',
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

      // Limpiar datos previos en localStorage
      localStorage.clear();

      // Guardar token y sesión
      if (data.token) {
        localStorage.setItem('tupi_token', data.token);
        localStorage.setItem('token', data.token);
      }
      if (data.usuario) {
        localStorage.setItem('tupi_user', JSON.stringify(data.usuario));
        localStorage.setItem('usuario', JSON.stringify(data.usuario));
      }

      setLoading(false);

      // Alerta con contador dinámico e ingreso automático al dashboard
      let timerInterval;
      Swal.fire({
        icon: 'success',
        title: '¡Cuenta activada con éxito!',
        html: 'Serás redirigido al sitio en <b id="swal-timer">3</b> segundos...',
        timer: 3000,
        timerProgressBar: true,
        confirmButtonColor: '#059669',
        confirmButtonText: 'Ir al sitio ahora',
        allowOutsideClick: false,
        didOpen: () => {
          const timerElement = document.getElementById('swal-timer');
          timerInterval = setInterval(() => {
            const timeLeft = Swal.getTimerLeft();
            if (timeLeft && timerElement) {
              timerElement.textContent = Math.ceil(timeLeft / 1000);
            }
          }, 200);
        },
        willClose: () => {
          clearInterval(timerInterval);
        }
      }).then(() => {
        window.location.href = '/dashboard';
      });

    } catch (err) {
      console.error('❌ Error al activar la cuenta:', err);
      setLoading(false);

      Swal.fire({
        icon: 'error',
        title: 'Error de activación',
        text: err.message || 'Ocurrió un problema al procesar la activación.',
        confirmButtonColor: '#0284c7'
      });
    }
  };

  return (
    <div className="activar-cuenta-wrapper">
      <div className="activar-card-box">
        <div className="activar-header">
          <img src="/logo-unne.png" alt="Logo UNNE" className="logo-unne-img" />
          <h2>Sistema TUPI - UNNE</h2>
          <p className="subtitle-activar">Activar Cuenta de Usuario</p>
          <span className="desc-activar">Configura tu clave de acceso personal para ingresar al sistema.</span>
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
            {loading ? (
              <>
                <Loader2 size={18} className="spinner-icon" />
                <span>Estableciendo contraseña...</span>
              </>
            ) : (
              'Establecer Contraseña e Ingresar'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ActivarCuenta;