import React, { useState, useEffect } from 'react';
import { 
  FiPlusCircle, FiEdit3, FiTrash2, FiRefreshCw, FiShield, 
  FiUserCheck, FiUsers, FiCheckSquare, FiUser, FiFileText 
} from 'react-icons/fi';
import { useUsuarios } from '../hooks/useUsuarios';
import FormularioUsuario from './FormularioUsuario';
import ConfirmModal from '../Modals/ConfirmModal';
import ToastNotification from '../Modals/ToastNotification';
import './UsuariosCRUD.css';

const ROLES_MAP = {
  'Superusuario': { label: 'Super Usuario', class: 'super-user', icon: <FiShield size={12} /> },
  'Administrador': { label: 'Administrador', class: 'admin-user', icon: <FiUserCheck size={12} /> },
  'Operador': { label: 'Operador', class: 'standard', icon: <FiUsers size={12} /> },
};

const UsuariosCRUD = ({ sectionInicial, setSection }) => {
  const { 
    listaUsuarios, 
    tiposUsuario,
    dependencias,
    loading, 
    errorBackend, 
    cargarUsuarios, 
    cargarTiposUsuario,
    cargarDependencias,
    guardarUsuario, 
    toggleBajaLogica 
  } = useUsuarios();

  const [editingUser, setEditingUser] = useState(null);
  const [activeTab, setActiveTab] = useState('datos'); // 'datos', 'permisos' o 'detalles'
  const [modalBajaConfig, setModalBajaConfig] = useState({ isOpen: false, tipo: '', titulo: '', mensaje: '', onConfirm: null });
  const [toastConfig, setToastConfig] = useState({ visible: false, mensaje: '', tipo: '' });

  // Estado local para los checkboxes de permisos dinámicos
  const [permisosDinamicos, setPermisosDinamicos] = useState([]);

  // Permisos del ecosistema central TUPI
  const todosLosPermisos = [
    { slug: 'panel', nombre: 'Acceso al Dashboard Principal' },
    { slug: 'usuarios', nombre: 'Gestión Completa de Personal (CRUD)' },
    { slug: 'compras', nombre: 'Administración de Planes de Compras' },
    { slug: 'correlatos', nombre: 'Vincular ítems y Matrices de Control' },
    { slug: 'auditoria', nombre: 'Validaciones Avanzadas de Auditoría' },
    { slug: 'configuracion', nombre: 'Ajustes Críticos de Infraestructura' }
  ];

  useEffect(() => {
    cargarUsuarios();
    cargarTiposUsuario();
    cargarDependencias();
  }, [cargarUsuarios, cargarTiposUsuario, cargarDependencias]);

  useEffect(() => {
    if (sectionInicial === 'usuarios-ver') {
      setEditingUser(null);
      setActiveTab('datos');
    }
  }, [sectionInicial]);

  // Inicializa los permisos cuando se selecciona un usuario para editar
  useEffect(() => {
    if (editingUser) {
      const permisosUsuario = editingUser.permisos || []; 
      setPermisosDinamicos(permisosUsuario);
    }
  }, [editingUser]);

  const mostrarToast = (mensaje, tipo = 'success') => {
    setToastConfig({ visible: true, mensaje, tipo });
  };

  const cerrarModalBaja = () => setModalBajaConfig(prev => ({ ...prev, isOpen: false }));

  const irAEntornoUsuario = (user, pestañaInicial = 'datos') => {
    console.log(`✏️ Abriendo entorno unificado en pestaña [${pestañaInicial}] para:`, user);
    setEditingUser(user);
    setActiveTab(pestañaInicial);
    setSection('usuarios-crear');
  };

  const handleCheckboxChange = (slug) => {
    setPermisosDinamicos(prev => 
      prev.includes(slug) ? prev.filter(p => p !== slug) : [...prev, slug]
    );
  };

  const handleSaveUser = async (formData, idUsuarioEditar = null) => {
    const idFinal = idUsuarioEditar || editingUser?.id;
    const esEdicion = !!idFinal;
    
    const payloadCompleto = {
      ...formData,
      permisos: permisosDinamicos 
    };
    
    const resultado = await guardarUsuario(payloadCompleto, idFinal);
    
    if (resultado.ok) {
      mostrarToast(esEdicion ? 'Legajo y permisos actualizados correctamente.' : 'Operador registrado con éxito.', 'success');
      setEditingUser(null);
      setSection('usuarios-ver');
    }
    return resultado;
  };

  const handleToggleBaja = (usuario) => {
    const iraAInactivo = usuario.activo;
    
    setModalBajaConfig({
      isOpen: true,
      tipo: iraAInactivo ? 'danger' : 'warning',
      titulo: iraAInactivo ? '¿Procesar Baja Lógica?' : '¿Reactivar Operador?',
      mensaje: iraAInactivo
        ? `El operador ${usuario.nombre} perderá sus accesos inmediatos al sistema.`
        : `Se restaurará la jerarquía y permisos de acceso para ${usuario.nombre}.`,
      onConfirm: async () => {
        cerrarModalBaja();
        const resultado = await toggleBajaLogica(usuario.id);
        if (resultado.ok) {
          mostrarToast(iraAInactivo ? 'Baja lógica procesada con éxito.' : 'Operador reactivado correctamente.', 'success');
        } else {
          mostrarToast('Error al modificar el estado.', 'error');
        }
      }
    });
  };

  const renderRolBadge = (rolRaw) => {
    const config = ROLES_MAP[rolRaw] || { label: rolRaw || 'Sin Rol', class: 'standard', icon: <FiUsers size={12} /> };
    return (
      <span className={`badge-rol ${config.class}`}>
        {config.icon}
        <span style={{ marginLeft: '6px' }}>{config.label}</span>
      </span>
    );
  };

  // INTERFAZ EN MODO TRABAJO (Pestañas unificadas sin modales)
  if (sectionInicial === 'usuarios-crear') {
    return (
      <div className="usuarios-edicion-wrapper view-fade-in">
        
        {editingUser && (
          <div className="tabs-navigation-bar">
            <button 
              className={`tab-btn ${activeTab === 'datos' ? 'active' : ''}`}
              onClick={() => setActiveTab('datos')}
            >
              <FiUser size={14} />
              <span>Atributos Personales</span>
            </button>
            <button 
              className={`tab-btn ${activeTab === 'permisos' ? 'active' : ''}`}
              onClick={() => setActiveTab('permisos')}
            >
              <FiCheckSquare size={14} />
              <span>Permisos de Entorno</span>
            </button>
            <button 
              className={`tab-btn ${activeTab === 'detalles' ? 'active' : ''}`}
              onClick={() => setActiveTab('detalles')}
            >
              <FiFileText size={14} />
              <span>Ficha del Agente</span>
            </button>
          </div>
        )}

        {/* PESTAÑA 1: FORMULARIO */}
        {activeTab === 'datos' && (
          <FormularioUsuario 
            userToEdit={editingUser} 
            listaUsuarios={listaUsuarios}
            tiposUsuario={tiposUsuario}   
            dependencias={dependencias}   
            onSave={handleSaveUser} 
            onCancel={() => {
              setEditingUser(null);
              setSection('usuarios-ver');
            }} 
          />
        )}

        {/* PESTAÑA 2: CHECKBOXES DORADOS */}
        {activeTab === 'permisos' && (
          <div className="permisos-tab-container card-container-glow">
            <div className="permisos-tab-header">
              <h4>Matriz de Permisos Atómicos</h4>
              <p>Modifique los módulos del ecosistema para el legajo de <strong>{editingUser?.nombre} {editingUser?.apellido}</strong>.</p>
            </div>
            
            <div className="permisos-checkbox-grid">
              {todosLosPermisos.map(p => {
                const checked = permisosDinamicos.includes(p.slug);
                return (
                  <div 
                    key={p.slug} 
                    className={`permiso-checkbox-card ${checked ? 'selected-item' : ''}`}
                    onClick={() => handleCheckboxChange(p.slug)} // Al hacer click en la tarjeta conmuta el estado
                  >
                    <input 
                      type="checkbox" 
                      checked={checked}
                      className="gold-checkbox"
                      onChange={() => {}} // React exige un handler si el input está controlado, pero lo procesa el contenedor
                    />
                    <div className="permiso-checkbox-info">
                      <span className="permiso-slug-badge">{p.slug}</span>
                      <p className="permiso-nombre-desc">{p.nombre}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="form-submit-bar" style={{ marginTop: '2rem' }}>
              <button type="button" className="btn-cancel" onClick={() => setSection('usuarios-ver')}>
                Volver
              </button>
              <button 
                type="button" 
                className="btn-success-solid"
                onClick={() => handleSaveUser(editingUser)} 
              >
                Guardar Permisos y Salir
              </button>
            </div>
          </div>
        )}

        {/* PESTAÑA 3: FICHA DE DETALLES DEL AGENTE */}
        {activeTab === 'detalles' && editingUser && (
          <div className="permisos-tab-container card-container-glow view-fade-in">
            <div className="permisos-tab-header" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
              <h4>Resumen de Legajo Digital Centralizado</h4>
              <p>Datos duros e histórico del operador registrados en el sistema central.</p>
            </div>
            
            <div className="ficha-detalles-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
              <div className="detail-data-item"><strong>Nombre Completo:</strong> {editingUser.apellido}, {editingUser.nombre}</div>
              <div className="detail-data-item"><strong>Nombre de Usuario:</strong> {editingUser.username || 'N/C'}</div>
              <div className="detail-data-item"><strong>Documento Único (DNI):</strong> {editingUser.dni}</div>
              <div className="detail-data-item"><strong>Correo Oficial:</strong> {editingUser.email}</div>
              <div className="detail-data-item"><strong>Contacto Celular:</strong> {editingUser.celular || 'Sin Asignar'}</div>
              <div className="detail-data-item"><strong>Domicilio Registrado:</strong> {editingUser.calle ? `${editingUser.calle} N° ${editingUser.numero || ''}` : 'S/D'}</div>
              <div className="detail-data-item"><strong>Asignación Operativa:</strong> {editingUser.dependencia || 'Rectorado UNNE'}</div>
              <div className="detail-data-item"><strong>Rol del Sistema:</strong> {editingUser.rol}</div>
              <div className="detail-data-item"><strong>Estado del Legajo:</strong> {editingUser.activo ? 'Vigente / Activo' : 'Baja Lógica / Suspendido'}</div>
            </div>

            <div className="form-submit-bar" style={{ marginTop: '2.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
              <button type="button" className="btn-cancel" onClick={() => setSection('usuarios-ver')}>
                Cerrar Ficha y Volver
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="usuarios-container view-fade-in">
      <div className="usuarios-header">
        <div className="usuarios-header-titles">
          <h3>Ecosistema de Usuarios</h3>
          <p>
            <FiShield size={14} className="inline-icon" /> 
            Gestión jerárquica de accesos al sistema administrativo.
          </p>
        </div>
        <button className="btn-success-premium" onClick={() => { setEditingUser(null); setSection('usuarios-crear'); }}>
          <FiPlusCircle size={16} />
          <span>Nuevo Operador</span>
        </button>
      </div>

      {errorBackend && <div className="error-message-panel">{errorBackend}</div>}
      
      {loading ? (
        <div className="loading-spinner-panel">Sincronizando base de datos...</div>
      ) : (
        <div className="usuarios-grid-card">
          <table className="usuarios-tabla">
            <thead>
              <tr>
                <th>Personal / Email</th>
                <th>DNI / Celular</th>
                <th>Dependencia</th>
                <th>Rol Asignado</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right', paddingRight: '1.5rem' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {listaUsuarios.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    No se encontraron registros de personal.
                  </td>
                </tr>
              ) : (
                listaUsuarios.map(u => (
                  <tr key={u.id} className={`usuarios-fila ${!u.activo ? 'baja-logica' : ''}`}>
                    <td>
                      <div className="user-cell-name">{u.apellido}, {u.nombre}</div>
                      <div className="user-cell-email">{u.email}</div>
                    </td>
                    <td>
                      <div className="user-cell-dni">{u.dni}</div>
                      <div className="user-cell-phone">{u.celular || 'S/D'}</div>
                    </td>
                    <td className="user-cell-facultad" style={{ maxWidth: '240px', fontSize: '0.85rem' }}>
                      {u.dependencia || 'Rectorado UNNE'}
                    </td>
                    <td>
                      {renderRolBadge(u.rol)}
                    </td>
                    <td>
                      <span className={`status-indicator ${u.activo ? 'active' : 'inactive'}`}>
                        <span className="status-dot"></span>
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <div className="actions-wrapper">
                        {/* Al presionar Editar, el operador cae directo en 'datos', pero tiene las pestañas arriba */}
                        <button onClick={() => irAEntornoUsuario(u, 'datos')} disabled={!u.activo} className="btn-action edit" title="Editar Legajo e Historial">
                          <FiEdit3 size={15} />
                        </button>
                        <button onClick={() => handleToggleBaja(u)} className={`btn-action ${u.activo ? 'delete' : 'reactivate'}`} title={u.activo ? "Dar de baja" : "Reactivar"}>
                          {u.activo ? <FiTrash2 size={15} /> : <FiRefreshCw size={15} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal 
        isOpen={modalBajaConfig.isOpen}
        tipo={modalBajaConfig.tipo}
        titulo={modalBajaConfig.titulo}
        mensaje={modalBajaConfig.mensaje}
        onConfirm={modalBajaConfig.onConfirm}
        onCancel={cerrarModalBaja}
      />

      {toastConfig.visible && (
        <ToastNotification 
          mensaje={toastConfig.mensaje}
          tipo={toastConfig.tipo}
          onClose={() => setToastConfig(prev => ({ ...prev, visible: false }))}
        />
      )}
    </div>
  );
};

export default UsuariosCRUD;