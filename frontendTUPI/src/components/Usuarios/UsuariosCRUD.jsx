import React, { useState, useEffect } from 'react';
import { FiPlusCircle, FiEdit3, FiTrash2, FiRefreshCw, FiShield } from 'react-icons/fi';
import { useUsuarios } from '../hooks/useUsuarios';
import FormularioUsuario from './FormularioUsuario';
import ConfirmModal from '../Modals/ConfirmModal';
import ToastNotification from '../Modals/ToastNotification';
import './UsuariosCRUD.css';

const UsuariosCRUD = ({ sectionInicial, setSection }) => {
  const { 
    listaUsuarios, 
    loading, 
    errorBackend, 
    cargarUsuarios, 
    guardarUsuario, 
    toggleBajaLogica 
  } = useUsuarios();

  const [editingUser, setEditingUser] = useState(null);
  const [modalBajaConfig, setModalBajaConfig] = useState({ isOpen: false, tipo: '', titulo: '', mensaje: '', onConfirm: null });
  const [toastConfig, setToastConfig] = useState({ visible: false, mensaje: '', tipo: '' });

  useEffect(() => {
    cargarUsuarios();
  }, [cargarUsuarios]);

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
    setEditingUser(user);
    setSection('usuarios-crear');
  };

  // --- PROCESADOR CENTRALIZADO CON RETORNO ---
  const handleSaveUser = async (formData) => {
    const esEdicion = !!editingUser;
    const resultado = await guardarUsuario(formData, editingUser?.id);
    
    if (resultado.ok) {
      // ÉXITO: Mostramos el Toast en el padre y volvemos a la grilla
      mostrarToast(esEdicion ? 'Operador actualizado con éxito.' : 'Operador registrado con éxito.', 'success');
      setEditingUser(null);
      setSection('usuarios-ver');
    }
    
    // Devolvemos el resultado completo al formulario para que evalúe si hubo errores
    return resultado;
  };

  const handleToggleBaja = (usuario) => {
    const iraAInactivo = usuario.activo;
    
    setModalBajaConfig({
      isOpen: true,
      tipo: iraAInactivo ? 'danger' : 'warning',
      titulo: iraAInactivo ? '¿Procesar Baja Lógica?' : '¿Reactivar Operador?',
      mensaje: iraAInactivo
        ? `El operador ${usuario.nombre} perderá sus accesos inmediatos al sistema hasta su revocación.`
        : `Se restaurará la jerarquía y permisos de acceso para ${usuario.nombre}.`,
      onConfirm: async () => {
        cerrarModalBaja();
        const resultado = await toggleBajaLogica(usuario.id);
        if (resultado.ok) {
          mostrarToast(iraAInactivo ? 'Baja lógica procesada con éxito.' : 'Operador reactivado correctamente.', 'success');
        } else {
          mostrarToast('Error al modificar el estado en el servidor.', 'error');
        }
      }
    });
  };

  if (sectionInicial === 'usuarios-crear') {
    return (
      <FormularioUsuario 
        userToEdit={editingUser} 
        listaUsuarios={listaUsuarios}
        onSave={handleSaveUser} 
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
            Control de accesos restringido exclusivamente para la Jerarquía de Super Usuario.
          </p>
        </div>
        <button className="btn-success-premium" onClick={() => setSection('usuarios-crear')}>
          <FiPlusCircle size={16} />
          <span>Nuevo Operador</span>
        </button>
      </div>

      {errorBackend && <div className="error-message-panel">{errorBackend}</div>}
      
      {loading ? (
        <div className="loading-spinner-panel">Cargando operadores del sistema...</div>
      ) : (
        <div className="usuarios-grid-card">
          <table className="usuarios-tabla">
            <thead>
              <tr>
                <th>Personal / Email</th>
                <th>DNI / Celular</th>
                <th>Dirección</th>
                <th>Dependencia</th>
                <th>Rol Asignado</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right', paddingRight: '1.5rem' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {listaUsuarios.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No hay usuarios registrados en el sistema.
                  </td>
                </tr>
              ) : (
                listaUsuarios.map(u => (
                  <tr key={u.id} className={`usuarios-fila ${!u.activo ? 'baja-logica' : ''}`}>
                    <td>
                      <div className="user-cell-name">{u.apellido || ''}, {u.nombre}</div>
                      <div className="user-cell-email">{u.email}</div>
                    </td>
                    <td>
                      <div className="user-cell-dni">DNI: {u.dni}</div>
                      <div className="user-cell-phone">{u.celular || 'N/C'}</div>
                    </td>
                    <td>
                      <div className="user-cell-address">
                        {u.calle ? `${u.calle} ${u.numero}` : 'No especificada'}
                      </div>
                    </td>
                    <td className="user-cell-facultad">{u.facultad || 'RECTORADO'}</td>
                    <td>
                      <span className={`badge-rol ${u.rol === 'Super_Usuario' ? 'super-user' : 'standard'}`}>
                        {u.rol || 'Operador'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-indicator ${u.activo ? 'active' : 'inactive'}`}>
                        <span className="status-dot"></span>
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <div className="actions-wrapper">
                        <button onClick={() => irAEditar(u)} disabled={!u.activo} className="btn-action edit">
                          <FiEdit3 size={15} />
                        </button>
                        <button onClick={() => handleToggleBaja(u)} className={`btn-action ${u.activo ? 'delete' : 'reactivate'}`}>
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

      {/* TOAST EXCLUSIVO DEL PADRE (Para Bajas, Reactivaciones y Éxitos de Formulario) */}
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