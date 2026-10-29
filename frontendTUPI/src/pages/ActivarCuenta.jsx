import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Key, ShieldCheck, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
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

  // Estados para controlar interactividad/mensajes en tiempo real
  const [touchedPassword, setTouchedPassword] = useState(false);
  const [touchedConfirm, setTouchedConfirm] = useState(false);

  const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Validaciones en tiempo real
  const esPasswordCorta = password.length > 0 && password.length < 8;
  const noCoinciden = confirmPassword.length > 0 && password !== confirmPassword;
  const esFormularioValido = password.length >= 8 && password === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();

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

    if (!esFormularioValido) return;

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

      // 1. Limpiar sesiones anteriores de localStorage
      localStorage.clear();

      // 2. Persistir token y datos de usuario completos (incluyendo permisos parseados)
      if (data.token) {
        localStorage.setItem('tupi_token', data.token);
        localStorage.setItem('token', data.token);
      }
      if (data.usuario) {
        // Aseguramos que los permisos viajen en el objeto del usuario guardado
        localStorage.setItem('tupi_user', JSON.stringify(data.usuario));
        localStorage.setItem('usuario', JSON.stringify(data.usuario));
      }

      setLoading(false);

      // 3. Alerta de éxito e ingreso al Dashboard
      let timerInterval;
      Swal.fire({
        icon: 'success',
        title: '¡Cuenta activada con éxito!',
        html: 'Serás redirigido al panel en <b id="swal-timer">3</b> segundos...',
        timer: 3000,
        timerProgressBar: true,
        confirmButtonColor: '#059669',
        confirmButtonText: 'Ir al Dashboard ahora',
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
        // Recarga completa para forzar a los Providers de React Router/AuthContext a leer la nueva sesión
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
          {/* Nueva Contraseña */}
          <div className="form-group-activar">
            <label><Key size={14} /> Nueva Contraseña</label>
            <div className="password-input-wrapper">
              <input 
                type={showPassword ? "text" : "password"} 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouchedPassword(true)}
                required 
                placeholder="Mínimo 8 caracteres"
                disabled={loading}
                className={touchedPassword && esPasswordCorta ? 'input-error' : (password.length >= 8 ? 'input-success' : '')}
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
            {/* Mensaje de validación en tiempo real */}
            {touchedPassword && esPasswordCorta && (
              <span className="error-text-field">
                <AlertCircle size={12} /> La contraseña debe tener al menos 8 caracteres.
              </span>
            )}
            {password.length >= 8 && (
              <span className="success-text-field">
                <CheckCircle2 size={12} /> Longitud válida.
              </span>
            )}
          </div>

          {/* Confirmar Contraseña */}
          <div className="form-group-activar">
            <label><Key size={14} /> Confirmar Contraseña</label>
            <div className="password-input-wrapper">
              <input 
                type={showConfirmPassword ? "text" : "password"} 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                onBlur={() => setTouchedConfirm(true)}
                required 
                placeholder="Repite tu contraseña"
                disabled={loading}
                className={touchedConfirm && noCoinciden ? 'input-error' : (confirmPassword.length >= 8 && !noCoinciden ? 'input-success' : '')}
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
            {/* Mensaje de validación en tiempo real */}
            {touchedConfirm && noCoinciden && (
              <span className="error-text-field">
                <AlertCircle size={12} /> Las contraseñas no coinciden.
              </span>
            )}
            {confirmPassword.length >= 8 && !noCoinciden && (
              <span className="success-text-field">
                <CheckCircle2 size={12} /> Las contraseñas coinciden.
              </span>
            )}
          </div>

          <button 
            type="submit" 
            className="btn-activar-submit" 
            disabled={loading || !esFormularioValido}
          >
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