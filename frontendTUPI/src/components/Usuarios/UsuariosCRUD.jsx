import React, { useState, useEffect } from 'react';
import { FiPlusCircle, FiEdit3, FiTrash2, FiRefreshCw, FiShield, FiUserCheck, FiUsers } from 'react-icons/fi';
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
  const [modalBajaConfig, setModalBajaConfig] = useState({ isOpen: false, tipo: '', titulo: '', mensaje: '', onConfirm: null });
  const [toastConfig, setToastConfig] = useState({ visible: false, mensaje: '', tipo: '' });

  // Disparamos la sincronización completa al montar el componente
  useEffect(() => {
    cargarUsuarios();
    cargarTiposUsuario();
    cargarDependencias();
  }, [cargarUsuarios, cargarTiposUsuario, cargarDependencias]);

  useEffect(() => {
    if (sectionInicial === 'usuarios-ver') {
      setEditingUser(null);
    }
  }, [sectionInicial]);

  const mostrarToast = (mensaje, tipo = 'success') => {
    setToastConfig({ visible: true, mensaje, tipo });
  };

  const cerrarModalBaja = () => setModalBajaConfig(prev => ({ ...prev, isOpen: false }));

  const irAEditar = (user) => {
    console.log("✏️ Enviando usuario al formulario de edición:", user);
    setEditingUser(user);
    setSection('usuarios-crear');
  };

  // 🔥 CORREGIDO: Recibe explícitamente el ID que manda el Formulario o usa la referencia del estado
  const handleSaveUser = async (formData, idUsuarioEditar = null) => {
    const idFinal = idUsuarioEditar || editingUser?.id;
    const esEdicion = !!idFinal;
    
    const resultado = await guardarUsuario(formData, idFinal);
    
    if (resultado.ok) {
      mostrarToast(esEdicion ? 'Operador actualizado con éxito.' : 'Operador registrado con éxito.', 'success');
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

  if (sectionInicial === 'usuarios-crear') {
    return (
      <FormularioUsuario 
        userToEdit={editingUser} 
        listaUsuarios={listaUsuarios}
        tiposUsuario={tiposUsuario}   
        dependencias={dependencias}   
        onSave={handleSaveUser} // Sincronizado con los parámetros dinámicos
        onCancel={() => {
          setEditingUser(null);
          setSection('usuarios-ver');
        }} 
      />
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
                        <button onClick={() => irAEditar(u)} disabled={!u.activo} className="btn-action edit" title="Editar Perfil">
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