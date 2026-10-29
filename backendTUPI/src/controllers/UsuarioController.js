const usuarioRepository = require('../repositories/UsuarioRepository');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const db = require('../config/db');
const jwt = require('jsonwebtoken'); 

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

  // 4. POST /api/usuarios (Creación con generación de Token de Activación de 7 Días)
 // POST /api/usuarios (Creación de usuario)
async crear(req, res) {
  try {
    const { username, email, nombre, apellido, dni, celular, tipo_usuario_id, dependencia_id, permisos } = req.body;

    if (!username || !email || !nombre || !apellido || !dni || !tipo_usuario_id || !dependencia_id) {
      return res.status(400).json({ error: 'Todos los campos marcados con (*) son obligatorios.' });
    }

    // 1. Generación de Token y clave temporal
    const rawToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date();
    resetExpires.setDate(resetExpires.getDate() + 7);

    const randomPassword = crypto.randomBytes(16).toString('hex');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(randomPassword, salt);

    // 2. Permisos por defecto segun el Rol
    let permisosFinales = Array.isArray(permisos) && permisos.length > 0 ? permisos : [];
    if (permisosFinales.length === 0) {
      const ID_ROL = Number(tipo_usuario_id);
      if (ID_ROL === 1) permisosFinales = ['panel', 'usuarios', 'compras', 'correlatos', 'expedientes'];
      else if (ID_ROL === 2) permisosFinales = ['panel', 'compras', 'correlatos', 'expedientes'];
      else if (ID_ROL === 3 || ID_ROL === 4) permisosFinales = ['panel', 'compras', 'correlatos'];
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
      reset_password_token: rawToken,
      reset_password_expires: resetExpires
    };

    // 3. Crear en Repositorio
    const nuevoId = await usuarioRepository.create(datosUsuario, permisosFinales);

    // 4. Enviar mail
    this.enviarCorreoActivacion(datosUsuario.email, datosUsuario.nombre, datosUsuario.apellido, datosUsuario.username, rawToken)
      .catch(err => console.error('⚠️ No se pudo enviar el correo de activación:', err));

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
      message: 'Usuario registrado correctamente. Se envió el correo de activación con validez de 7 días.'
    });

  } catch (error) {
    console.error('❌ Error al crear usuario:', error);

    // Captura de claves duplicadas en MySQL (ER_DUP_ENTRY / 1062)
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
  // 5. PUT /api/usuarios/:id (Edición de Legajo)
  async modificar(req, res) {
    try {
      const { id } = req.params;
      const { username, email, nombre, apellido, dni, celular, tipo_usuario_id, dependencia_id, permisos } = req.body;

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

      await usuarioRepository.update(id, datosUsuario, permisos);

      return res.status(200).json({ 
        ok: true, 
        message: 'Legajo y permisos actualizados correctamente.' 
      });

    } catch (error) {
      console.error('❌ Error al modificar usuario:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'El username, email o DNI ya pertenece a otro usuario.' });
      }
      return res.status(500).json({ error: 'Error interno al actualizar el usuario.' });
    }
  }

  // 6. PUT /api/usuarios/:id/baja (Soporta PUT/PATCH para evitar problemas de CORS)
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

 // POST /api/usuarios/activar-cuenta
  // POST /api/usuarios/activar-cuenta
// POST /api/usuarios/activar-cuenta
  async activarCuenta(req, res) {
    try {
      const { token, password } = req.body;

      console.log('🔍 Petición de activación recibida. Token:', token);

      if (!token || !password) {
        return res.status(400).json({ error: 'El token y la contraseña son obligatorios.' });
      }

      if (password.length < 8) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres.' });
      }

      // 1. Buscar usuario por el token de activación
      const [rows] = await db.query(
        `SELECT usuario_id, dependencia_id, email, reset_password_expires 
         FROM usuario 
         WHERE reset_password_token = ?`,
        [token]
      );

      console.log('🔍 Filas encontradas en BD:', rows);

      if (!rows || rows.length === 0) {
        console.warn('⚠️ Token no encontrado en la BD:', token);
        return res.status(400).json({ 
          error: 'El enlace de activación es inválido o ya fue utilizado.' 
        });
      }

      const usuario = rows[0];

      // 2. Verificar vencimiento de 7 días
      const fechaExpiracion = new Date(usuario.reset_password_expires);
      const ahora = new Date();

      if (ahora > fechaExpiracion) {
        return res.status(400).json({ 
          error: 'El enlace de activación ha expirado (los enlaces vencen a los 7 días).' 
        });
      }

      // 3. Hashear la nueva contraseña
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // 4. Activar la cuenta y blanquear los campos de recuperación
      await db.query(
        `UPDATE usuario 
         SET password = ?, activo = 1, reset_password_token = NULL, reset_password_expires = NULL 
         WHERE usuario_id = ?`,
        [hashedPassword, usuario.usuario_id]
      );

      // 5. Obtener los datos completos del usuario con sus permisos
      const usuarioCompleto = await usuarioRepository.findById(usuario.usuario_id);

      // 6. Generar el Token JWT e INCLUIR PERMISOS para que entren activos al instante
      const jwtSecret = process.env.JWT_SECRET || 'tu_secreto_jwt';
      const tokenSesion = jwt.sign(
        { 
          id: usuarioCompleto.id, 
          username: usuarioCompleto.username, 
          email: usuarioCompleto.email, 
          tipo_usuario_id: usuarioCompleto.tipo_usuario_id,
          dependencia_id: usuarioCompleto.dependencia_id,
          permisos: usuarioCompleto.permisos || [] // 👈 Se agregan los permisos al JWT
        },
        jwtSecret,
        { expiresIn: '24h' }
      );

      console.log(`✅ Cuenta activada y JWT generado con éxito para el usuario ID: ${usuario.usuario_id}`);

      // 7. Retornar el token JWT y los datos completos del usuario
      return res.status(200).json({ 
        ok: true, 
        message: 'Cuenta activada correctamente.',
        token: tokenSesion,
        usuario: usuarioCompleto
      });

    } catch (error) {
      console.error('❌ Error en activarCuenta:', error);
      return res.status(500).json({ error: 'Error interno del servidor al activar la cuenta.' });
    }
  }

  

  // 7. Método auxiliar para envío de mails con Nodemailer
  async enviarCorreoActivacion(email, nombre, apellido, username, token) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const enlaceActivacion = `${frontendUrl}/activar-cuenta?token=${token}`;

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: '"TUPI UNNE - Sistema Central" <no-reply@unne.edu.ar>',
      to: email,
      subject: 'Bienvenida a TUPI UNNE - Activación de Cuenta',
      html: `
        <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 2rem;">
          <h2 style="color: #0f172a; margin-top: 0;">¡Bienvenido/a al Sistema TUPI UNNE!</h2>
          <p>Estimado/a <strong>${nombre} ${apellido}</strong>,</p>
          <p>Se ha creado exitosamente su legajo digital en el sistema centralizado de la Universidad Nacional del Nordeste.</p>
          
          <div style="background-color: #f8fafc; border-left: 4px solid #0284c7; padding: 1rem; margin: 1.5rem 0; border-radius: 4px;">
            <p style="margin: 0; font-size: 0.9rem;"><strong>Nombre de usuario:</strong> ${username}</p>
            <p style="margin: 0.5rem 0 0 0; font-size: 0.9rem;"><strong>Correo oficial:</strong> ${email}</p>
          </div>

          <p>Para establecer su clave de acceso personal y activar su cuenta, haga clic en el siguiente botón:</p>
          
          <div style="text-align: center; margin: 2rem 0;">
            <a href="${enlaceActivacion}" style="background-color: #059669; color: #ffffff; text-decoration: none; padding: 0.85rem 1.75rem; border-radius: 6px; font-weight: bold; display: inline-block;">
              Configurar mi Contraseña y Activar Cuenta
            </a>
          </div>

          <p style="font-size: 0.85rem; color: #64748b;">
            ⏰ <em>Este enlace es personal y tiene una validez de <strong>7 días</strong>.</em>
          </p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 2rem 0 1rem 0;" />
          <p style="font-size: 0.75rem; color: #94a3b8; text-align: center;">Universidad Nacional del Nordeste — DGTIC</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
  }
}

module.exports = new UsuarioController();