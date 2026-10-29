import React from 'react';

const FichaAgente = ({ usuario, onVolver }) => {
  if (!usuario) return null;

  const iniciales = `${usuario.nombre?.[0] || ''}${usuario.apellido?.[0] || ''}`.toUpperCase();

  return (
    <div className="ficha-agente-container view-fade-in">
      <div className="ficha-profile-header">
        <div className="ficha-avatar-large">{iniciales}</div>
        <div className="ficha-profile-titles">
          <h4>{usuario.apellido}, {usuario.nombre}</h4>
          <p>{usuario.email || 'Correo no registrado'}</p>
        </div>
      </div>

      <div className="ficha-detalles-grid">
        <div className="ficha-item">
          <span className="ficha-label">Nombre Completo</span>
          <span className="ficha-valor">{usuario.apellido}, {usuario.nombre}</span>
        </div>

        <div className="ficha-item">
          <span className="ficha-label">Nombre de Usuario (Username)</span>
          <span className="ficha-valor">{usuario.username || 'Sin Username'}</span>
        </div>

        <div className="ficha-item">
          <span className="ficha-label">DNI (Documento Único)</span>
          <span className="ficha-valor">{usuario.dni}</span>
        </div>

        <div className="ficha-item">
          <span className="ficha-label">Correo Institucional</span>
          <span className="ficha-valor">{usuario.email}</span>
        </div>

        <div className="ficha-item">
          <span className="ficha-label">Teléfono de Contacto</span>
          <span className="ficha-valor">{usuario.celular || 'Sin Asignar'}</span>
        </div>

        <div className="ficha-item">
          <span className="ficha-label">Unidad Operativa (UOC)</span>
          <span className="ficha-valor">{usuario.dependencia || 'Sin Asignar'}</span>
        </div>

        <div className="ficha-item">
          <span className="ficha-label">Rol Asignado</span>
          <span className="ficha-valor">{usuario.rol || 'Sin Rol'}</span>
        </div>

        <div className="ficha-item">
          <span className="ficha-label">Estado de Legajo</span>
          <span className={`ficha-valor badge-status ${usuario.activo ? 'active' : 'inactive'}`}>
            {usuario.activo ? 'Vigente / Activo' : 'Baja Lógica / Inactivo'}
          </span>
        </div>
      </div>

      <div className="form-submit-bar" style={{ marginTop: '2.5rem' }}>
        <button type="button" className="btn-cancel" onClick={onVolver}>
          Cerrar Ficha y Volver
        </button>
      </div>
    </div>
  );
};

export default FichaAgente;