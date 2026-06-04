import React, { useState } from 'react';
import { Eye, EyeOff, User, Lock, ExternalLink, Loader2 } from 'lucide-react';
import './Login.css';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Estado para controlar el Spinner

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true); // Activa el spinner

    console.log('Enviando datos a TUPI Express...', { identifier, password });

    // Simulamos una demora de red de 2 segundos (luego lo reemplazarás por tu Axios)
    setTimeout(() => {
      setIsLoading(false); // Apaga el spinner
    }, 2500);
  };

  const handleUNNELogin = () => {
    console.log('Redireccionando al entorno central de la universidad...');
  };

  return (
    <div className="login-container">
      
      {/* Caja contenedor del Login (Container) */}
      <div className="login-box-container">
        
        {/* Encabezado Institucional */}
        <div className="login-header">
          <img 
            src="/logo-unne.png" 
            alt="Escudo Universidad Nacional del Nordeste" 
            className="unne-logo-img"
          />
          <h1 className="login-title">TUPÍ</h1>
          <p className="login-subtitle">Plan de Compras y Correlatos</p>
        </div>

        {/* Formulario Corporativo */}
        <form onSubmit={handleSubmit} className="login-form">
          
          {/* Fila: Identificador de Usuario */}
          <div className="form-group">
            <label>Usuario / Legajo</label>
            <div className="input-wrapper">
              <span className="input-icon-left">
                <User size={18} />
              </span>
              <input
                type="text"
                required
                disabled={isLoading}
                className="login-input"
                placeholder="ejemplo@unne.edu.ar o usuario"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
            </div>
          </div>

          {/* Fila: Contraseña */}
          <div className="form-group">
            <label>Contraseña</label>
            <div className="input-wrapper">
              <span className="input-icon-left">
                <Lock size={18} />
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
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Recuperación de Acceso */}
          <div className="forgot-password-container">
            <a href="#" className="forgot-password-link">
              Gestión de credenciales institucionales
            </a>
          </div>

          {/* Botón Iniciar Sesión Dorado con Spinner condicional */}
          <button type="submit" className="btn-submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="spinner" />
                <span>VERIFICANDO...</span>
              </>
            ) : (
              <span>Iniciar Sesión</span>
            )}
          </button>
        </form>

        {/* Separación corporativa */}
        <div className="login-divider">O</div>

        {/* Autenticación Externa */}
        <button type="button" onClick={handleUNNELogin} className="btn-unne" disabled={isLoading}>
          <span>Ingresar con Entorno UNNE</span>
          <ExternalLink size={16} />
        </button>

      </div>

      {/* Pie de página de la aplicación */}
      <p className="login-footer">
        &copy; {new Date().getFullYear()} TUPI — Rectorado Universidad Nacional del Nordeste
      </p>
    </div>
  );
};

export default Login;