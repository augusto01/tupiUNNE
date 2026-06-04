const jwt = require('jsonwebtoken');
require('dotenv').config();

const verificarToken = (req, res, next) => {
  // El token suele venir como "Bearer <TOKEN>"
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(403).json({ message: 'Acceso denegado. Token no provisto.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decoded; // Guardamos los datos del usuario en la request para usarlo adelante
    next(); // Continuar a la ruta
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido o expirado.' });
  }
};

module.exports = verificarToken;