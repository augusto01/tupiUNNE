import React, { useState, useEffect } from 'react';
import { 
  FiPlusCircle, FiEdit3, FiTrash2, FiRefreshCw, FiShield, 
  FiUserCheck, FiUsers, FiCheckSquare, FiUser, FiFileText, FiAward 
} from 'react-icons/fi';
import Swal from 'sweetalert2';
import { useUsuarios } from '../hooks/useUsuarios';
import FormularioUsuario from './FormularioUsuario';
import MatrizPermisos from './MatrizPermisos';
import FichaAgente from './FichaAgente';
import './UsuariosCRUD.css';

const ROLES_CONFIG = {
  'SUPERADMIN': { label: 'Super Admin', class: 'super-user', icon: <FiShield size={12} /> },
  'ADMINISTRADOR': { label: 'Administrador', class: 'admin-user', icon: <FiUserCheck size={12} /> },
  'AUTORIZANTE': { label: 'Autorizante Sector (UOC)', class: 'autorizante-user', icon: <FiAward size={12} /> },
  'USUARIO': { label: 'Usuario Común', class: 'standard', icon: <FiUsers size={12} /> },
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
  const [permisosDinamicos, setPermisosDinamicos] = useState([]);

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

  useEffect(() => {
    if (editingUser) {
      setPermisosDinamicos(editingUser.permisos || []);
    } else {
      setPermisosDinamicos([]);
    }
  }, [editingUser]);

  const irAEntornoUsuario = (user, pestañaInicial = 'datos') => {
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
    
    if (resultado && resultado.ok) {
      setEditingUser(null);
      setSection('usuarios-ver');
      cargarUsuarios();
    }
    return resultado;
  };

  const handleSavePermisosUnicos = async () => {
    if (!editingUser) return;

    const payload = {
      username: editingUser.username,
      email: editingUser.email,
      nombre: editingUser.nombre,
      apellido: editingUser.apellido,
      dni: editingUser.dni,
      celular: editingUser.celular,
      tipo_usuario_id: editingUser.tipo_usuario_id,
      dependencia_id: editingUser.dependencia_id,
      permisos: permisosDinamicos
    };

    const resultado = await guardarUsuario(payload, editingUser.id);

    if (resultado && resultado.ok) {
      Swal.fire({
        icon: 'success',
        title: '¡Permisos Actualizados!',
        text: 'La matriz de permisos del operador fue guardada correctamente.',
        confirmButtonColor: '#059669'
      });
      setEditingUser(null);
      setSection('usuarios-ver');
      cargarUsuarios();
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error de actualización',
        text: resultado.error || 'No se pudieron actualizar los permisos.',
        confirmButtonColor: '#0284c7'
      });
    }
  };

  //  Confirmación de Baja Lógica / Reactivación con SweetAlert2 que cubre el 100% de la pantalla
  const handleToggleBaja = (usuario) => {
    const iraAInactivo = usuario.activo;

    Swal.fire({
      title: iraAInactivo ? '¿Procesar Baja Lógica?' : '¿Reactivar Operador?',
      text: iraAInactivo
        ? `El operador ${usuario.nombre} ${usuario.apellido} perderá acceso inmediato al sistema.`
        : `Se restaurarán los accesos para ${usuario.nombre} ${usuario.apellido}.`,
      icon: iraAInactivo ? 'warning' : 'question',
      showCancelButton: true,
      confirmButtonColor: iraAInactivo ? '#ef4444' : '#059669',
      cancelButtonColor: '#64748b',
      confirmButtonText: iraAInactivo ? 'Sí, dar de baja' : 'Sí, reactivar',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        const resultado = await toggleBajaLogica(usuario.id);
        if (resultado && resultado.ok) {
          Swal.fire({
            icon: 'success',
            title: iraAInactivo ? 'Baja Procesada' : 'Usuario Reactivado',
            text: iraAInactivo ? 'El operador fue dado de baja correctamente.' : 'El operador fue reactivado exitosamente.',
            confirmButtonColor: '#0284c7'
          });
          // 🎯 Sincronización automática de la grilla
          await cargarUsuarios();
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: resultado.error || 'No se pudo modificar el estado del usuario.',
            confirmButtonColor: '#0284c7'
          });
        }
      }
    });
  };

  const renderRolBadge = (rolRaw) => {
    const key = (rolRaw || '').toUpperCase();
    const config = ROLES_CONFIG[key] || { label: rolRaw || 'Sin Rol', class: 'standard', icon: <FiUsers size={12} /> };
    return (
      <span className={`badge-rol ${config.class}`}>
        {config.icon}
        <span style={{ marginLeft: '6px' }}>{config.label}</span>
      </span>
    );
  };

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
              <span>Matriz de Permisos</span>
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

        {activeTab === 'permisos' && (
          <MatrizPermisos 
            usuario={editingUser}
            permisosSeleccionados={permisosDinamicos}
            onChangePermiso={handleCheckboxChange}
            onSave={handleSavePermisosUnicos}
            onCancel={() => setSection('usuarios-ver')}
          />
        )}

        {activeTab === 'detalles' && (
          <FichaAgente 
            usuario={editingUser}
            onVolver={() => setSection('usuarios-ver')}
          />
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
            Gestión de usuarios y asignación de Unidades Operativas de Contratación (UOC).
          </p>
        </div>
        <button className="btn-success-premium" onClick={() => { setEditingUser(null); setSection('usuarios-crear'); }}>
          <FiPlusCircle size={16} />
          <span>Nuevo Operador</span>
        </button>
      </div>

      {errorBackend && <div className="error-message-panel">{errorBackend}</div>}
      
      {loading ? (
        <div className="loading-spinner-panel">Sincronizando base de datos central...</div>
      ) : (
        <div className="usuarios-grid-card">
          <table className="usuarios-tabla">
            <thead>
              <tr>
                <th>Personal / Email</th>
                <th>DNI / Celular</th>
                <th>Unidad Operativa (UOC)</th>
                <th>Rol Asignado</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right', paddingRight: '1.5rem' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {listaUsuarios.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    No se encontraron registros de usuarios en el sistema.
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
                    <td className="user-cell-facultad" style={{ maxWidth: '260px', fontSize: '0.85rem' }}>
                      {u.dependencia || 'Sin Asignar'}
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
                        <button onClick={() => irAEntornoUsuario(u, 'datos')} disabled={!u.activo} className="btn-action edit" title="Editar Legajo">
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
    </div>
  );
};

export default UsuariosCRUD;