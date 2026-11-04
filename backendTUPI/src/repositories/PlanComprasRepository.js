import db from '../config/db.js';

class PlanComprasRepository {
  // 1. Obtener estado del plan
  async getEstadoPlan() {
    const query = `
      SELECT habilitado, mensaje 
      FROM configuracion_plan_compras 
      ORDER BY id DESC LIMIT 1
    `;
    const [rows] = await db.query(query);
    return rows;
  }

  async getTodosLosBienes() {
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
      ORDER BY descripcion ASC
    `;
    const [bienes] = await db.query(query);
    return bienes;
  }

  // 2. Actualizar configuración del plan
  async updateConfiguracionPlan(habilitado, mensaje) {
    const query = `
      INSERT INTO configuracion_plan_compras (habilitado, mensaje) 
      VALUES (?, ?)
    `;
    const [result] = await db.query(query, [habilitado ? 1 : 0, mensaje ?? '']);
    return result;
  }

  // 3. Obtener rubros
  async getRubros() {
    const query = `
      SELECT rubro_id, \`desc\` AS rubro_nombre 
      FROM rubro 
      ORDER BY \`desc\` ASC
    `;
    const [rows] = await db.query(query);
    return rows;
  }

  // 3b. Obtener áreas únicas por UOC / Dependencia
  async getAreas(dependenciaId = null) {
    let query = `
      SELECT 
        MIN(a.area_id) AS id, 
        TRIM(a.nombre) AS nombre, 
        a.dependencia_id,
        COALESCE(d.nombre, 'Rectorado') AS dependencia_nombre
      FROM areas a
      LEFT JOIN dependencias d ON a.dependencia_id = d.dependencia_id
      WHERE a.nombre IS NOT NULL AND TRIM(a.nombre) != ''
    `;

    const queryParams = [];

    if (dependenciaId) {
      query += ` AND a.dependencia_id = ? `;
      queryParams.push(dependenciaId);
    }

    query += `
      GROUP BY TRIM(a.nombre), a.dependencia_id, COALESCE(d.nombre, 'Rectorado')
      ORDER BY TRIM(a.nombre) ASC
    `;

    const [rows] = await db.query(query, queryParams);
    return rows;
  }

  // 4. Obtener bienes por rubro
  async getBienesPorRubro(rubro_id) {
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
    return bienes;
  }

  // 5. Crear solicitud (Insertando en solicitud_registros e id_solicitud)
  async crearSolicitud(paramsObj) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      let usuario_id, area_id, nro_convocatoria, observaciones, estado, renglones;

      if (typeof paramsObj === 'object' && !Array.isArray(paramsObj) && paramsObj.usuario_id) {
        ({ usuario_id, area_id, nro_convocatoria, observaciones, estado, renglones } = paramsObj);
      } else {
        usuario_id = arguments[0];
        area_id = arguments[1];
        nro_convocatoria = arguments[2];
        estado = arguments[3];
        renglones = arguments[4];
        observaciones = arguments[5] || null;
      }

      const [result] = await connection.query(
        `INSERT INTO solicitudes (usuario_id, area_id, nro_convocatoria, observaciones, fecha_creacion, estado) 
         VALUES (?, ?, ?, ?, NOW(), ?)`,
        [usuario_id, area_id || null, nro_convocatoria || 'CDC:2026/01', observaciones || null, estado || 'PENDIENTE']
      );

      const solicitudId = result.insertId;
      const items = renglones || [];

      for (const r of items) {
        await connection.query(
          `INSERT INTO solicitud_registros (id_solicitud, bien_id, cantidad, precio_unitario, observacion)
           VALUES (?, ?, ?, ?, ?)`,
          [
            solicitudId,
            parseInt(r.bien_id || r.id, 10),
            parseInt(r.cantidad || r.cantidad_solicitada, 10) || 1,
            parseFloat(r.precio_unitario) || 0,
            r.observacion || null
          ]
        );
      }

      await connection.commit();
      return solicitudId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // 6. Obtener solicitudes por usuario (Historial propio)
  async getSolicitudesPorUsuario(usuarioId) {
    const querySolicitudes = `
      SELECT 
        s.id, 
        s.usuario_id, 
        s.area_id,
        s.nro_convocatoria, 
        s.observaciones,
        s.fecha_creacion, 
        s.estado, 
        s.fecha_solicitud,
        s.usuario_autorizante,
        s.motivo_rechazo,
        u.nombre AS usuario_nombre, 
        u.apellido AS usuario_apellido,
        a.nombre AS area_nombre,
        d.nombre AS dependencia_nombre,
        admin.nombre AS admin_nombre,
        admin.apellido AS admin_apellido
      FROM solicitudes s
      JOIN usuario u ON s.usuario_id = u.usuario_id
      LEFT JOIN areas a ON s.area_id = a.area_id
      LEFT JOIN dependencias d ON a.dependencia_id = d.dependencia_id OR u.dependencia_id = d.dependencia_id
      LEFT JOIN usuario admin ON s.usuario_autorizante = admin.usuario_id
      WHERE s.usuario_id = ?
      ORDER BY s.id DESC
    `;

    const [solicitudes] = await db.query(querySolicitudes, [usuarioId]);
    if (!solicitudes || solicitudes.length === 0) return [];

    for (let sol of solicitudes) {
      const [registros] = await db.query(
        `SELECT sr.*, b.descripcion AS bien_descripcion, b.trimestre AS trimestre_base
         FROM solicitud_registros sr
         LEFT JOIN bienes b ON sr.bien_id = b.bien_id
         WHERE sr.id_solicitud = ?`,
        [sol.id]
      );
      sol.renglones = registros;
    }

    return solicitudes;
  }

  // 7. Obtener todas las solicitudes pendientes
  async getSolicitudesPendientes() {
    const querySolicitudes = `
      SELECT 
        s.id, 
        s.nro_convocatoria, 
        s.area_id,
        s.observaciones,
        s.fecha_creacion, 
        s.estado, 
        s.usuario_id,
        s.usuario_autorizante,
        s.motivo_rechazo,
        u.nombre AS usuario_nombre, 
        u.apellido AS usuario_apellido, 
        u.email AS usuario_email,
        a.nombre AS area_nombre,
        admin.nombre AS admin_nombre,
        admin.apellido AS admin_apellido,
        admin.email AS admin_email,
        d.nombre AS dependencia_nombre
      FROM solicitudes s
      JOIN usuario u ON s.usuario_id = u.usuario_id
      LEFT JOIN areas a ON s.area_id = a.area_id
      LEFT JOIN dependencias d ON a.dependencia_id = d.dependencia_id OR u.dependencia_id = d.dependencia_id
      LEFT JOIN usuario admin ON s.usuario_autorizante = admin.usuario_id
      ORDER BY s.id DESC
    `;

    const [solicitudes] = await db.query(querySolicitudes);
    if (!solicitudes || solicitudes.length === 0) return [];

    for (let sol of solicitudes) {
      const [registros] = await db.query(
        `SELECT sr.*, b.descripcion AS bien_descripcion, b.trimestre AS trimestre_base
         FROM solicitud_registros sr
         LEFT JOIN bienes b ON sr.bien_id = b.bien_id
         WHERE sr.id_solicitud = ?`,
        [sol.id]
      );
      sol.renglones = registros;
    }

    return solicitudes;
  }

  // 8. Obtener solicitudes por UOC / Dependencia (Corregido con LEFT JOIN de admin)
  async getSolicitudesPorDependencia(dependenciaId) {
    const querySolicitudes = `
      SELECT 
        s.id, 
        s.nro_convocatoria, 
        s.area_id,
        s.observaciones,
        s.fecha_creacion, 
        s.estado, 
        s.usuario_id,
        s.usuario_autorizante,
        s.motivo_rechazo,
        u.nombre AS usuario_nombre, 
        u.apellido AS usuario_apellido, 
        u.email AS usuario_email,
        a.nombre AS area_nombre,
        admin.nombre AS admin_nombre,
        admin.apellido AS admin_apellido,
        admin.email AS admin_email,
        d.nombre AS dependencia_nombre
      FROM solicitudes s
      JOIN usuario u ON s.usuario_id = u.usuario_id
      LEFT JOIN areas a ON s.area_id = a.area_id
      LEFT JOIN dependencias d ON a.dependencia_id = d.dependencia_id OR u.dependencia_id = d.dependencia_id
      LEFT JOIN usuario admin ON s.usuario_autorizante = admin.usuario_id
      WHERE u.dependencia_id = ? OR a.dependencia_id = ?
      ORDER BY s.id DESC
    `;

    const [solicitudes] = await db.query(querySolicitudes, [dependenciaId, dependenciaId]);
    if (!solicitudes || solicitudes.length === 0) return [];

    for (let sol of solicitudes) {
      const [registros] = await db.query(
        `SELECT sr.*, b.descripcion AS bien_descripcion, b.trimestre AS trimestre_base
         FROM solicitud_registros sr
         LEFT JOIN bienes b ON sr.bien_id = b.bien_id
         WHERE sr.id_solicitud = ?`,
        [sol.id]
      );
      sol.renglones = registros;
    }

    return solicitudes;
  }

  // 9. Actualizar solicitud
  async updateSolicitud(id, areaId, nroConvocatoriaFinal, nuevoEstado, listaRenglones, observaciones = null) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      await connection.query(
        `UPDATE solicitudes 
         SET area_id = ?,
             nro_convocatoria = ?, 
             observaciones = ?,
             estado = ?, 
             motivo_rechazo = NULL, 
             fecha_creacion = NOW() 
         WHERE id = ?`,
        [areaId ?? null, nroConvocatoriaFinal, observaciones ?? null, nuevoEstado, id]
      );

      await connection.query(
        `DELETE FROM solicitud_registros WHERE id_solicitud = ?`,
        [id]
      );

      for (const r of listaRenglones) {
        await connection.query(
          `INSERT INTO solicitud_registros (id_solicitud, bien_id, cantidad, precio_unitario, observacion) 
           VALUES (?, ?, ?, ?, ?)`,
          [
            id,
            parseInt(r.bien_id || r.id, 10),
            parseInt(r.cantidad || r.cantidad_solicitada, 10) || 1,
            parseFloat(r.precio_unitario) || 0,
            r.observacion ? r.observacion.trim() : null
          ]
        );
      }

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // 10. Evaluar solicitud (Aprobar/Rechazar)
  async evaluarSolicitud(id, estado, adminId, motivoFinal) {
    const query = `
      UPDATE solicitudes 
      SET 
        estado = ?, 
        usuario_autorizante = ?,
        motivo_rechazo = ?
      WHERE id = ?
    `;
    const [result] = await db.query(query, [estado, adminId, motivoFinal, id]);
    return result;
  }

  // 11. Eliminar solicitud
  async deleteSolicitud(id) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      await connection.query(`DELETE FROM solicitud_registros WHERE id_solicitud = ?`, [id]);
      await connection.query(`DELETE FROM solicitudes WHERE id = ?`, [id]);

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // 12. Obtener detalle de solicitud para reportes
  async findSolicitudConDetalle(id) {
    const [solRows] = await db.query(
      `SELECT 
        s.id, s.nro_convocatoria, s.observaciones, s.fecha_creacion, s.estado, s.area_id,
        u.nombre AS usuario_nombre, u.apellido AS usuario_apellido, u.email AS usuario_email,
        a.nombre AS area_nombre,
        admin.nombre AS admin_nombre, admin.apellido AS admin_apellido, admin.email AS admin_email,
        d.nombre AS dependencia_nombre
       FROM solicitudes s
       JOIN usuario u ON s.usuario_id = u.usuario_id
       LEFT JOIN areas a ON s.area_id = a.area_id
       LEFT JOIN dependencias d ON a.dependencia_id = d.dependencia_id OR u.dependencia_id = d.dependencia_id
       LEFT JOIN usuario admin ON s.usuario_autorizante = admin.usuario_id
       WHERE s.id = ?`,
      [id]
    );

    if (!solRows || solRows.length === 0) {
      return null;
    }

    const [renglones] = await db.query(
      `SELECT 
         sr.cantidad, 
         sr.precio_unitario, 
         sr.observacion, 
         b.trimestre,       
         b.descripcion AS bien_descripcion,
         b.inciso,
         b.partida_principal,
         b.partida_parcial
       FROM solicitud_registros sr
       JOIN bienes b ON sr.bien_id = b.bien_id
       WHERE sr.id_solicitud = ?`,
      [id]
    );

    return {
      solicitud: solRows[0],
      renglones
    };
  }
}

export default new PlanComprasRepository();