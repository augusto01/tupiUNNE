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
import './Dashboard.css';

const Dashboard = () => {
  // Estado para el spinner de carga de pantalla completa al montar el componente
  const [isLoading, setIsLoading] = useState(true);
  const [usuario, setUsuario] = useState({ nombre: 'Usuario', role: 'Operador' });
  const [entorno, setEntorno] = useState({ facultad: 'UNNE', rol: 'Operador' });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Control individual de los submenús dinámicos (Dropdowns unificados)
  const [openDropdowns, setOpenDropdowns] = useState({
    compras: false,
    correlatos: false,
    usuarios: false 
  });

  // Estado temporal de control de navegación interna
  const [currentSection, setCurrentSection] = useState('panel');

  useEffect(() => {
    // Sincronización del preloader con un micro-delay para la transición fluida
    const timer = setTimeout(() => {
      const userLocal = JSON.parse(localStorage.getItem('tupi_user'));
      const permisosLocal = JSON.parse(localStorage.getItem('tupi_permisos'));

      if (userLocal) {
        setUsuario({
          nombre: userLocal.nombre || 'Usuario',
          apellido: userLocal.apellido || 'Usuario',
          role: userLocal.role || 'Operador'
        });
      }
      
      if (permisosLocal && permisosLocal.length > 0) {
        setEntorno({
          facultad: permisosLocal[0].facultad_codigo,
          rol: permisosLocal[0].rol_nombre
        });
      }
      
      // Apagamos el spinner gigante de entrada
      setIsLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, []);

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

  // ==========================================================================
  // RENDER DEL PRELOADER / SPINNER INICIAL DE PANTALLA COMPLETA
  // ==========================================================================
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
      
      {/* SIDEBAR LATERAL CON TRANSICIONES DE ACORDEÓN */}
      <aside className={`dashboard-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        
        {/* SOLUCIÓN: Cambiado setSection('inicio') por setCurrentSection('panel') */}
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

          {/* ACCESO EXCLUSIVO: DESPLEGABLE DE USUARIOS (SUPER USUARIO) */}
          {entorno.rol === 'Superusuario' && (
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
                    <button 
                      onClick={() => { setCurrentSection('usuarios-crear'); setIsMobileMenuOpen(false); }}
                      className={`sidebar-subitem ${currentSection === 'usuarios-crear' ? 'active' : ''}`}
                      style={{ background: 'transparent', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      <PlusCircle size={12} />
                      <span>Agregar Usuario</span>
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => { setCurrentSection('usuarios-ver'); setIsMobileMenuOpen(false); }}
                      className={`sidebar-subitem ${currentSection === 'usuarios-ver' ? 'active' : ''}`}
                      style={{ background: 'transparent', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      <ListFilter size={12} />
                      <span>Ver Usuarios</span>
                    </button>
                  </li>
                </div>
              </ul>
            </div>
          )}
          
          

          {/* DESPLEGABLE 1: PLANES DE COMPRAS */}
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
                  <a href="#nueva-compra" className="sidebar-subitem">
                    <PlusCircle size={12} />
                    <span>Nueva Solicitud</span>
                  </a>
                </li>
                <li>
                  <a href="#historial-compras" className="sidebar-subitem">
                    <History size={12} />
                    <span>Ver Historial</span>
                  </a>
                </li>
              </div>
            </ul>
          </div>

          {/* DESPLEGABLE 2: GESTIÓN DE CORRELATOS */}
          <div>
            <button 
              className="sidebar-dropdown-toggle"
              onClick={() => toggleDropdown('correlatos')}
            >
              <div className="sidebar-item-content">
                <Layers size={16} />
                <span>Gestión de Correlatos</span>
              </div>
              <ChevronDown size={14} className={`dropdown-chevron ${openDropdowns.correlatos ? 'rotated' : ''}`} />
            </button>
            <ul className={`sidebar-submenu ${openDropdowns.correlatos ? 'open' : ''}`}>
              <div className="submenu-inner">
                <li>
                  <a href="#vincular" className="sidebar-subitem">
                    <PlusCircle size={12} />
                    <span>Vincular Ítems</span>
                  </a>
                </li>
                <li>
                  <a href="#matrices" className="sidebar-subitem">
                    <ListFilter size={12} />
                    <span>Matrices de Control</span>
                  </a>
                </li>
              </div>
            </ul>
          </div>

          <span className="menu-category">Auditoría</span>
          <button className="sidebar-item">
            <div className="sidebar-item-content">
              <FileCheck size={16} />
              <span>Validaciones</span>
            </div>
          </button>

          <span className="menu-category">Configuración</span>
          <button className="sidebar-item">
            <div className="sidebar-item-content">
              <Settings size={16} />
              <span>Ajustes</span>
            </div>
          </button>
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
        
        {/* NAVBAR SUPERIOR ULTRA-MINIMALISTA */}
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
            <div className="nav-faculty-badge">
              <Building2 size={12} />
              <span>{entorno.facultad}</span>
            </div>

            <div className="nav-user-info">
              <div className="user-text-meta">
                <span className="user-name-label">{usuario.nombre}</span>
                <span className="user-role-tag">{entorno.rol}</span>
              </div>
              <div className="user-avatar-circle">
                {getIniciales(usuario.nombre + ' ' + usuario.apellido)}
              </div>
            </div>
          </div>
        </nav>

        {/* ÁREA DE TRABAJO DINÁMICA CON MARCA DE AGUA */}
        <main className="dashboard-content-area">
          <img src="/logo-unne.png" alt="UNNE" className="unne-watermark" />
          
          <div className="content-wrapper-rel">
            {currentSection === 'panel' && (
              <div className="content-section-fade">
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Panel Principal</h3>
                <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Seleccione un módulo del menú lateral para comenzar a operar.</p>
              </div>
            )}

            {(currentSection === 'usuarios-ver' || currentSection === 'usuarios-crear') && (
              <UsuariosCRUD 
                sectionInicial={currentSection} 
                setSection={setCurrentSection} 
              />
            )}
          </div>
        </main>
      </div>

    </div>
  );
};

export default Dashboard;