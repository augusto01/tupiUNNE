const pool = require('../config/db'); // Tu pool de conexión a MySQL

// Obtener todos los roles
exports.getTiposUsuario = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id, nombre, descripcion FROM tipos_usuario ORDER BY nombre ASC');
    return res.json(rows);
  } catch (error) {
    console.error('Error al obtener tipos de usuario:', error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

// Obtener todas las dependencias de la UNNE
exports.getDependencias = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id, nombre, descripcion, direccion, cel FROM dependencias ORDER BY nombre ASC');
    return res.json(rows);
  } catch (error) {
    console.error('Error al obtener dependencias:', error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
};