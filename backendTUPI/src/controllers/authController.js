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
    // 1. Buscar al usuario por cualquiera de las 3 vías principales utilizando la variable unificada
    const [userRows] = await pool.execute(
      'SELECT * FROM usuarios WHERE email = ? OR dni = ? OR username = ?',
      [loginInput, loginInput, loginInput]
    );

    if (userRows.length === 0) {
      return res.status(401).json({ message: 'Las credenciales no coinciden.' });
    }

    const usuario = userRows[0];

    // 2. Verificar contraseña
    const loginExitoso = await bcrypt.compare(password, usuario.password);
    if (!loginExitoso) {
      return res.status(401).json({ message: 'Contraseña incorrecta.' });
    }

    // 3. Buscar TODAS sus facultades y roles asignados
    const [permisosRows] = await pool.execute(
      `SELECT f.codigo AS facultad_codigo, f.nombre AS facultad_nombre, t.nombre AS rol_nombre 
       FROM usuario_facultad_rol ufr
       JOIN facultades f ON ufr.facultad_id = f.id
       JOIN tipos_usuario t ON ufr.tipo_usuario_id = t.id
       WHERE ufr.usuario_id = ?`,
      [usuario.id]
    );

    // 4. Firmar el Token metiendo también el mapa de permisos
    const token = jwt.sign(
      { 
        id: usuario.id, 
        username: usuario.username, 
        permisos: permisosRows 
      },
      process.env.JWT_SECRET,
      { expiresIn: '4h' }
    );

    // 5. Devolver todo al Front
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
      permisos: permisosRows // Lista de facultades y roles a las que pertenece
    });

  } catch (error) {
    console.error('Error en login estructurado:', error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
};