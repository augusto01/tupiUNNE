import React, { useState, useEffect } from 'react';
import { UserPlus, UserCheck, ArrowLeft, User, IdCard, Phone, MapPin, Mail, Shield, Key, AlertCircle } from 'lucide-react';
import ConfirmModal from '../Modals/ConfirmModal';
import ToastNotification from '../Modals/ToastNotification';
import './UsuariosCRUD.css';

const FormularioUsuario = ({ userToEdit, listaUsuarios = [], onSave, onCancel }) => {
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
    rol: 'Operador',
    facultad: 'RECTORADO'
  });

  const [modalConfirmar, setModalConfirmar] = useState(false);
  const [toastConfig, setToastConfig] = useState({ visible: false, mensaje: '', tipo: '' });
  const [erroresDuplicados, setErroresDuplicados] = useState({ dniExiste: false, emailExiste: false });

  useEffect(() => {
    if (userToEdit) {
      setFormData({ 
        ...userToEdit,
        password: '' 
      });
    }
  }, [userToEdit]);

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

    setModalConfirmar(true);
  };

  // --- EVALUADOR LOCAL DEL RESULTADO ---
  const ejecutarGuardadoConfirmado = async () => {
    setModalConfirmar(false);
    
    // Esperamos a ver qué dice la base de datos a través del padre
    const resultado = await onSave(formData);
    
    // Si la API falló, capturamos el error y levantamos la alerta en el formulario
    if (resultado && !resultado.ok) {
      setToastConfig({
        visible: true,
        mensaje: resultado.error || 'Error en el procesamiento del registro.',
        tipo: 'error'
      });
    }
    // Si dio OK, el padre se encargará de desmontar este formulario y disparar su éxito.
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
              <label><Mail size={14} /> Correo Electrónico Oficial (Debe ser @unne.edu.ar) *</label>
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
                <label>Rol de Sistema</label>
                <select name="rol" value={formData.rol} onChange={handleInputChange}>
                  <option value="Operador">Operador Estándar</option>
                  <option value="Administrador">Administrador de Facultad</option>
                  <option value="Super_Usuario">Super Usuario (Rectorado)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Unidad Académica / Dependencia</label>
                <input type="text" name="facultad" value={formData.facultad} onChange={handleInputChange} required placeholder="Ej: RECTORADO, FACENA" />
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

      {/* TOAST INTERNO DEL FORMULARIO (Maneja exclusivamente los ERRORES de guardado en la pantalla actual) */}
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