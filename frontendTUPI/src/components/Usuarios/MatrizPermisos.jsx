import React from 'react';

const TODOS_LOS_PERMISOS = [
  { slug: 'panel', nombre: 'Acceso al Dashboard Principal' },
  { slug: 'usuarios', nombre: 'Gestión Completa de Personal (CRUD)' },
  { slug: 'compras', nombre: 'Administración de Planes de Compras (PAC)' },
  { slug: 'correlatos', nombre: 'Vincular ítems y Matrices de Control' },
  { slug: 'expedientes', nombre: 'Gestión de Expedientes Institucionales' },
];

const MatrizPermisos = ({ usuario, permisosSeleccionados = [], onChangePermiso, onSave, onCancel }) => {
  return (
    <div className="permisos-tab-container card-container-glow view-fade-in">
      <div className="permisos-tab-header">
        <h4>Matriz de Permisos Atómicos</h4>
        <p>
          Modifique los módulos habilitados para el legajo de{' '}
          <strong>{usuario?.nombre} {usuario?.apellido}</strong>.
        </p>
      </div>

      <div className="permisos-checkbox-grid">
        {TODOS_LOS_PERMISOS.map((p) => {
          const checked = permisosSeleccionados.includes(p.slug);
          return (
            <div
              key={p.slug}
              className={`permiso-checkbox-card ${checked ? 'selected-item' : ''}`}
              onClick={() => onChangePermiso(p.slug)}
            >
              <input
                type="checkbox"
                checked={checked}
                className="gold-checkbox"
                onChange={() => {}} // Manejado por el contenedor
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
        <button type="button" className="btn-cancel" onClick={onCancel}>
          Volver
        </button>
        <button type="button" className="btn-success-solid" onClick={onSave}>
          Guardar Permisos
        </button>
      </div>
    </div>
  );
};

export default MatrizPermisos;