const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.login = async (req, res) => {
  // Capturamos cualquier variante que envíe el Front para el login (incluye username, dni, email, etc.)
  const { identifier, email, correo, dni, username, usuario, password } = req.body;

  // Consolidamos el identificador de inicio de sesión
  const loginInput = identifier || email || correo || dni || username || usuario;

  // Validación rápida de entrada
  if (!loginInput || !password) {
    return res.status(400).json({ message: 'El identificador y la contraseña son requeridos.' });
  }

  // Sanitizamos el parámetro para evitar el error 'Bind parameters must not contain undefined'
  const loginParam = loginInput ?? null;

  try {
    // 1. Buscar los datos básicos del usuario por DNI, EMAIL o USERNAME (tabla: usuario)
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

    // 3. Buscar Dependencia, Rol y PERMISOS mapeados con el esquema real de la DB
    const userIdParam = usuarioData.usuario_id ?? usuarioData.id ?? null;

    const [permisosRows] = await pool.execute(
      `SELECT 
        d.dependencia_id AS facultad_codigo, 
        d.nombre AS facultad_nombre, 
        t.nombre AS rol_nombre,
        GROUP_CONCAT(p.slug) AS secciones_permitidas
       FROM usuario u
       JOIN dependencias d ON u.dependencia_id = d.dependencia_id
       JOIN tipos_usuario t ON u.tipo_usuario_id = t.tipos_usuarios_id
       LEFT JOIN tipo_usuario_permiso tup ON t.tipos_usuarios_id = tup.tipo_usuario_id
       LEFT JOIN permisos p ON tup.permiso_id = p.permiso_id
       WHERE u.usuario_id = ?
       GROUP BY u.usuario_id, d.dependencia_id, t.tipos_usuarios_id`,
      [userIdParam]
    );

    // Mapeamos los resultados por entorno / dependencia
    const entornosProcesados = permisosRows.map(entorno => ({
      facultad_codigo: String(entorno.facultad_codigo), 
      facultad_nombre: entorno.facultad_nombre,
      rol_nombre: entorno.rol_nombre,
      permisos: entorno.secciones_permitidas ? entorno.secciones_permitidas.split(',') : []
    }));

    // Extraemos un array plano de slugs de permisos sin duplicados
    let listaPermisosPlana = [];
    permisosRows.forEach(row => {
      if (row.secciones_permitidas) {
        const slugs = row.secciones_permitidas.split(',');
        slugs.forEach(s => {
          const trimmedSlug = s.trim();
          if (!listaPermisosPlana.includes(trimmedSlug)) {
            listaPermisosPlana.push(trimmedSlug);
          }
        });
      }
    });

    // Respaldo temporal si la base de datos no tiene permisos asignados al rol
    if (listaPermisosPlana.length === 0) {
      listaPermisosPlana = ['dashboard', 'plan-compras', 'compras', 'usuarios'];
    }

    const infoRelacional = permisosRows[0] || {};

    // 4. Firmar el Token JWT
    const token = jwt.sign(
      { 
        id: userIdParam, 
        username: usuarioData.username, 
        entornos: entornosProcesados,
        permisos: listaPermisosPlana
      },
      process.env.JWT_SECRET || 'tupi_secret_key_rectorado',
      { expiresIn: '4h' }
    );

    // 5. Devolver al Front los datos de autenticación, usuario, entornos y permisos
    return res.json({
      message: 'Autenticación exitosa',
      token,
      user: {
        id: userIdParam,
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
        dependencia: infoRelacional.facultad_nombre || 'Sin Dependencia'
      },
      entornos: entornosProcesados,
      permisos: listaPermisosPlana
    });

  } catch (error) {
    console.error('Error en login estructurado:', error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
};