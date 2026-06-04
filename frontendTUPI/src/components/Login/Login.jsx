import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Hook para navegación interna
import { Eye, EyeOff, User, Lock, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import axios from 'axios';
import './Login.css';

const Login = () => {
  const navigate = useNavigate(); // Inicializamos el router para la redirección
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(''); // Estado para capturar errores del Backend

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Uso de la variable de entorno según el estándar de Vite
      const API_URL = import.meta.env.VITE_API_URL || 'ht:5000';
      
      const respuesta = await axios.post(`${API_URL}/api/auth/login`, {
        identifier,
        password
      });


      const { token, user, permisos } = respuesta.data;

      // Guardamos los datos de la sesión de forma local
      localStorage.setItem('tupi_token', token);
      localStorage.setItem('tupi_user', JSON.stringify(user));
      localStorage.setItem('tupi_permisos', JSON.stringify(permisos));

      console.log(`¡Bienvenido ${user.nombre}! Permisos cargados.`);

      // Redirección interna y limpia al Dashboard (activa tu spinner de carga inicial)
      navigate('/dashboard');

    } catch (err) {
      // Capturamos el mensaje de error configurado en el authController
      setError(err.response?.data?.message || 'Error de conexión con el servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box-container">
        
        {/* Cabecera */}
        <div className="login-header">
          <img 
            src="/logo-unne.png" 
            alt="UNNE Rectorado" 
            className="unne-logo-img"
          />
          <h1 className="login-title">TUPI</h1>
          <p className="login-subtitle">Plan de Compras y Correlatos</p>
        </div>

        {/* Feedback de Error Interactivo */}
        {error && (
          <div className="login-error-alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="login-form">
          
          <div className="form-group">
            <label>Usuario / Correo / DNI</label>
            <div className="input-wrapper">
              <span className="input-icon-left">
                <User size={16} />
              </span>
              <input
                type="text"
                required
                disabled={isLoading}
                className="login-input"
                placeholder="DNI, legajo o correo"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <div className="input-wrapper">
              <span className="input-icon-left">
                <Lock size={16} />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                disabled={isLoading}
                className="login-input login-input-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                disabled={isLoading}
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="forgot-password-container">
            <a href="#" className="forgot-password-link">
              Recuperar credenciales de acceso
            </a>
          </div>

          <button type="submit" className="btn-submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="spinner" />
                <span>Verificando...</span>
              </>
            ) : (
              <span>Iniciar Sesión</span>
            )}
          </button>
        </form>

        <div className="login-divider">O</div>

        <button type="button" className="btn-unne" disabled={isLoading}>
          <span>Ingresar con Entorno UNNE</span>
          <ExternalLink size={14} />
        </button>

      </div>

      <p className="login-footer">
        &copy; {new Date().getFullYear()} TUPI — Rectorado Universidad Nacional del Nordeste
      </p>
    </div>
  );
};

export default Login;