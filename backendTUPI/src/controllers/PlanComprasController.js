import db from '../config/db.js';

// 1. Obtener el estado del Plan Anual
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

    res.json({ habilitado: true, mensaje: '' });
  } catch (error) {
    console.error('Error al verificar estado del plan:', error.message);
    res.json({ habilitado: true, mensaje: '' });
  }
};

// 2. Obtener lista de Rubros
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

// 3. Obtener bienes por Rubro
export const getBienesPorRubro = async (req, res) => {
  const { rubro } = req.query;

  if (!rubro) {
    return res.status(400).json({ error: 'Debe especificar el parámetro rubro.' });
  }

  try {
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

// 4. Configuración del Plan
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

// 5. Crear Solicitud (Soporta BORRADOR o PENDIENTE) -> Apunta a 'solicitudes' y 'solicitud_renglones'
export const crearSolicitud = async (req, res) => {
  const { nro_convocatoria, bienes_seleccionados, estado } = req.body;
  const usuarioId = req.usuario ? req.usuario.id : null;
  const estadoFinal = estado || 'PENDIENTE';

  if (!bienes_seleccionados || !Array.isArray(bienes_seleccionados) || bienes_seleccionados.length === 0) {
    return res.status(400).json({ error: 'Debe enviar al menos un bien para generar la solicitud.' });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Insertar cabecera en la tabla 'solicitudes'
    const [solicitudResult] = await connection.query(
      `INSERT INTO solicitudes (usuario_id, nro_convocatoria, fecha_creacion, estado) 
       VALUES (?, ?, NOW(), ?)`,
      [usuarioId, nro_convocatoria || 'CDC:2026/01', estadoFinal]
    );

    const solicitudId = solicitudResult.insertId;

    // Insertar renglones en la tabla 'solicitud_renglones'
    for (const item of bienes_seleccionados) {
      await connection.query(
        `INSERT INTO solicitud_renglones 
         (solicitud_id, bien_id, cantidad, precio_unitario, observacion) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          solicitudId,
          item.bien_id,
          item.cantidad_solicitada || item.cantidad || 1,
          item.precio_unitario || 0.00,
          item.observacion || ''
        ]
      );
    }

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

// 6. Obtener Historial de Solicitudes (Lee desde 'solicitudes' y 'solicitud_renglones')
export const getHistorialSolicitudes = async (req, res) => {
  try {
    const querySolicitudes = `
      SELECT id, nro_convocatoria, fecha_creacion, estado 
      FROM solicitudes 
      ORDER BY id DESC
    `;
    const [solicitudes] = await db.query(querySolicitudes);

    if (solicitudes.length === 0) {
      return res.json([]);
    }

    const ids = solicitudes.map((s) => s.id);

    const queryRenglones = `
      SELECT 
        sr.id,
        sr.solicitud_id,
        sr.bien_id,
        sr.cantidad,
        sr.precio_unitario,
        sr.observacion,
        b.descripcion AS bien_descripcion
      FROM solicitud_renglones sr
      JOIN bienes b ON sr.bien_id = b.id
      WHERE sr.solicitud_id IN (?)
    `;
    const [renglones] = await db.query(queryRenglones, [ids]);

    const historialCompleto = solicitudes.map((sol) => ({
      ...sol,
      renglones: renglones.filter((r) => r.solicitud_id === sol.id)
    }));

    res.json(historialCompleto);
  } catch (error) {
    console.error('Error al obtener el historial:', error);
    res.status(500).json({ error: 'Error al consultar el historial de solicitudes.' });
  }
};

// 7. Actualizar Solicitud / Borrador
export const updateSolicitud = async (req, res) => {
  const { id } = req.params;
  const { estado, renglones } = req.body;

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    if (estado) {
      await connection.query(
        `UPDATE solicitudes SET estado = ? WHERE id = ?`,
        [estado, id]
      );
    }

    if (Array.isArray(renglones)) {
      for (const r of renglones) {
        await connection.query(
          `UPDATE solicitud_renglones 
           SET cantidad = ?, observacion = ? 
           WHERE id = ? AND solicitud_id = ?`,
          [r.cantidad, r.observacion || '', r.id, id]
        );
      }
    }

    await connection.commit();
    res.json({ message: 'Solicitud actualizada correctamente.' });
  } catch (error) {
    await connection.rollback();
    console.error('Error al actualizar la solicitud:', error);
    res.status(500).json({ error: 'Error al actualizar la solicitud.' });
  } finally {
    connection.release();
  }
};

// 8. Eliminar Borrador
export const deleteSolicitud = async (req, res) => {
  const { id } = req.params;

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    await connection.query(`DELETE FROM solicitud_renglones WHERE solicitud_id = ?`, [id]);
    await connection.query(`DELETE FROM solicitudes WHERE id = ?`, [id]);

    await connection.commit();
    res.json({ message: 'Solicitud eliminada correctamente.' });
  } catch (error) {
    await connection.rollback();
    console.error('Error al eliminar la solicitud:', error);
    res.status(500).json({ error: 'Error al eliminar la solicitud.' });
  } finally {
    connection.release();
  }
};