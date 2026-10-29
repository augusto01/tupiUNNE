const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];

    if (!authHeader) {
        return res.status(403).json({ error: 'Acceso denegado. No se proporcionó token de autenticación.' });
    }

    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;

    if (!token || token === 'null' || token === 'undefined') {
        return res.status(403).json({ error: 'Formato de token inválido o vacío.' });
    }

    try {
        const secret = process.env.JWT_SECRET || 'tupi_secret_key_rectorado';
        const decoded = jwt.verify(token, secret);

        const userPayload = decoded.usuario || decoded.user || decoded;

        // Inyectamos req.usuario asegurando la presencia de dependencia_id
        req.usuario = {
            ...userPayload,
            usuario_id: userPayload.usuario_id || userPayload.id,
            tipo_usuario_id: Number(userPayload.tipo_usuario_id || userPayload.tipo_usuario),
            dependencia_id: userPayload.dependencia_id || userPayload.dependenciaId
        };

        next();
    } catch (error) {
        return res.status(403).json({ error: 'Token inválido o expirado.' });
    }
};

module.exports = authMiddleware;