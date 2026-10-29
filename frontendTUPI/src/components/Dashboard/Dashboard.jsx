import React, { useState } from 'react';
import { 
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
  Clock,
  ListFilter,
  Users,
  ShieldAlert
} from 'lucide-react';
import UsuariosCRUD from '../Usuarios/UsuariosCRUD'; 
import { AnalizadorExpediente } from '../Expedientes/AnalizadorExp';
import PlanComprasABM from '../PAC/PlanComprasABM';
import Historial from '../PAC/Historial';
import Pendientes from '../PAC/Pendientes';
import './Dashboard.css';

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(false);

  // 1. Cargar datos del Usuario
  const [usuario, setUsuario] = useState(() => {
    const userLocal = JSON.parse(localStorage.getItem('tupi_user')) || JSON.parse(localStorage.getItem('usuario'));
    return {
      usuario_id: userLocal?.usuario_id || userLocal?.id || null,
      nombre: userLocal?.nombre || 'Usuario',
      apellido: userLocal?.apellido || '',
      rol: userLocal?.rol || 'Operador',
      tipo_usuario_id: parseInt(userLocal?.tipo_usuario_id, 10) || null,
      dependencia: userLocal?.dependencia || 'Rectorado UNNE',
      permisos: userLocal?.permisos || []
    };
  });

  // 2. Cargar Entorno y Permisos unificados
  const [entorno, setEntorno] = useState(() => {
    try {
      const permisosLocal = 
        JSON.parse(localStorage.getItem('tupi_permisos')) || 
        JSON.parse(localStorage.getItem('permisos')) || 
        usuario.permisos;

      if (Array.isArray(permisosLocal) && permisosLocal.length > 0) {
        if (permisosLocal[0] && typeof permisosLocal[0] === 'object' && permisosLocal[0].permisos) {
          return {
            facultad: permisosLocal[0].facultad_nombre || usuario.dependencia,
            rol: permisosLocal[0].rol_nombre || usuario.rol,
            permisos: permisosLocal[0].permisos || []
          };
        }
        
        if (typeof permisosLocal[0] === 'string') {
          return {
            facultad: usuario.dependencia,
            rol: usuario.rol,
            permisos: permisosLocal
          };
        }
      }
    } catch (err) {
      console.error("Error al leer permisos en Dashboard:", err);
    }

    return { 
      facultad: usuario.dependencia, 
      rol: usuario.rol, 
      permisos: usuario.permisos || [] 
    };
  });

  // 3. Helper flexible para verificar acceso a Slugs
  const tieneAcceso = (slugPermiso) => {
    if (!Array.isArray(entorno.permisos)) return false;
    if (usuario.tipo_usuario_id === 1) return true;
    return entorno.permisos.includes(slugPermiso);
  };

  // 4. Validación para Administradores y Autorizantes según jerarquía:
  // SuperAdmin (1), Administrador (2), Autorizante (3)
  const esAdministradorOAutorizante = 
    (usuario.tipo_usuario_id !== null && usuario.tipo_usuario_id <= 3) || 
    tieneAcceso('evaluar-solicitudes') ||
    tieneAcceso('pendientes') ||
    tieneAcceso('aprobar-solicitudes') ||
    usuario.rol?.toLowerCase().includes('admin') || 
    usuario.rol?.toLowerCase().includes('autoriz');

  // Permitir módulo de Compras a todos los roles habilitados (1, 2, 3, 4)
  const puedeVerCompras = 
    (usuario.tipo_usuario_id !== null && usuario.tipo_usuario_id <= 4) || 
    tieneAcceso('compras') || 
    tieneAcceso('plan-compras') || 
    tieneAcceso('crear-solicitud') ||
    tieneAcceso('historial');

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [openDropdowns, setOpenDropdowns] = useState({
    compras: true,
    correlatos: false,
    usuarios: false,
    expedientes: false
  });

  const [currentSection, setCurrentSection] = useState('panel');

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
      
      {/* CAPA DE CAPTURA PARA MÓVIL */}
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

          {/* MÓDULO: PLANES DE COMPRAS (PAC) */}
          {puedeVerCompras && (
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
                  {/* Nueva Solicitud */}
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

                  {/* Ver Historial */}
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

                  {/* Solicitudes Pendientes (Habilitado para Roles 1, 2 y 3) */}
                  {esAdministradorOAutorizante && usuario.tipo_usuario_id !== 4 && (
                    <li>
                      <a 
                        href="#pendientes-compras" 
                        className={`sidebar-subitem ${currentSection === 'compras-pendientes' ? 'active' : ''}`}
                        onClick={(e) => { 
                          e.preventDefault(); 
                          setCurrentSection('compras-pendientes'); 
                          setIsMobileMenuOpen(false); 
                        }}
                      >
                        <Clock size={12} />
                        <span>Pendientes</span>
                      </a>
                    </li>
                  )}
                </div>
              </ul>
            </div>
          )}

          {/* MÓDULO: GESTIÓN DE USUARIOS (Solo SuperAdmin - ID 1) */}
          {(tieneAcceso('usuarios') || usuario.tipo_usuario_id === 1) && (
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

          {/* MÓDULO: GESTIÓN DE EXPEDIENTES */}
          {(tieneAcceso('expedientes') || usuario.tipo_usuario_id === 1) && (
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
                </div>
              </ul>
            </div>
          )}

          {/* AUDITORÍA */}
          {(tieneAcceso('auditoria') || usuario.tipo_usuario_id === 1) && (
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

          {/* CONFIGURACIÓN */}
          {(tieneAcceso('configuracion') || usuario.tipo_usuario_id === 1) && (
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
                <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
                  Seleccione un módulo del menú lateral para comenzar a operar.
                </p>
              </div>
            )}

            {currentSection === 'compras-nueva' && (
              <PlanComprasABM />
            )}

            {currentSection === 'compras-historial' && (
              <Historial />
            )}

            {/* RENDERIZADO PROTEGIDO DEL COMPONENTE PENDIENTES EN EL ÁREA DE TRABAJO */}
            {currentSection === 'compras-pendientes' && (
              esAdministradorOAutorizante && usuario.tipo_usuario_id !== 4 ? (
                <Pendientes />
              ) : (
                <div className="content-section-fade text-center py-5">
                  <ShieldAlert size={48} className="text-danger mb-3" style={{ margin: '0 auto' }} />
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Acceso Restringido</h3>
                  <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
                    No posee los permisos suficientes para acceder al módulo de aprobación de solicitudes.
                  </p>
                </div>
              )
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