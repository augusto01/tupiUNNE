import React, { useState, useEffect } from 'react';
import { UserPlus, UserCheck, User, IdCard, Phone, Mail, Shield, AlertCircle } from 'lucide-react';
import Swal from 'sweetalert2';
import './UsuariosCRUD.css';

const FormularioUsuario = ({ userToEdit, listaUsuarios = [], tiposUsuario = [], dependencias = [], onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    nombre: '',
    apellido: '',
    dni: '',
    celular: '',
    tipo_usuario_id: '', 
    dependencia_id: ''   
  });

  // Validaciones de duplicados en tiempo real
  const [erroresDuplicados, setErroresDuplicados] = useState({ 
    dniExiste: false, 
    emailExiste: false,
    usernameExiste: false 
  });

  useEffect(() => {
    if (userToEdit) {
      let normalizarRol = userToEdit.tipo_usuario_id || userToEdit.id_tipo_usuario || '';
      if (!normalizarRol && userToEdit.rol && tiposUsuario.length > 0) {
        const encontrado = tiposUsuario.find(t => 
          (t.nombre || '').toUpperCase() === (userToEdit.rol || '').toUpperCase()
        );
        if (encontrado) normalizarRol = encontrado.id;
      }

      let normalizarDependencia = userToEdit.dependencia_id || userToEdit.id_dependencia || '';
      if (!normalizarDependencia && userToEdit.dependencia && dependencias.length > 0) {
        const encontrada = dependencias.find(d => d.nombre === userToEdit.dependencia);
        if (encontrada) normalizarDependencia = encontrada.id;
      }

      setFormData({ 
        id: userToEdit.id,
        username: userToEdit.username || '',
        email: userToEdit.email || '',
        nombre: userToEdit.nombre || '',
        apellido: userToEdit.apellido || '',
        dni: userToEdit.dni || '',
        celular: userToEdit.celular || '',
        tipo_usuario_id: normalizarRol ? normalizarRol.toString() : '', 
        dependencia_id: normalizarDependencia ? normalizarDependencia.toString() : ''
      });
    } else {
      setFormData({
        username: '', email: '', nombre: '', apellido: '',
        dni: '', celular: '', tipo_usuario_id: '', dependencia_id: ''
      });
    }
  }, [userToEdit, tiposUsuario, dependencias]);

  // Comprobación de duplicados en tiempo real excluyendo al usuario actual si se edita
  useEffect(() => {
    const usuariosAComprobar = userToEdit 
      ? listaUsuarios.filter(u => u.id !== userToEdit.id)
      : listaUsuarios;

    const dniExiste = formData.dni 
      ? usuariosAComprobar.some(u => String(u.dni) === String(formData.dni)) 
      : false;

    const emailExiste = formData.email 
      ? usuariosAComprobar.some(u => (u.email || '').toLowerCase().trim() === formData.email.toLowerCase().trim()) 
      : false;

    const usernameExiste = formData.username 
      ? usuariosAComprobar.some(u => (u.username || '').toLowerCase().trim() === formData.username.toLowerCase().trim()) 
      : false;

    setErroresDuplicados({ dniExiste, emailExiste, usernameExiste });
  }, [formData.dni, formData.email, formData.username, listaUsuarios, userToEdit]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNumericInputChange = (e) => {
    const { name, value } = e.target;
    const cleanValue = value.replace(/\D/g, '');
    setFormData(prev => ({ ...prev, [name]: cleanValue }));
  };

  const handleSubmitForm = (e) => {
    e.preventDefault();
    
    if (erroresDuplicados.dniExiste || erroresDuplicados.emailExiste || erroresDuplicados.usernameExiste) return;

    if (!formData.email.toLowerCase().endsWith('@unne.edu.ar')) {
      Swal.fire({
        icon: 'error',
        title: 'Correo no válido',
        text: 'El correo debe pertenecer al dominio oficial @unne.edu.ar',
        confirmButtonColor: '#0284c7'
      });
      return;
    }

    if (!formData.tipo_usuario_id || !formData.dependencia_id) {
      Swal.fire({
        icon: 'warning',
        title: 'Atención',
        text: 'Debe seleccionar un Rol y una Unidad Operativa (UOC) válidos de la UNNE.',
        confirmButtonColor: '#0284c7'
      });
      return;
    }

    // Modal SweetAlert2 de confirmación
    Swal.fire({
      title: userToEdit ? '¿Guardar Cambios?' : '¿Confirmar Registro?',
      text: userToEdit 
        ? 'Se actualizarán las credenciales y la adscripción institucional del usuario.' 
        : 'Se enviará un correo de bienvenida al usuario con el enlace de activación de contraseña (válido por 7 días).',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#059669',
      cancelButtonColor: '#64748b',
      confirmButtonText: userToEdit ? 'Sí, guardar cambios' : 'Sí, registrar y enviar invitación',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        ejecutarGuardado();
      }
    });
  };

  const ejecutarGuardado = async () => {
    const resultado = await onSave(formData, userToEdit ? formData.id : null);
    
    if (resultado && !resultado.ok) {
      Swal.fire({
        icon: 'error',
        title: 'Error de procesamiento',
        text: resultado.error || 'No se pudo completar el registro del usuario.',
        confirmButtonColor: '#0284c7'
      });
    } else {
      Swal.fire({
        icon: 'success',
        title: userToEdit ? '¡Usuario Actualizado!' : '¡Invitación Enviada!',
        text: userToEdit 
          ? 'El legajo fue modificado correctamente.' 
          : 'Se ha enviado un correo con el enlace de activación al operador.',
        confirmButtonColor: '#059669'
      });
    }
  };

  const botonDeshabilitado = erroresDuplicados.dniExiste || erroresDuplicados.emailExiste || erroresDuplicados.usernameExiste;

  return (
    <div className="formulario-usuario-container view-fade-in">
      <div className="form-view-title-section">
        <div className="icon-wrapper-title">
          {userToEdit ? <UserCheck size={24} /> : <UserPlus size={24} />}
        </div>
        <div>
          <h2>{userToEdit ? 'Modificar Atributos de Usuario' : 'Nuevo Usuario'}</h2>
          <p>
            {userToEdit 
              ? 'Actualice el legajo y la adscripción institucional.' 
              : 'Se enviará un correo institucional con el enlace para la creación de la clave de acceso.'}
          </p>
        </div>
      </div>

      <div className="form-card-container">
        <form onSubmit={handleSubmitForm} className="usuarios-form-grid">
          
          {/* SECCIÓN 1: DATOS PERSONALES */}
          <div className="form-section-block">
            <h3><User size={16} /> Datos Identificatorios</h3>
            <div className="form-row row-2">
              <div className="form-group">
                <label>Nombre *</label>
                <input type="text" name="nombre" value={formData.nombre} onChange={handleInputChange} required placeholder="Ej: Augusto" />
              </div>
              <div className="form-group">
                <label>Apellido *</label>
                <input type="text" name="apellido" value={formData.apellido} onChange={handleInputChange} required placeholder="Ej: Almirón" />
              </div>
            </div>
            
            <div className="form-row row-2">
              <div className={`form-group ${erroresDuplicados.dniExiste ? 'input-error-shake' : ''}`}>
                <label><IdCard size={14} /> DNI (Documento Único) *</label>
                <input 
                  type="text" 
                  name="dni" 
                  value={formData.dni} 
                  onChange={handleNumericInputChange} 
                  required 
                  placeholder="Ej: 40123456"
                  className={erroresDuplicados.dniExiste ? 'input-error-border' : ''}
                />
                {erroresDuplicados.dniExiste && (
                  <span className="error-text-msg"><AlertCircle size={12} /> El DNI ya existe en el sistema</span>
                )}
              </div>
              <div className="form-group">
                <label><Phone size={14} /> Celular / Contacto</label>
                <input 
                  type="tel" 
                  name="celular" 
                  value={formData.celular} 
                  onChange={handleNumericInputChange} 
                  placeholder="Ej: 3794001122" 
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: ROLES Y UOC */}
          <div className="form-section-block">
            <h3><Shield size={16} /> Asignación Institucional (UOC)</h3>
            <div className={`form-group ${erroresDuplicados.emailExiste ? 'input-error-shake' : ''}`}>
              <label><Mail size={14} /> Correo Electrónico Oficial *</label>
              <input 
                type="email" 
                name="email" 
                value={formData.email} 
                onChange={handleInputChange} 
                required 
                placeholder="ejemplo@unne.edu.ar"
                pattern=".+@unne\.edu\.ar"
                title="Únicamente se admiten correos institucionales con la extensión @unne.edu.ar"
                className={erroresDuplicados.emailExiste ? 'input-error-border' : ''}
              />
              {erroresDuplicados.emailExiste && (
                <span className="error-text-msg"><AlertCircle size={12} /> El correo ya existe en el sistema</span>
              )}
            </div>

            <div className="form-row row-2">
              <div className="form-group">
                <label>Rol de Sistema *</label>
                <select 
                  name="tipo_usuario_id" 
                  value={formData.tipo_usuario_id} 
                  onChange={handleInputChange} 
                  required
                >
                  <option value="">Seleccione un Rol...</option>
                  {tiposUsuario.map(rol => (
                    <option key={rol.id} value={rol.id.toString()}>
                      {rol.nombre}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Unidad Operativa de Contratación (UOC) *</label>
                <select 
                  name="dependencia_id" 
                  value={formData.dependencia_id} 
                  onChange={handleInputChange} 
                  required
                >
                  <option value="">Seleccione UOC / Dependencia...</option>
                  {dependencias.map(dep => (
                    <option key={dep.id} value={dep.id.toString()}>
                      {dep.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: ACCESO E IDENTIFICADOR */}
          <div className="form-section-block">
            <h3><User size={16} /> Credenciales de Acceso</h3>
            <div className="form-row row-2">
              <div className={`form-group ${erroresDuplicados.usernameExiste ? 'input-error-shake' : ''}`}>
                <label>Nombre de Usuario (Username) *</label>
                <input 
                  type="text" 
                  name="username" 
                  value={formData.username} 
                  onChange={handleInputChange} 
                  required 
                  placeholder="Ej: augusto.almiron" 
                  className={erroresDuplicados.usernameExiste ? 'input-error-border' : ''}
                />
                {erroresDuplicados.usernameExiste && (
                  <span className="error-text-msg"><AlertCircle size={12} /> El nombre de usuario ya está registrado</span>
                )}
              </div>
            </div>
          </div>

          <div className="form-submit-bar">
            <button type="button" className="btn-cancel" onClick={onCancel}>
              Cancelar
            </button>
            <button 
              type="submit" 
              className={`btn-success-solid gap-icon-flex ${botonDeshabilitado ? 'btn-disabled' : ''}`}
              disabled={botonDeshabilitado}
            >
              {userToEdit ? (
                <>
                  <UserCheck size={16} />
                  <span>Guardar Cambios</span>
                </>
              ) : (
                <>
                  <UserPlus size={16} />
                  <span>Registrar y Enviar Enlace</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default FormularioUsuario;