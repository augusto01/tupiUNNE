import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  FileSpreadsheet, 
  Layers, 
  Settings, 
  LogOut, 
  Building2, 
  Menu,
  FileCheck,
  ChevronDown,
  PlusCircle,
  History,
  ListFilter,
  Users 
} from 'lucide-react';
import UsuariosCRUD from '../Usuarios/UsuariosCRUD'; 
import { AnalizadorExpediente } from '../Expedientes/AnalizadorExp';
import PlanComprasABM from '../PAC/PlanComprasABM';
import './Dashboard.css';

const Dashboard = () => {
  // 1. Declaración de la variable isLoading que faltaba
  const [isLoading, setIsLoading] = useState(false);

  // Inicialización segura del usuario desde localStorage
  const [usuario, setUsuario] = useState(() => {
    const userLocal = JSON.parse(localStorage.getItem('tupi_user')) || JSON.parse(localStorage.getItem('usuario'));
    return {
      nombre: userLocal?.nombre || 'Usuario',
      apellido: userLocal?.apellido || '',
      rol: userLocal?.rol || 'Operador',
      dependencia: userLocal?.dependencia || 'UNNE'
    };
  });

  // Inicialización flexible de permisos/entornos para evitar pantallas vacías
  const [entorno, setEntorno] = useState(() => {
    try {
      const permisosLocal = JSON.parse(localStorage.getItem('tupi_permisos')) || JSON.parse(localStorage.getItem('permisos'));

      if (Array.isArray(permisosLocal) && permisosLocal.length > 0) {
        // Caso 1: Estructura de entornos relacionales (Backend UNNE)
        if (permisosLocal[0] && typeof permisosLocal[0] === 'object' && permisosLocal[0].permisos) {
          return {
            facultad: permisosLocal[0].facultad_nombre || 'Rectorado UNNE',
            rol: permisosLocal[0].rol_nombre || 'Operador',
            permisos: permisosLocal[0].permisos || []
          };
        }
        
        // Caso 2: Array plano de strings ['compras', 'usuarios', ...]
        if (typeof permisosLocal[0] === 'string') {
          return {
            facultad: 'Rectorado UNNE',
            rol: 'Administrador',
            permisos: permisosLocal
          };
        }
      }
    } catch (err) {
      console.error("Error al leer permisos en Dashboard:", err);
    }

    // Respaldo de desarrollo por defecto (Asegura la visibilidad de todos los módulos)
    return { 
      facultad: 'Rectorado UNNE', 
      rol: 'Administrador', 
      permisos: ['compras', 'usuarios', 'expedientes', 'auditoria', 'configuracion'] 
    };
  });

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Control individual de los submenús dinámicos
  const [openDropdowns, setOpenDropdowns] = useState({
    compras: false,
    correlatos: false,
    usuarios: false,
    expedientes: false
  });

  // Estado de control de navegación interna
  const [currentSection, setCurrentSection] = useState('panel');

  // Helper para comprobar si el rol tiene asignado el permiso
  const tieneAcceso = (slugPermiso) => {
    return entorno.permisos.includes(slugPermiso);
  };

  const toggleDropdown = (key) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  const getIniciales = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase();
  };

  // Evaluación de pantalla de carga (Línea 86 corregida)
  if (isLoading) {
    return (
      <div className="dashboard-preload-container">
        <div className="big-spinner"></div>
        <p className="preload-text">Iniciando Ecosistema TUPI</p>
      </div>
    );
  }

  return (
    <div className="dashboard-layout content-section-fade">
      
      {/* CAPA DE CAPTURA PARA MÓVIL (BACKDROP BLUR) */}
      <div 
        className={`sidebar-overlay ${isMobileMenuOpen ? 'visible' : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
      ></div>
      
      {/* SIDEBAR LATERAL */}
      <aside className={`dashboard-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        
        {/* LOGO */}
        <div 
          className="sidebar-brand" 
          onClick={() => { setCurrentSection('panel'); setIsMobileMenuOpen(false); }} 
          style={{ cursor: 'pointer' }}
          title="Ir al Inicio"
        >
          <img src="/logo-unne.png" alt="UNNE" className="sidebar-logo-img" />
          <div className="sidebar-brand-text">TUPI<span>.</span></div>
        </div>

        <div className="sidebar-menu-wrapper">
          <span className="menu-category">Módulos Core</span>

          {/* ACCESO DINÁMICO: GESTIÓN DE USUARIOS */}
          {tieneAcceso('usuarios') && (
            <div>
              <button 
                className="sidebar-dropdown-toggle"
                onClick={() => toggleDropdown('usuarios')}
              >
                <div className="sidebar-item-content">
                  <Users size={16} />
                  <span>Gestión de Usuarios</span>
                </div>
                <ChevronDown size={14} className={`dropdown-chevron ${openDropdowns.usuarios ? 'rotated' : ''}`} />
              </button>
              <ul className={`sidebar-submenu ${openDropdowns.usuarios ? 'open' : ''}`}>
                <div className="submenu-inner">
                  <li>
                    <a 
                      href="#usuarios-crear"
                      onClick={(e) => { e.preventDefault(); setCurrentSection('usuarios-crear'); setIsMobileMenuOpen(false); }}
                      className={`sidebar-subitem ${currentSection === 'usuarios-crear' ? 'active' : ''}`}
                    >
                      <PlusCircle size={12} />
                      <span>Agregar Usuario</span>
                    </a>
                  </li>
                  <li>
                    <a 
                      href="#usuarios-ver"
                      onClick={(e) => { e.preventDefault(); setCurrentSection('usuarios-ver'); setIsMobileMenuOpen(false); }}
                      className={`sidebar-subitem ${currentSection === 'usuarios-ver' ? 'active' : ''}`}
                    >
                      <ListFilter size={12} />
                      <span>Ver Usuarios</span>
                    </a>
                  </li>
                </div>
              </ul>
            </div>
          )}

          {/* ACCESO DINÁMICO: PLANES DE COMPRAS */}
          {tieneAcceso('compras') && (
            <div>
              <button 
                className="sidebar-dropdown-toggle"
                onClick={() => toggleDropdown('compras')}
              >
                <div className="sidebar-item-content">
                  <FileSpreadsheet size={16} />
                  <span>Planes de Compras</span>
                </div>
                <ChevronDown size={14} className={`dropdown-chevron ${openDropdowns.compras ? 'rotated' : ''}`} />
              </button>
              <ul className={`sidebar-submenu ${openDropdowns.compras ? 'open' : ''}`}>
                <div className="submenu-inner">
                  <li>
                    <a 
                      href="#nueva-compra" 
                      className={`sidebar-subitem ${currentSection === 'compras-nueva' ? 'active' : ''}`}
                      onClick={(e) => { 
                        e.preventDefault(); 
                        setCurrentSection('compras-nueva'); 
                        setIsMobileMenuOpen(false); 
                      }}
                    >
                      <PlusCircle size={12} />
                      <span>Nueva Solicitud</span>
                    </a>
                  </li>
                  <li>
                    <a 
                      href="#historial-compras" 
                      className={`sidebar-subitem ${currentSection === 'compras-historial' ? 'active' : ''}`}
                      onClick={(e) => { 
                        e.preventDefault(); 
                        setCurrentSection('compras-historial'); 
                        setIsMobileMenuOpen(false); 
                      }}
                    >
                      <History size={12} />
                      <span>Ver Historial</span>
                    </a>
                  </li>
                </div>
              </ul>
            </div>
          )}

          {/* ACCESO DINÁMICO: GESTIÓN DE EXPEDIENTES */}
          {tieneAcceso('expedientes') && (
            <div>
              <button 
                className="sidebar-dropdown-toggle"
                onClick={() => toggleDropdown('expedientes')}
              >
                <div className="sidebar-item-content">
                  <Layers size={16} />
                  <span>Gestión de Expedientes</span>
                </div>
                <ChevronDown size={14} className={`dropdown-chevron ${openDropdowns.expedientes ? 'rotated' : ''}`} />
              </button>

              <ul className={`sidebar-submenu ${openDropdowns.expedientes ? 'open' : ''}`}>
                <div className="submenu-inner">
                  <li>
                    <a 
                      href="#expedientes-ver"
                      className={`sidebar-subitem ${currentSection === 'expedientes-ver' ? 'active' : ''}`}
                      onClick={(e) => { e.preventDefault(); setCurrentSection('expedientes-ver'); setIsMobileMenuOpen(false); }}
                    >
                      <PlusCircle size={12} />
                      <span>Ver / Analizar Expedientes</span>
                    </a>
                  </li>
                  <li>
                    <a 
                      href="#expedientes-controles"
                      className={`sidebar-subitem ${currentSection === 'expedientes-controles' ? 'active' : ''}`}
                      onClick={(e) => { e.preventDefault(); setCurrentSection('expedientes-controles'); setIsMobileMenuOpen(false); }}
                    >
                      <ListFilter size={12} />
                      <span>Controles</span>
                    </a>
                  </li>
                </div>
              </ul>
            </div>
          )}

          {/* ACCESO DINÁMICO: AUDITORÍA */}
          {tieneAcceso('auditoria') && (
            <>
              <span className="menu-category">Auditoría</span>
              <button className="sidebar-item">
                <div className="sidebar-item-content">
                  <FileCheck size={16} />
                  <span>Validaciones</span>
                </div>
              </button>
            </>
          )}

          {/* ACCESO DINÁMICO: CONFIGURACIÓN */}
          {tieneAcceso('configuracion') && (
            <>
              <span className="menu-category">Configuración</span>
              <button className="sidebar-item">
                <div className="sidebar-item-content">
                  <Settings size={16} />
                  <span>Ajustes</span>
                </div>
              </button>
            </>
          )}
        </div>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="btn-logout">
            <LogOut size={16} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* CONTENEDOR DE CONTENIDOS PRINCIPAL */}
      <div className="dashboard-main">
        <nav className="dashboard-navbar">
          <button 
            className="menu-toggle-btn" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu size={18} />
          </button>

          <div className="nav-welcome">
            <h2>Hola, {usuario.nombre.split(' ')[0]}</h2>
          </div>

          <div className="nav-profile-section">
            <div className="nav-faculty-badge" title={`Asignación: ${usuario.dependencia}`}>
              <Building2 size={12} />
              <span>{entorno.facultad}</span> 
            </div>

            <div className="nav-user-info">
              <div className="user-text-meta">
                <span className="user-name-label">{usuario.nombre} {usuario.apellido}</span>
                <span className="user-role-tag">{usuario.rol}</span>
              </div>
              <div className="user-avatar-circle">
                {getIniciales(usuario.nombre)}
              </div>
            </div>
          </div>
        </nav>

        {/* ÁREA DE TRABAJO */}
        <main className="dashboard-content-area">
          <img src="/logo-unne.png" alt="UNNE" className="unne-watermark" />
          
          <div className="content-wrapper-rel">
            {currentSection === 'panel' && (
              <div className="content-section-fade">
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Panel Principal</h3>
                <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Seleccione un módulo del menú lateral para comenzar a operar.</p>
              </div>
            )}

            {currentSection === 'compras-nueva' && (
              <PlanComprasABM />
            )}

            {(currentSection === 'usuarios-ver' || currentSection === 'usuarios-crear') && (
              <UsuariosCRUD 
                sectionInicial={currentSection} 
                setSection={setCurrentSection} 
              />
            )}

            {currentSection === 'expedientes-ver' && (
              <AnalizadorExpediente />
            )}

            {currentSection === 'expedientes-controles' && (
              <div className="content-section-fade">
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Controles de Expedientes</h3>
                <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Módulo de auditoría y controles.</p>
              </div>
            )}
          </div>
        </main>
      </div>

    </div>
  );
};

export default Dashboard;