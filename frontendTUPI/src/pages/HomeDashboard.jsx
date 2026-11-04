import React from 'react';
import { useAuth } from '../context/AuthContext';
import { PlusCircle, FileText, Clock, ShieldCheck, Building2, ArrowRight, Sparkles } from 'lucide-react';
import './HomeDashboard.css';

const HomeDashboard = ({ onNavegar }) => {
  const { user } = useAuth();
  
  const usuarioLogueado = user || JSON.parse(localStorage.getItem('tupi_user')) || JSON.parse(localStorage.getItem('usuario')) || {};
  const nombreUsuario = usuarioLogueado?.nombre || 'Augusto';
  const tipoId = parseInt(usuarioLogueado?.tipo_usuario_id, 10);
  
  const rolUsuario = tipoId === 1 ? 'Super Administrador' : tipoId === 3 ? 'Autorizante UOC' : 'Operador / Usuario';
  const dependenciaNombre = usuarioLogueado?.dependencia || usuarioLogueado?.dependencia_nombre || 'Rectorado - UNNE';

  return (
    <div className="home-dashboard-fullscreen">
      
      {/* 🌟 HERO BANNER INSTITUCIONAL PRINCIPAL */}
      <div className="home-hero-banner">
        <div className="hero-banner-content">
          <div className="hero-badge-top">
            <Sparkles size={14} />
            <span>Sistema Centralizado TUPI UNNE • Gestión de Compras 2026</span>
          </div>

          <div className="hero-text-row">
            <div>
              <h1 className="hero-title">¡Bienvenido, {nombreUsuario}!</h1>
              <p className="hero-subtitle">
                Plataforma institucional para la gestión, carga y aprobación de requerimientos presupuestarios de la Universidad Nacional del Nordeste.
              </p>
              
              <div className="hero-meta-badges">
                <span className="meta-badge-item">
                  <Building2 size={13} /> {dependenciaNombre}
                </span>
                <span className="meta-badge-item role">
                  <ShieldCheck size={13} /> {rolUsuario}
                </span>
              </div>
            </div>

            {/* LOGO DE LA UNNE EN EL HERO */}
            <div className="hero-logo-container">
              <img src="/logo-unne.png" alt="Logo UNNE" className="hero-unne-logo" />
            </div>
          </div>
        </div>
      </div>

      {/* 🚀 TARJETAS DE ACCESOS RÁPIDOS INTERACTIVOS */}
      <div className="home-actions-grid">
        
        {/* Acción 1: Nueva Solicitud */}
        <div className="home-action-card primary" onClick={() => onNavegar && onNavegar('plan-compras')}>
          <div className="action-icon-box blue">
            <PlusCircle size={26} />
          </div>
          <div className="action-card-body">
            <h3>Nueva Solicitud de Compra</h3>
            <p>Inicie un nuevo requerimiento seleccionando bienes del catálogo oficial y su área de origen.</p>
          </div>
          <div className="action-arrow-icon">
            <ArrowRight size={18} />
          </div>
        </div>

        {/* Acción 2: Historial */}
        <div className="home-action-card" onClick={() => onNavegar && onNavegar('historial')}>
          <div className="action-icon-box slate">
            <FileText size={26} />
          </div>
          <div className="action-card-body">
            <h3>Historial de Solicitudes</h3>
            <p>Consulte el estado de sus requerimientos anteriores, descargue comprobantes PDF o planillas Excel.</p>
          </div>
          <div className="action-arrow-icon">
            <ArrowRight size={18} />
          </div>
        </div>

        {/* Acción 3: Pendientes / Autorizaciones (Si es Admin o Autorizante) */}
        {(tipoId === 1 || tipoId === 2 || tipoId === 3) && (
          <div className="home-action-card" onClick={() => onNavegar && onNavegar('pendientes')}>
            <div className="action-icon-box green">
              <Clock size={26} />
            </div>
            <div className="action-card-body">
              <h3>Autorización de Solicitudes</h3>
              <p>Revise, apruebe o devuelva las solicitudes enviadas por las dependencias de su jurisdicción.</p>
            </div>
            <div className="action-arrow-icon">
              <ArrowRight size={18} />
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default HomeDashboard;