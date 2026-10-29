const db = require('../config/db'); // <-- Esto soluciona el "db is not defined"

// 1. Obtener Tipos de Usuario (Roles)
exports.getTiposUsuario = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT tipos_usuarios_id AS id, nombre, descripcion FROM tipos_usuario ORDER BY nombre ASC'
    );
    return res.json(rows);
  } catch (error) {
    console.error('Error al obtener tipos de usuario:', error);
    return res.status(500).json({ error: 'Error al obtener tipos de usuario.' });
  }
};

// 2. Obtener Dependencias (UOCs)
exports.getDependencias = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT dependencia_id AS id, nombre, descripcion, direccion, cel FROM dependencias ORDER BY nombre ASC'
    );
    return res.json(rows);
  } catch (error) {
    console.error('Error al obtener dependencias:', error);
    return res.status(500).json({ error: 'Error al obtener dependencias.' });
  }
};