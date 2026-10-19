import db from '../config/db.js';

/**
 * Obtener el estado de habilitación del Plan Anual de Compras
 * Verifica si está activo y si la fecha actual está dentro del rango permitido
 */
export const getEstadoPlan = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM configuracion_plan_compras WHERE id = 1');
        const config = rows[0];

        if (!config || !config.activo) {
            return res.json({ 
                habilitado: false, 
                mensaje: 'El Plan Anual de Compras no se encuentra activo.' 
            });
        }

        const ahora = new Date();
        const fechaInicio = new Date(config.fecha_inicio);
        const fechaFin = new Date(config.fecha_fin);

        const estaEnRango = ahora >= fechaInicio && ahora <= fechaFin;

        res.json({
            habilitado: estaEnRango,
            fecha_inicio: config.fecha_inicio,
            fecha_fin: config.fecha_fin,
            mensaje: estaEnRango 
                ? 'Plan Anual Abierto' 
                : 'El Plan Anual está fuera del período habilitado.'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Habilitar/Deshabilitar el Plan Anual y establecer fechas (Panel Administrador)
 */
export const updateConfiguracionPlan = async (req, res) => {
    const { activo, fecha_inicio, fecha_fin, usuario_id } = req.body;
    try {
        await db.query(
            `UPDATE configuracion_plan_compras 
             SET activo = ?, fecha_inicio = ?, fecha_fin = ?, actualizado_por = ? 
             WHERE id = 1`,
            [activo ? 1 : 0, fecha_inicio, fecha_fin, usuario_id]
        );
        res.json({ message: 'Configuración del Plan Anual actualizada exitosamente.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Obtener todos los rubros / categorías de bienes disponibles
 */
export const getRubros = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT DISTINCT rubro FROM bienes ORDER BY rubro ASC');
        res.json(rows.map(r => r.rubro));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Obtener todos los bienes pertenecientes a un rubro/categoría específico
 */
export const getBienesPorRubro = async (req, res) => {
    const { rubro } = req.query;
    try {
        const [rows] = await db.query(
            'SELECT id, descripcion, rubro, inciso, partida_principal FROM bienes WHERE rubro = ? ORDER BY descripcion ASC',
            [rubro]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Crear una nueva solicitud a partir de la selección checklist
 */
// POST: Crear la solicitud usando el ID del usuario extraído del token JWT
export const crearSolicitud = async (req, res) => {
    // Tomamos usuario_id directamente de req.usuario (inyectado por el middleware 'auth')
    const usuario_id = req.usuario.id; 
    const { nro_convocatoria, bienes_seleccionados } = req.body; 

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Validar en el servidor que el plan esté abierto y dentro del rango de fechas
        const [config] = await connection.query('SELECT * FROM configuracion_plan_compras WHERE id = 1');
        const ahora = new Date();
        
        if (!config[0] || !config[0].activo || ahora < new Date(config[0].fecha_inicio) || ahora > new Date(config[0].fecha_fin)) {
            throw new Error('El Plan Anual de Compras se encuentra cerrado o fuera del rango de fechas habilitado.');
        }

        // 2. Insertar la cabecera asociando el ID del usuario verificado
        const [solicitudResult] = await connection.query(
            `INSERT INTO solicitudes (usuario_id, nro_convocatoria, estado) VALUES (?, ?, 'PENDIENTE')`,
            [usuario_id, nro_convocatoria]
        );
        const solicitudId = solicitudResult.insertId;

        // 3. Insertar los renglones/bienes seleccionados
        for (const item of bienes_seleccionados) {
            await connection.query(
                `INSERT INTO solicitud_renglones (solicitud_id, bien_id, cantidad_solicitada, precio_unitario) 
                 VALUES (?, ?, ?, ?)`,
                [solicitudId, item.bien_id, item.cantidad_solicitada || 1, item.precio_unitario || 0]
            );
        }

        await connection.commit();
        res.status(201).json({ message: 'Solicitud enviada correctamente', solicitudId });
    } catch (error) {
        await connection.rollback();
        res.status(400).json({ error: error.message });
    } finally {
        connection.release();
    }
};