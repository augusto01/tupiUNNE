const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    // 1. Obtener el header Authorization
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];

    if (!authHeader) {
        return res.status(403).json({ error: 'Acceso denegado. No se proporcionó token de autenticación.' });
    }

    // 2. Extraer el token eliminando el prefijo "Bearer "
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;

    if (!token || token === 'null' || token === 'undefined') {
        return res.status(403).json({ error: 'Formato de token inválido o vacío.' });
    }

    try {
        // 3. Verificar la firma del token JWT
        const secret = process.env.JWT_SECRET || 'tu_clave_secreta_super_segura';
        const decoded = jwt.verify(token, secret);

        // 4. Adjuntar la información del usuario a req.usuario (soporta req.usuario o req.user)
        req.usuario = decoded.usuario || decoded.user || decoded;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Token inválido o expirado.' });
    }
};

module.exports = authMiddleware;