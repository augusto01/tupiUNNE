import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, User, Lock, ExternalLink, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import axios from 'axios';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Estados para Captcha Matemático
  const [captchaChallenge, setCaptchaChallenge] = useState({ num1: 0, num2: 0 });
  const [captchaUserAnswer, setCaptchaUserAnswer] = useState('');

  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 9) + 1;
    const num2 = Math.floor(Math.random() * 9) + 1;
    setCaptchaChallenge({ num1, num2 });
    setCaptchaUserAnswer('');
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const correctAnswer = captchaChallenge.num1 + captchaChallenge.num2;
    if (parseInt(captchaUserAnswer, 10) !== correctAnswer) {
      setError('El resultado del captcha es incorrecto.');
      setIsLoading(false);
      generateCaptcha();
      return;
    }

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const respuesta = await axios.post(`${API_URL}/auth/login`, {
        identifier,
        password
      });

      const { token, user, permisos } = respuesta.data;
      localStorage.setItem('tupi_token', token);
      localStorage.setItem('tupi_user', JSON.stringify(user));
      localStorage.setItem('tupi_permisos', JSON.stringify(permisos));

      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Error de conexión con el servidor.');
      generateCaptcha();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-split-container">
      
      {/* SECCIÓN IZQUIERDA: PANEL OPERATIVO (FORMULARIO) */}
      <section className="login-form-side">
        <div className="login-inner-box">
          
          {/* Cabecera: Logo inline junto a TUPI */}
          <header className="login-header-minimal">
            <div className="login-brand-group">
              <img src="/logo-unne.png" alt="Logo UNNE" className="login-inline-logo" />
              <div className="tupi-badge-logo">TUPI<span>.</span></div>
            </div>
            <h1 className="login-title-modern ">Ingresar al Sistema</h1>
            <p className="login-subtitle-modern">Plan de Compras y Correlatos</p>
          </header>

          {/* Feedback de Error */}
          {error && (
            <div className="alert-error-modern">
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="login-form-wrapper">
            
            {/* Campo Identificador */}
            <div className="form-field-group">
              <label htmlFor="usuario-identifier">Usuario / Correo / DNI</label>
              <div className="input-interactive-container">
                <span className="field-icon-left">
                  <User size={16} />
                </span>
                <input
                  id="usuario-identifier"
                  type="text"
                  required
                  disabled={isLoading}
                  className="interactive-login-input"
                  placeholder="DNI, legajo o correo"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                />
              </div>
            </div>

            {/* Campo Contraseña */}
            <div className="form-field-group">
              <label htmlFor="usuario-password">Contraseña</label>
              <div className="input-interactive-container">
                <span className="field-icon-left">
                  <Lock size={16} />
                </span>
                <input
                  id="usuario-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={isLoading}
                  className="interactive-login-input input-password-padding"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  disabled={isLoading}
                  className="btn-toggle-password-view"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Captcha Matemático */}
            <div className="form-field-group">
              <label>Verificación de Seguridad</label>
              <div className="captcha-minimal-row">
                <div className="captcha-challenge-box">
                  <span>{captchaChallenge.num1} + {captchaChallenge.num2} =</span>
                  <button 
                    type="button" 
                    className="btn-refresh-captcha" 
                    onClick={generateCaptcha}
                    disabled={isLoading}
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>
                <input
                  type="number"
                  required
                  disabled={isLoading}
                  className="captcha-input-field"
                  placeholder="Resultado"
                  value={captchaUserAnswer}
                  onChange={(e) => setCaptchaUserAnswer(e.target.value)}
                />
              </div>
            </div>

            <div className="meta-options-row">
              <a href="#" className="link-forgot-password-modern">
                ¿Olvidó sus credenciales?
              </a>
            </div>

            <button 
              type="submit" 
              className="btn-submit-modern" 
              disabled={isLoading || !identifier || !password || !captchaUserAnswer}
            >
              {isLoading ? (
                <>
                  <Loader2 className="spinner-rotation" />
                  <span>Verificando...</span>
                </>
              ) : (
                <span>Iniciar Sesión</span>
              )}
            </button>
          </form>

          <div className="ui-divider-text">O</div>

          {/* Botón UNNE */}
          <button type="button" className="btn-alternative-unne" disabled={isLoading}>
            <img src="/logo-unne.png" alt="UNNE" style={{ height: '16px', objectFit: 'contain' }} />
            <span>Ingresar con Entorno UNNE</span>
            <ExternalLink size={14} style={{ marginLeft: 'auto', opacity: 0.6 }} />
          </button>

          <footer className="login-footer-minimal">
            &copy; {new Date().getFullYear()} TUPI &mdash; Rectorado UNNE
          </footer>
        </div>
      </section>

      {/* SECCIÓN DERECHA: PANEL VISUAL (SIN LOGO DUPLICADO) */}
      <section className="login-visual-side">
        <div className="visual-center-content">
          <h2 className="visual-hero-text">
            Ecosistema Digital <br />
            de Control <span>TUPI.</span>
          </h2>
          <p className="visual-description-text">
            Optimización y trazabilidad analítica de expedientes, matrices de correlatos y planificación operativa de compras centralizadas.
          </p>
        </div>

        <div className="visual-footer-metadata">
          <span>Rectorado de la UNNE</span>
          <span>v2.1.0</span>
        </div>
      </section>

    </div>
  );
};

export default Login;