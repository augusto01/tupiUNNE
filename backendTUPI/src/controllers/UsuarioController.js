const usuarioRepository = require('../repositories/UsuarioRepository');
const bcrypt = require('bcrypt');
const db = require('../config/db');

class UsuarioController {

  // 1. GET /api/usuarios
  async listar(req, res) {
    try {
      const usuarios = await usuarioRepository.findAll();
      return res.status(200).json(usuarios);
    } catch (error) {
      console.error('❌ Error al listar usuarios:', error);
      return res.status(500).json({ error: 'Error interno del servidor al listar usuarios.' });
    }
  }

  // 2. GET /api/tipos-usuario
  async listarTiposUsuario(req, res) {
    try {
      const roles = await usuarioRepository.findTiposUsuario();
      return res.status(200).json(roles);
    } catch (error) {
      console.error('❌ Error al listar tipos de usuario:', error);
      return res.status(500).json({ error: 'Error interno al consultar roles.' });
    }
  }

  // 3. GET /api/dependencias
  async listarDependencias(req, res) {
    try {
      const dependencias = await usuarioRepository.findDependencias();
      return res.status(200).json(dependencias);
    } catch (error) {
      console.error('❌ Error al listar dependencias:', error);
      return res.status(500).json({ error: 'Error interno al consultar dependencias.' });
    }
  }

  // 4. POST /api/usuarios (Creación con contraseña manual y cuenta activa)
  async crear(req, res) {
    try {
      const { username, email, password, nombre, apellido, dni, celular, tipo_usuario_id, dependencia_id, permisos } = req.body;

      if (!username || !email || !password || !nombre || !apellido || !dni || !tipo_usuario_id || !dependencia_id) {
        return res.status(400).json({ error: 'Todos los campos marcados con (*) son obligatorios, incluyendo la contraseña.' });
      }

      if (password.length < 8) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres.' });
      }

      // 1. Hashear la contraseña provista por el administrador
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // 2. Permisos por defecto según la jerarquía (1 = SuperAdmin, 4 = Usuario)
      let permisosFinales = Array.isArray(permisos) && permisos.length > 0 ? permisos : [];
      if (permisosFinales.length === 0) {
        const ID_ROL = Number(tipo_usuario_id);
        if (ID_ROL === 1) {
          permisosFinales = ['dashboard', 'plan-compras', 'compras', 'usuarios', 'configuracion'];
        } else if (ID_ROL === 2) {
          permisosFinales = ['dashboard', 'plan-compras', 'compras', 'usuarios'];
        } else if (ID_ROL === 3) {
          permisosFinales = ['dashboard', 'plan-compras', 'compras'];
        } else if (ID_ROL === 4) {
          permisosFinales = ['dashboard', 'plan-compras'];
        }
      }

      const datosUsuario = {
        username: username.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        dni: dni.trim(),
        celular: celular ? celular.trim() : null,
        tipo_usuario_id,
        dependencia_id,
        reset_password_token: null,
        reset_password_expires: null,
        activo: 1 // Cuenta creada y activada directamente
      };

      // 3. Guardar en el repositorio
      const nuevoId = await usuarioRepository.create(datosUsuario, permisosFinales);

      return res.status(201).json({
        id: nuevoId,
        username,
        email,
        nombre,
        apellido,
        dni,
        tipo_usuario_id,
        dependencia_id,
        activo: true,
        permisos: permisosFinales,
        message: 'Usuario registrado exitosamente.'
      });

    } catch (error) {
      console.error('❌ Error al crear usuario:', error);

      if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
        return res.status(409).json({ 
          error: 'El Nombre de Usuario, DNI o Email ya se encuentra registrado en el sistema.' 
        });
      }

      if (error.code === 'ER_NO_REFERENCED_ROW_2' || error.errno === 1452) {
        return res.status(400).json({ error: 'El Rol o la Dependencia seleccionada no existen.' });
      }

      return res.status(500).json({ error: 'Error interno del servidor al registrar el usuario.' });
    }
  }

  // 5. PUT /api/usuarios/:id (Edición de Legajo y opcionalmente contraseña)
  async modificar(req, res) {
    try {
      const { id } = req.params;
      const { username, email, password, nombre, apellido, dni, celular, tipo_usuario_id, dependencia_id, permisos } = req.body;

      if (!username || !email || !nombre || !apellido || !dni || !tipo_usuario_id || !dependencia_id) {
        return res.status(400).json({ error: 'Faltan campos obligatorios para actualizar el usuario.' });
      }

      const datosUsuario = {
        username: username.trim(),
        email: email.toLowerCase().trim(),
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        dni: dni.trim(),
        celular: celular ? celular.trim() : null,
        tipo_usuario_id,
        dependencia_id
      };

      // Si se ingresó una nueva contraseña, la hasheamos y la incluimos
      if (password && password.trim() !== '') {
        if (password.length < 8) {
          return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 8 caracteres.' });
        }
        const salt = await bcrypt.genSalt(10);
        datosUsuario.password = await bcrypt.hash(password.trim(), salt);
      }

      await usuarioRepository.update(id, datosUsuario, permisos);

      return res.status(200).json({ 
        ok: true, 
        message: 'Legajo y credenciales actualizados correctamente.' 
      });

    } catch (error) {
      console.error('❌ Error al modificar usuario:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'El username, email o DNI ya pertenece a otro usuario.' });
      }
      return res.status(500).json({ error: 'Error interno al actualizar el usuario.' });
    }
  }

  // 6. PUT /api/usuarios/:id/baja (Baja lógica / Reactivación)
  async toggleBaja(req, res) {
    try {
      const { id } = req.params;
      const nuevoEstado = await usuarioRepository.toggleEstado(id);

      if (nuevoEstado === null) {
        return res.status(404).json({ error: 'Usuario no encontrado.' });
      }

      return res.status(200).json({ 
        id: Number(id),
        activo: nuevoEstado,
        message: nuevoEstado ? 'Usuario reactivado exitosamente.' : 'Baja lógica procesada con éxito.' 
      });
    } catch (error) {
      console.error('❌ Error en baja lógica:', error);
      return res.status(500).json({ error: 'Error interno del servidor.' });
    }
  }
}

module.exports = new UsuarioController();