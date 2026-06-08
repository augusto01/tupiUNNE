const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.login = async (req, res) => {
  // Capturamos cualquier variante que envíe el Front para el login
  const { identifier, email, correo, dni, password } = req.body;

  // Consolidamos el valor en una sola variable (el primero que no sea undefined)
  const loginInput = identifier || email || correo || dni;

  // Validación rápida de entrada
  if (!loginInput || !password) {
    return res.status(400).json({ message: 'El identificador y la contraseña son requeridos.' });
  }

  try {
    // 1. Buscar los datos básicos del usuario por cualquiera de las 3 vías principales
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

    // 3. Buscar la Dependencia del usuario, su Rol y los PERMISOS atómicos mapeados
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

    // Mapeamos los resultados para transformar la cadena de texto en un Array de slugs
    const entornosProcesados = permisosRows.map(entorno => ({
      facultad_codigo: String(entorno.facultad_codigo), 
      facultad_nombre: entorno.facultad_nombre,
      rol_nombre: entorno.rol_nombre,
      // Convertimos "panel,usuarios,compras" en ['panel', 'usuarios', 'compras']
      permisos: entorno.secciones_permitidas ? entorno.secciones_permitidas.split(',') : []
    }));

    // 4. Firmar el Token inyectando el mapa de permisos procesado de la UNNE
    const token = jwt.sign(
      { 
        id: usuario.id, 
        username: usuario.username, 
        entornos: entornosProcesados 
      },
      process.env.JWT_SECRET || 'tupi_secret_key_rectorado',
      { expiresIn: '4h' }
    );

    // 5. Devolver todo al Front estructurado tal cual lo esperaba tu Dashboard.jsx
    return res.json({
      message: 'Autenticación exitosa',
      token,
      user: {
        id: usuario.id,
        username: usuario.username,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        dni: usuario.dni,
        celular: usuario.celular
      },
      permisos: entornosProcesados 
    });

  } catch (error) {
    console.error('Error en login estructurado:', error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
};