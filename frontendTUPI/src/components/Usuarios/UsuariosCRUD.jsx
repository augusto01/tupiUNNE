import React, { useState, useEffect } from 'react';
import { PlusCircle, Edit3, Trash2, RefreshCw } from 'lucide-react';
import './UsuariosCRUD.css'; // <--- IMPORTACIÓN DEL NUEVO CSS

const UsuariosCRUD = ({ sectionInicial, setSection }) => {
  const [listaUsuarios, setListaUsuarios] = useState([
    { id: 1, nombre: 'Augusto Almirón', email: 'a.almiron@rectorado.unne.edu.ar', rol: 'Super_Usuario', facultad: 'RECTORADO', activo: true },
    { id: 2, nombre: 'Dr. Ruben Bernal', email: 'r.bernal@academica.unne.edu.ar', rol: 'Administrador', facultad: 'RECTORADO', activo: true },
    { id: 3, nombre: 'Operador Ejemplo', email: 'operador@exa.unne.edu.ar', rol: 'Operador', facultad: 'FACENA', activo: false }
  ]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    rol: 'Operador',
    facultad: 'RECTORADO'
  });

  useEffect(() => {
    if (sectionInicial === 'usuarios-crear') {
      abrirFormularioNuevo();
    }
  }, [sectionInicial]);

  const abrirFormularioNuevo = () => {
    setEditingUser(null);
    setFormData({ nombre: '', email: '', rol: 'Operador', facultad: 'RECTORADO' });
    setModalOpen(true);
  };

  const abrirEditar = (user) => {
    setEditingUser(user);
    setFormData({
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
      facultad: user.facultad
    });
    setModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingUser) {
      setListaUsuarios(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...formData } : u));
    } else {
      const nuevo = { id: Date.now(), ...formData, activo: true };
      setListaUsuarios(prev => [nuevo, ...prev]);
    }
    setModalOpen(false);
    setSection('usuarios-ver');
  };

  const toggleBajaLogica = (id) => {
    setListaUsuarios(prev => prev.map(u => u.id === id ? { ...u, activo: !u.activo } : u));
  };

  return (
    <div className="usuarios-container content-section-fade">
      
      {/* HEADER */}
      <div className="usuarios-header">
        <div className="usuarios-header-titles">
          <h3>Ecosistema de Usuarios</h3>
          <p>Control de accesos restringido exclusivamente para la Jerarquía de Super Usuario.</p>
        </div>
        <button className="btn-success-premium" onClick={abrirFormularioNuevo}>
          <PlusCircle size={14} />
          <span>Nuevo Operador</span>
        </button>
      </div>

      {/* GRID / TABLA */}
      <div className="usuarios-grid-card">
        <table className="usuarios-tabla">
          <thead>
            <tr>
              <th>Usuario / Email</th>
              <th>Dependencia</th>
              <th>Rol Asignado</th>
              <th>Estado</th>
              <th style={{ textAlign: 'right', paddingRight: '1.5rem' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {listaUsuarios.map(u => (
              <tr key={u.id} className={`usuarios-fila ${!u.activo ? 'baja-logica' : ''}`}>
                <td>
                  <div className="user-cell-name">{u.nombre}</div>
                  <div className="user-cell-email">{u.email}</div>
                </td>
                <td className="user-cell-facultad">{u.facultad}</td>
                <td>
                  <span className={`badge-rol ${u.rol === 'Super_Usuario' ? 'super-user' : 'standard'}`}>
                    {u.rol}
                  </span>
                </td>
                <td>
                  <span className={`status-indicator ${u.activo ? 'active' : 'inactive'}`}>
                    <span className="status-dot"></span>
                    {u.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td>
                  <div className="actions-wrapper" style={{ paddingRight: '0.5rem' }}>
                    <button 
                      onClick={() => abrirEditar(u)} 
                      disabled={!u.activo}
                      className="btn-action edit"
                      style={{ opacity: u.activo ? 1 : 0.3, cursor: u.activo ? 'pointer' : 'not-allowed' }}
                    >
                      <Edit3 size={15} />
                    </button>
                    <button onClick={() => toggleBajaLogica(u.id)} className={`btn-action ${u.activo ? 'delete' : 'reactivate'}`}>
                      {u.activo ? <Trash2 size={15} /> : <RefreshCw size={15} />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content content-section-fade">
            <h4>{editingUser ? 'Modificar Atributos' : 'Registrar Operador'}</h4>
            
            <form onSubmit={handleSubmit} className="usuarios-form">
              <div className="form-group">
                <label>Nombre y Apellido</label>
                <input type="text" name="nombre" value={formData.nombre} onChange={handleInputChange} required />
              </div>

              <div className="form-group">
                <label>Correo Electrónico Oficial</label>
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} required />
              </div>

              <div className="form-group">
                <label>Rol de Sistema</label>
                <select name="rol" value={formData.rol} onChange={handleInputChange}>
                  <option value="Operador">Operador Estándar</option>
                  <option value="Administrador">Administrador de Facultad</option>
                  <option value="Super_Usuario">Super Usuario (Rectorado)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Unidad Académica / Dependencia</label>
                <input type="text" name="facultad" value={formData.facultad} onChange={handleInputChange} placeholder="Ej: FACENA, RECTORADO" required />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => { setModalOpen(false); setSection('usuarios-ver'); }}>
                  Cancelar
                </button>
                <button type="submit" className="btn-success-solid">
                  {editingUser ? 'Guardar Cambios' : 'Confirmar Alta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsuariosCRUD;