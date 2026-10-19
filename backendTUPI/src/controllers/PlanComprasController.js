import db from '../config/db.js';

// 1. Obtener el estado del Plan Anual (Verifica si está habilitado la carga)
// 1. Obtener el estado del Plan Anual (Verifica si la carga está habilitada)
export const getEstadoPlan = async (req, res) => {
  try {
    const query = `
      SELECT habilitado, mensaje 
      FROM configuracion_plan_compras 
      ORDER BY id DESC LIMIT 1
    `;
    const [rows] = await db.query(query);

    if (rows.length > 0) {
      return res.json({
        habilitado: Boolean(rows[0].habilitado),
        mensaje: rows[0].mensaje || ''
      });
    }

    // Si no hay registros, devuelve habilitado por defecto
    res.json({ habilitado: true, mensaje: '' });
  } catch (error) {
    console.error('Advertencia al consultar configuracion_plan_compras:', error.message);
    // Retorna fallback por defecto para que la app no colapse en desarrollo
    res.json({ habilitado: true, mensaje: '' });
  }
};

// 2. Obtener la lista única de Rubros / Categorías disponibles
export const getRubros = async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT rubro 
      FROM bienes 
      WHERE rubro IS NOT NULL AND rubro != '' 
      ORDER BY rubro ASC
    `;
    const [rows] = await db.query(query);

    const listaRubros = rows.map((r) => r.rubro);
    res.json(listaRubros);
  } catch (error) {
    console.error('Error al obtener la lista de rubros:', error);
    res.status(500).json({ error: 'Error al consultar los rubros en la base de datos.' });
  }
};

// 3. Obtener el catálogo de bienes filtrados por Rubro (Lee precio_unitario e observacion)
export const getBienesPorRubro = async (req, res) => {
  const { rubro } = req.query;

  if (!rubro) {
    return res.status(400).json({ error: 'Debe especificar el parámetro rubro.' });
  }

  try {
    // Si precio_unitario está en 0 o NULL, calcula un valor base aleatorio para desarrollo
    const query = `
      SELECT 
        id,
        descripcion,
        inciso,
        partida_principal,
        COALESCE(NULLIF(precio_unitario, 0), ROUND(1000 + (RAND() * 49000), 2)) AS precio_unitario,
        COALESCE(observacion, '') AS observacion
      FROM bienes
      WHERE rubro = ?
      ORDER BY descripcion ASC
    `;

    const [bienes] = await db.query(query, [rubro]);
    res.json(bienes);
  } catch (error) {
    console.error('Error al obtener bienes por rubro:', error);
    res.status(500).json({ error: 'Error al consultar el catálogo de bienes.' });
  }
};

// 4. Actualizar estado y configuración del Plan Anual
export const updateConfiguracionPlan = async (req, res) => {
  const { habilitado, mensaje } = req.body;

  try {
    const query = `
      INSERT INTO configuracion_plan_compras (habilitado, mensaje) 
      VALUES (?, ?)
    `;
    await db.query(query, [habilitado ? 1 : 0, mensaje || '']);

    res.json({ message: 'Configuración del plan actualizada correctamente' });
  } catch (error) {
    console.error('Error al actualizar la configuración:', error);
    res.status(500).json({ error: 'Error al guardar la configuración en la base de datos.' });
  }
};

// 5. Crear una nueva Solicitud de Compras guardando los renglones (solicitudes_compras y solicitudes_renglones)
export const crearSolicitud = async (req, res) => {
  const { nro_convocatoria, bienes_seleccionados } = req.body;
  const usuarioId = req.usuario ? req.usuario.id : null;

  if (!bienes_seleccionados || !Array.isArray(bienes_seleccionados) || bienes_seleccionados.length === 0) {
    return res.status(400).json({ error: 'Debe enviar al menos un bien para generar la solicitud.' });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Insertar la cabecera en solicitudes_compras
    const [solicitudResult] = await connection.query(
      `INSERT INTO solicitudes_compras (usuario_id, nro_convocatoria, fecha_creacion, estado) 
       VALUES (?, ?, NOW(), 'PENDIENTE')`,
      [usuarioId, nro_convocatoria || 'CDC:2026/01']
    );

    const solicitudId = solicitudResult.insertId;

    // 2. Mapear los ítems para la tabla solicitudes_renglones
    const detalleValores = bienes_seleccionados.map((item) => [
      solicitudId,
      item.bien_id,
      item.cantidad_solicitada || 1,
      item.precio_unitario || 0.00,
      item.observacion || ''
    ]);

    // 3. Insertar renglones en lote (batch insert)
    await connection.query(
      `INSERT INTO solicitudes_renglones 
       (solicitud_id, bien_id, cantidad, precio_unitario, observacion) 
       VALUES ?`,
      [detalleValores]
    );

    await connection.commit();

    res.status(201).json({
      message: 'Solicitud registrada correctamente',
      solicitudId
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error al guardar la solicitud de compras:', error);
    res.status(500).json({ error: 'Ocurrió un error al procesar la solicitud en la base de datos.' });
  } finally {
    connection.release();
  }
};