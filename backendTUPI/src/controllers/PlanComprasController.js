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

    return res.json({ habilitado: true, mensaje: '' });
  } catch (error) {
    console.error('Error al verificar estado del plan:', error.message);
    return res.json({ habilitado: true, mensaje: '' });
  }
};

// 2. Obtener lista de Rubros (Tabla `rubro`)
export const getRubros = async (req, res) => {
  try {
    const query = `
      SELECT rubro_id, \`desc\` AS rubro_nombre 
      FROM rubro 
      ORDER BY \`desc\` ASC
    `;
    const [rows] = await db.query(query);
    return res.json(rows);
  } catch (error) {
    console.error('Error al obtener la lista de rubros:', error);
    return res.status(500).json({ error: 'Error al consultar los rubros en la base de datos.' });
  }
};

// 3. Obtener bienes por Rubro (Filtra por `rubro_id`)
export const getBienesPorRubro = async (req, res) => {
  const { rubro_id } = req.query;

  if (!rubro_id) {
    return res.status(400).json({ error: 'Debe especificar el parámetro rubro_id.' });
  }

  try {
    const query = `
      SELECT 
        bien_id,
        descripcion,
        inciso,
        partida_principal,
        partida_parcial,
        trimestre,
        COALESCE(NULLIF(precio_unitario, 0), ROUND(1000 + (RAND() * 49000), 2)) AS precio_unitario,
        COALESCE(observacion, '') AS observacion
      FROM bienes
      WHERE rubro_id = ?
      ORDER BY descripcion ASC
    `;

    const [bienes] = await db.query(query, [rubro_id ?? null]);
    return res.json(bienes);
  } catch (error) {
    console.error('Error al obtener bienes por rubro:', error);
    return res.status(500).json({ error: 'Error al consultar el catálogo de bienes.' });
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
    await db.query(query, [habilitado ? 1 : 0, mensaje ?? '']);
    return res.json({ message: 'Configuración del plan actualizada correctamente' });
  } catch (error) {
    console.error('Error al actualizar la configuración:', error);
    return res.status(500).json({ error: 'Error al guardar la configuración en la base de datos.' });
  }
};

// 5. Crear Solicitud (Soporta BORRADOR o PENDIENTE con Insert Masivo en `solicitud_registros`)
export const crearSolicitud = async (req, res) => {
  const { nro_convocatoria, bienes_seleccionados, estado } = req.body;
  const usuarioId = req.usuario?.usuario_id ?? req.usuario?.id ?? 1;
  const estadoFinal = estado ?? 'PENDIENTE';
  const convocatoria = nro_convocatoria ?? 'CDC:2026/01';

  if (!bienes_seleccionados || !Array.isArray(bienes_seleccionados) || bienes_seleccionados.length === 0) {
    return res.status(400).json({ error: 'Debe enviar al menos un bien para generar la solicitud.' });
  }

  let connection;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // 1. Insertar cabecera de solicitud
    const [solicitudResult] = await connection.query(
      `INSERT INTO solicitudes (usuario_id, nro_convocatoria, fecha_creacion, estado) 
       VALUES (?, ?, NOW(), ?)`,
      [usuarioId, convocatoria, estadoFinal]
    );

    const solicitudId = solicitudResult.insertId;

    // 2. Mapear renglones para INSERT en lote (Atributo id_solicitud)
    const valoresRegistros = bienes_seleccionados.map((item) => [
      solicitudId,
      item.bien_id ?? item.id ?? null,
      item.cantidad_solicitada ?? item.cantidad ?? 1,
      item.precio_unitario ?? 0.00,
      item.observacion ?? ''
    ]);

    await connection.query(
      `INSERT INTO solicitud_registros 
       (id_solicitud, bien_id, cantidad, precio_unitario, observacion) 
       VALUES ?`,
      [valoresRegistros]
    );

    await connection.commit();

    return res.status(201).json({
      message: 'Solicitud registrada correctamente',
      solicitudId
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error al guardar la solicitud de compras:', error);
    return res.status(500).json({ error: 'Ocurrió un error al procesar la solicitud en la base de datos.' });
  } finally {
    if (connection) connection.release();
  }
};

// 6. Obtener Historial de Solicitudes (Filtra por `id_solicitud` y vincula `bienes.bien_id`)
export const getHistorialSolicitudes = async (req, res) => {
  try {
    const querySolicitudes = `
      SELECT id, usuario_id, nro_convocatoria, fecha_creacion, modelo_centralizado, estado, fecha_solicitud
      FROM solicitudes 
      ORDER BY id DESC
    `;
    const [solicitudes] = await db.query(querySolicitudes);

    if (solicitudes.length === 0) {
      return res.json([]);
    }

    const ids = solicitudes.map((s) => s.id);

    const queryRegistros = `
      SELECT 
        sr.id,
        sr.id_solicitud AS solicitud_id,
        sr.bien_id,
        sr.cantidad,
        sr.precio_unitario,
        sr.observacion,
        b.descripcion AS bien_descripcion
      FROM solicitud_registros sr
      JOIN bienes b ON sr.bien_id = b.bien_id
      WHERE sr.id_solicitud IN (?)
    `;
    const [registros] = await db.query(queryRegistros, [ids]);

    // Mapear renglones a sus respectivas solicitudes
    const historialCompleto = solicitudes.map((sol) => ({
      ...sol,
      renglones: registros.filter((r) => r.solicitud_id === sol.id)
    }));

    return res.json(historialCompleto);
  } catch (error) {
    console.error('Error al obtener el historial:', error);
    return res.status(500).json({ error: 'Error al consultar el historial de solicitudes.' });
  }
};

// 7. Actualizar Solicitud / Borrador
export const updateSolicitud = async (req, res) => {
  const { id } = req.params;
  const { estado, renglones } = req.body;

  let connection;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    if (estado) {
      await connection.query(
        `UPDATE solicitudes SET estado = ? WHERE id = ?`,
        [estado, id]
      );
    }

    if (Array.isArray(renglones) && renglones.length > 0) {
      for (const r of renglones) {
        await connection.query(
          `UPDATE solicitud_registros 
           SET cantidad = ?, observacion = ? 
           WHERE id = ? AND id_solicitud = ?`,
          [r.cantidad ?? 1, r.observacion ?? '', r.id, id]
        );
      }
    }

    await connection.commit();
    return res.json({ message: 'Solicitud actualizada correctamente.' });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error al actualizar la solicitud:', error);
    return res.status(500).json({ error: 'Error al actualizar la solicitud.' });
  } finally {
    if (connection) connection.release();
  }
};

// 8. Eliminar Borrador
export const deleteSolicitud = async (req, res) => {
  const { id } = req.params;

  let connection;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    await connection.query(`DELETE FROM solicitud_registros WHERE id_solicitud = ?`, [id]);
    await connection.query(`DELETE FROM solicitudes WHERE id = ?`, [id]);

    await connection.commit();
    return res.json({ message: 'Solicitud eliminada correctamente.' });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error al eliminar la solicitud:', error);
    return res.status(500).json({ error: 'Error al eliminar la solicitud.' });
  } finally {
    if (connection) connection.release();
  }
};