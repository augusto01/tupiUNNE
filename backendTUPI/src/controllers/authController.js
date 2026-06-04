const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.login = async (req, res) => {
  const { identifier, password } = req.body;

  try {
    // 1. Buscar los datos básicos del usuario
    const [userRows] = await pool.execute(
      'SELECT * FROM usuarios WHERE username = ? OR email = ? OR dni = ?',
      [identifier, identifier, identifier]
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