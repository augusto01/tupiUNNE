const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.login = async (req, res) => {
  // Capturamos cualquier variante que envíe el Front para el login
  const { identifier, email, correo, dni, password } = req.body;

  // Consolidamos el valor en una sola variable
  const loginInput = identifier || email || correo || dni;

  // Validación rápida de entrada
  if (!loginInput || !password) {
    return res.status(400).json({ message: 'El identificador y la contraseña son requeridos.' });
  }

  try {
    // 1. Buscar los datos básicos del usuario
    const [userRows] = await pool.execute(
      'SELECT * FROM usuarios WHERE email = ? OR dni = ? OR username = ?',
      [loginInput, loginInput, loginInput]
    );

    if (userRows.length === 0) {
      return res.status(401).json({ message: 'Las credenciales no coinciden.' });
    }

    const usuario = userRows[0];

    // Verificar si el usuario sufrió una baja lógica
    if (usuario.activo === 0) {
      return res.status(403).json({ message: 'El usuario se encuentra inactivo en el sistema.' });
    }

    // 2. Verificar contraseña
    const loginExitoso = await bcrypt.compare(password, usuario.password);
    if (!loginExitoso) {
      return res.status(401).json({ message: 'Contraseña incorrecta.' });
    }

    // 3. Buscar Dependencia, Rol y PERMISOS mapeados
    const [permisosRows] = await pool.execute(
      `SELECT 
        d.id AS facultad_codigo, 
        d.nombre AS facultad_nombre, 
        t.nombre AS rol_nombre,
        GROUP_CONCAT(p.slug) AS secciones_permitidas
       FROM usuarios u
       JOIN dependencias d ON u.dependencia_id = d.id
       JOIN tipos_usuario t ON u.tipo_usuario_id = t.id
       LEFT JOIN tipo_usuario_permiso tup ON t.id = tup.tipo_usuario_id
       LEFT JOIN permisos p ON tup.permiso_id = p.id
       WHERE u.id = ?
       GROUP BY u.id, d.id, t.id`,
      [usuario.id]
    );

    // Mapeamos los resultados por entorno / dependencia
    const entornosProcesados = permisosRows.map(entorno => ({
      facultad_codigo: String(entorno.facultad_codigo), 
      facultad_nombre: entorno.facultad_nombre,
      rol_nombre: entorno.rol_nombre,
      permisos: entorno.secciones_permitidas ? entorno.secciones_permitidas.split(',') : []
    }));

    // 💡 EXTRAEMOS UN ARRAY PLANO DE SLUGS DE PERMISOS
    let listaPermisosPlana = [];
    permisosRows.forEach(row => {
      if (row.secciones_permitidas) {
        const slugs = row.secciones_permitidas.split(',');
        slugs.forEach(s => {
          if (!listaPermisosPlana.includes(s.trim())) {
            listaPermisosPlana.push(s.trim());
          }
        });
      }
    });

    // 💡 RESPALDO TEMPORAL PARA DESARROLLO: Si la base de datos no tiene permisos cargados para el rol
    if (listaPermisosPlana.length === 0) {
      listaPermisosPlana = ['dashboard', 'plan-compras', 'compras', 'usuarios'];
    }

    const infoRelacional = permisosRows[0] || {};

    // 4. Firmar el Token
    const token = jwt.sign(
      { 
        id: usuario.id, 
        username: usuario.username, 
        entornos: entornosProcesados,
        permisos: listaPermisosPlana
      },
      process.env.JWT_SECRET || 'tupi_secret_key_rectorado',
      { expiresIn: '4h' }
    );

    // 5. Devolver al Front tanto 'entornos' como la 'lista de permisos en array plano'
    return res.json({
      message: 'Autenticación exitosa',
      token,
      user: {
        id: usuario.id,
        username: usuario.username,
        email: usuario.email,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        dni: usuario.dni,
        celular: usuario.celular,
        activo: usuario.activo,
        tipo_usuario_id: usuario.tipo_usuario_id, 
        dependencia_id: usuario.dependencia_id, 
        rol: infoRelacional.rol_nombre || 'Sin Rol Asignado', 
        dependencia: infoRelacional.facultad_nombre || 'Sin Dependencia'
      },
      entornos: entornosProcesados,
      permisos: listaPermisosPlana // 👈 Pasa la lista plana de strings ['dashboard', 'plan-compras', ...]
    });

  } catch (error) {
    console.error('Error en login estructurado:', error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
};