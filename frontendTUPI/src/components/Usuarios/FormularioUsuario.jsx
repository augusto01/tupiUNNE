import React, { useState, useEffect } from 'react';
import { UserPlus, UserCheck, User, IdCard, Phone, MapPin, Mail, Shield, Key, AlertCircle } from 'lucide-react';
import ConfirmModal from '../Modals/ConfirmModal';
import ToastNotification from '../Modals/ToastNotification';
import './UsuariosCRUD.css';

const FormularioUsuario = ({ userToEdit, listaUsuarios = [], tiposUsuario = [], dependencias = [], onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    nombre: '',
    apellido: '',
    dni: '',
    celular: '',
    calle: '',
    numero: '',
    tipo_usuario_id: '', 
    dependencia_id: ''   
  });

  const [modalConfirmar, setModalConfirmar] = useState(false);
  const [toastConfig, setToastConfig] = useState({ visible: false, mensaje: '', tipo: '' });
  const [erroresDuplicados, setErroresDuplicados] = useState({ dniExiste: false, emailExiste: false });

  // Efecto para cargar los datos en caso de edición mapeando correctamente las FKs sueltas u objetos anidados
  useEffect(() => {
    if (userToEdit) {
      console.log("👉 Datos originales del backend al editar:", userToEdit);

      // 1. Buscamos el ID del rol por propiedad directa o resolviendo el texto contra el array de tiposUsuario
      let normalizarRol = userToEdit.tipo_usuario_id || userToEdit.id_tipo_usuario || userToEdit.rol_id || '';
      if (!normalizarRol && userToEdit.rol && tiposUsuario.length > 0) {
        const encontrado = tiposUsuario.find(t => t.nombre === userToEdit.rol);
        if (encontrado) normalizarRol = encontrado.id;
      }

      // 2. Buscamos el ID de la dependencia por propiedad directa o resolviendo el texto contra el array de dependencias
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
        calle: userToEdit.calle || '',
        numero: userToEdit.numero || '',
        tipo_usuario_id: normalizarRol ? normalizarRol.toString() : '', 
        dependencia_id: normalizarDependencia ? normalizarDependencia.toString() : '',
        password: '' 
      });
    } else {
      // Limpiamos el formulario si es una creación limpia
      setFormData({
        username: '', email: '', password: '', nombre: '', apellido: '',
        dni: '', celular: '', calle: '', numero: '', tipo_usuario_id: '', dependencia_id: ''
      });
    }
  }, [userToEdit, tiposUsuario, dependencias]); // Escucha cambios en los catálogos para resolver nombres si es necesario

  // Validación de duplicados en tiempo real (excluyendo al usuario que se está editando)
  useEffect(() => {
    const usuariosAComprobar = userToEdit 
      ? listaUsuarios.filter(u => u.id !== userToEdit.id)
      : listaUsuarios;

    const dniExiste = formData.dni ? usuariosAComprobar.some(u => String(u.dni) === String(formData.dni)) : false;
    const emailExiste = formData.email ? usuariosAComprobar.some(u => u.email.toLowerCase().trim() === formData.email.toLowerCase().trim()) : false;

    setErroresDuplicados({ dniExiste, emailExiste });
  }, [formData.dni, formData.email, listaUsuarios, userToEdit]);

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
    
    if (erroresDuplicados.dniExiste || erroresDuplicados.emailExiste) return;

    if (!formData.email.toLowerCase().endsWith('@unne.edu.ar')) {
      setToastConfig({
        visible: true,
        mensaje: "El correo debe pertenecer al dominio @unne.edu.ar",
        tipo: "error"
      });
      return;
    }

    if (!formData.tipo_usuario_id || !formData.dependencia_id) {
      setToastConfig({
        visible: true,
        mensaje: "Debe seleccionar un Rol y una Dependencia válidos de la UNNE.",
        tipo: "error"
      });
      return;
    }

    setModalConfirmar(true);
  };

  const ejecutarGuardadoConfirmado = async () => {
    setModalConfirmar(false);
    
    // Le pasamos el formData y el ID si es una edición
    const resultado = await onSave(formData, userToEdit ? formData.id : null);
    
    if (resultado && !resultado.ok) {
      setToastConfig({
        visible: true,
        mensaje: resultado.error || 'Error en el procesamiento del registro.',
        tipo: 'error'
      });
    }
  };

  const botonDeshabilitado = erroresDuplicados.dniExiste || erroresDuplicados.emailExiste;

  return (
    <div className="formulario-usuario-container view-fade-in">
      
      <div className="form-view-title-section">
        <div className="icon-wrapper-title">
          {userToEdit ? <UserCheck size={24} /> : <UserPlus size={24} />}
        </div>
        <div>
          <h2>{userToEdit ? 'Modificar Atributos de Usuario' : 'Nuevo Usuario'}</h2>
          <p>{userToEdit ? 'Actualice las credenciales y la ubicación del agente.' : 'Complete el legajo digital para el alta en el sistema centralizado.'}</p>
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

          {/* SECCIÓN 2: DOMICILIO */}
          <div className="form-section-block">
            <h3><MapPin size={16} /> Localización Residencial</h3>
            <div className="form-row row-flex-address">
              <div className="form-group flex-grow-3">
                <label>Calle</label>
                <input type="text" name="calle" value={formData.calle} onChange={handleInputChange} placeholder="Ej: Av. Libertad" />
              </div>
              <div className="form-group flex-grow-1">
                <label>Número</label>
                <input 
                  type="text" 
                  name="numero" 
                  value={formData.numero} 
                  onChange={handleNumericInputChange} 
                  placeholder="Ej: 5450" 
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: ROLES E INSTITUCIÓN UNNE */}
          <div className="form-section-block">
            <h3><Shield size={16} /> Asignación Institucional</h3>
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
                <label>Unidad Académica / Dependencia *</label>
                <select 
                  name="dependencia_id" 
                  value={formData.dependencia_id} 
                  onChange={handleInputChange} 
                  required
                >
                  <option value="">Seleccione Dependencia...</option>
                  {dependencias.map(dep => (
                    <option key={dep.id} value={dep.id.toString()}>
                      {dep.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* SECCIÓN 4: ACCESO Y CREDENCIALES */}
          <div className="form-section-block">
            <h3><Key size={16} /> Credenciales de Acceso</h3>
            <div className="form-row row-2">
              <div className="form-group">
                <label>Nombre de Usuario (Username) *</label>
                <input type="text" name="username" value={formData.username} onChange={handleInputChange} required placeholder="Ej: augusto.log" />
              </div>
              
              {!userToEdit && (
                <div className="form-group">
                  <label>Contraseña de Sistema *</label>
                  <input 
                    type="password" 
                    name="password" 
                    value={formData.password} 
                    onChange={handleInputChange} 
                    required 
                    placeholder="Escriba una contraseña segura" 
                  />
                </div>
              )}
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
                  <span>Agregar Usuario</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>

      <ConfirmModal 
        isOpen={modalConfirmar}
        tipo="success"
        titulo={userToEdit ? '¿Guardar Cambios?' : '¿Confirmar Registro?'}
        mensaje={userToEdit 
          ? `Vas a impactar las modificaciones de credenciales de este operador en la base central.` 
          : `Se dará de alta de manera inmediata el legajo del operador en el ecosistema de la UNNE.`}
        onConfirm={ejecutarGuardadoConfirmado}
        onCancel={() => setModalConfirmar(false)}
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

export default FormularioUsuario;