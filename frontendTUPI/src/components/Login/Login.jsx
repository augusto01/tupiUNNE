import React, { useState } from 'react';
import { Eye, EyeOff, User, Lock, ExternalLink, Loader2 } from 'lucide-react';
import './Login.css';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);

    console.log('Autenticando en el ecosistema TUPI...', { identifier, password });

    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  return (
    <div className="login-container">
      
      {/* Contenedor centralizado (Box Container) */}
      <div className="login-box-container">
        
        {/* Cabecera Institucional */}
        <div className="login-header">
          <img 
            src="/logo-unne.png" 
            alt="UNNE Rectorado" 
            className="unne-logo-img"
          />
          <h1 className="login-title">TUPI</h1>
          <p className="login-subtitle">Plan de Compras y Correlatos</p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="login-form">
          
          <div className="form-group">
            <label>Usuario / Legajo</label>
            <div className="input-wrapper">
              <span className="input-icon-left">
                <User size={16} />
              </span>
              <input
                type="text"
                required
                disabled={isLoading}
                className="login-input"
                placeholder="ejemplo@unne.edu.ar"
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

          {/* Botón Dorado con Texto en Gris-Azul Oscuro */}
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

        {/* Botón Entorno UNNE */}
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