const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.login = async (req, res) => {
  // Capturamos cualquier variante que envíe el Front para el login
  const { identifier, email, correo, dni, username, usuario, password } = req.body;

  // Consolidamos el identificador de inicio de sesión
  const loginInput = identifier || email || correo || dni || username || usuario;

  // Validación rápida de entrada
  if (!loginInput || !password) {
    return res.status(400).json({ message: 'El identificador y la contraseña son requeridos.' });
  }

  const loginParam = loginInput ?? null;

  try {
    // 1. Buscar los datos básicos del usuario por DNI, EMAIL o USERNAME
    const [userRows] = await pool.execute(
      'SELECT * FROM usuario WHERE email = ? OR dni = ? OR username = ?',
      [loginParam, loginParam, loginParam]
    );

    if (userRows.length === 0) {
      return res.status(401).json({ message: 'Las credenciales no coinciden.' });
    }

    const usuarioData = userRows[0];

    // Verificar si el usuario sufrió una baja lógica
    if (usuarioData.activo === 0) {
      return res.status(403).json({ message: 'El usuario se encuentra inactivo en el sistema.' });
    }

    // 2. Verificar contraseña
    const loginExitoso = await bcrypt.compare(password, usuarioData.password);
    if (!loginExitoso) {
      return res.status(401).json({ message: 'Contraseña incorrecta.' });
    }

    // 3. Buscar Dependencia, Rol y PERMISOS (Unificando rol + excepciones de usuario_permiso)
    const userIdParam = usuarioData.usuario_id ?? usuarioData.id ?? null;

    const [permisosRows] = await pool.execute(
      `SELECT 
        d.dependencia_id AS facultad_codigo, 
        COALESCE(d.nombre, 'Rectorado UNNE') AS facultad_nombre, 
        t.nombre AS rol_nombre,
        GROUP_CONCAT(DISTINCT p.slug) AS secciones_permitidas
       FROM usuario u
       LEFT JOIN dependencias d ON u.dependencia_id = d.dependencia_id
       JOIN tipos_usuario t ON u.tipo_usuario_id = t.tipos_usuarios_id
       LEFT JOIN tipo_usuario_permiso tup ON t.tipos_usuarios_id = tup.tipo_usuario_id
       LEFT JOIN usuario_permiso up ON u.usuario_id = up.usuario_id
       LEFT JOIN permisos p ON (tup.permiso_id = p.permiso_id OR up.permiso_id = p.permiso_id)
       WHERE u.usuario_id = ?
       GROUP BY u.usuario_id, d.dependencia_id, t.tipos_usuarios_id`,
      [userIdParam]
    );

    // Mapeamos los resultados por entorno / dependencia
    const entornosProcesados = permisosRows.map(entorno => ({
      facultad_codigo: entorno.facultad_codigo ? String(entorno.facultad_codigo) : '1', 
      facultad_nombre: entorno.facultad_nombre,
      rol_nombre: entorno.rol_nombre,
      permisos: entorno.secciones_permitidas ? entorno.secciones_permitidas.split(',') : []
    }));

    // Extraemos un array plano de slugs de permisos sin duplicados
    let listaPermisosPlana = [];
    if (permisosRows.length > 0 && permisosRows[0].secciones_permitidas) {
      listaPermisosPlana = permisosRows[0].secciones_permitidas
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
    }

    const infoRelacional = permisosRows[0] || {};

    // 4. Firmar el Token JWT
    const token = jwt.sign(
        { 
          id: userIdParam, 
          usuario_id: userIdParam,
          username: usuarioData.username, 
          tipo_usuario_id: usuarioData.tipo_usuario_id,
          dependencia_id: usuarioData.dependencia_id, 
          entornos: entornosProcesados,
          permisos: listaPermisosPlana
        },
        process.env.JWT_SECRET || 'tupi_secret_key_rectorado',
        { expiresIn: '8h' }
      );

    // 5. Devolver al Front los datos de autenticación, usuario, entornos y permisos
    return res.json({
      message: 'Autenticación exitosa',
      token,
      user: {
        id: userIdParam,
        usuario_id: userIdParam,
        username: usuarioData.username,
        email: usuarioData.email,
        nombre: usuarioData.nombre,
        apellido: usuarioData.apellido,
        dni: usuarioData.dni,
        celular: usuarioData.celular,
        activo: usuarioData.activo,
        tipo_usuario_id: usuarioData.tipo_usuario_id, 
        dependencia_id: usuarioData.dependencia_id, 
        rol: infoRelacional.rol_nombre || 'Sin Rol Asignado', 
        dependencia: infoRelacional.facultad_nombre || 'Rectorado UNNE'
      },
      entornos: entornosProcesados,
      permisos: listaPermisosPlana
    });

  } catch (error) {
    console.error('Error en login estructurado:', error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
};