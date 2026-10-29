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

  // 5. Crear solicitud (con transacción)
  async crearSolicitud(usuarioId, convocatoria, estadoFinal, bienesSeleccionados) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [solicitudResult] = await connection.query(
        `INSERT INTO solicitudes (usuario_id, nro_convocatoria, fecha_creacion, estado) 
         VALUES (?, ?, NOW(), ?)`,
        [usuarioId, convocatoria, estadoFinal]
      );

      const solicitudId = solicitudResult.insertId;

      const valoresRegistros = bienesSeleccionados.map((item) => [
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
        s.nro_convocatoria, 
        s.fecha_creacion, 
        s.estado, 
        s.fecha_solicitud,
        s.usuario_autorizante,
        s.motivo_rechazo,
        u.nombre AS usuario_nombre, 
        u.apellido AS usuario_apellido,
        d.nombre AS dependencia_nombre,
        admin.nombre AS admin_nombre,
        admin.apellido AS admin_apellido
      FROM solicitudes s
      JOIN usuario u ON s.usuario_id = u.usuario_id
      LEFT JOIN usuario admin ON s.usuario_autorizante = admin.usuario_id
      LEFT JOIN dependencias d ON u.dependencia_id = d.dependencia_id
      WHERE s.usuario_id = ?
      ORDER BY s.id DESC
    `;

    const [solicitudes] = await db.query(querySolicitudes, [usuarioId]);

    if (!solicitudes || solicitudes.length === 0) {
      return [];
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
        b.descripcion AS bien_descripcion,
        b.trimestre
      FROM solicitud_registros sr
      JOIN bienes b ON sr.bien_id = b.bien_id
      WHERE sr.id_solicitud IN (?)
    `;
    const [registros] = await db.query(queryRegistros, [ids]);

    return solicitudes.map((sol) => ({
      ...sol,
      renglones: registros.filter((r) => r.solicitud_id === sol.id)
    }));
  }

  // 7. Obtener todas las solicitudes pendientes / Bandeja administrativa
  async getSolicitudesPendientes() {
    const querySolicitudes = `
      SELECT 
        s.id, 
        s.nro_convocatoria, 
        s.fecha_creacion, 
        s.estado, 
        s.usuario_id,
        s.usuario_autorizante,
        s.motivo_rechazo,
        u.nombre AS usuario_nombre, 
        u.apellido AS usuario_apellido, 
        u.email AS usuario_email,
        admin.nombre AS admin_nombre,
        admin.apellido AS admin_apellido,
        admin.email AS admin_email,
        d.nombre AS dependencia_nombre
      FROM solicitudes s
      JOIN usuario u ON s.usuario_id = u.usuario_id
      LEFT JOIN usuario admin ON s.usuario_autorizante = admin.usuario_id
      LEFT JOIN dependencias d ON u.dependencia_id = d.dependencia_id
      ORDER BY s.id DESC
    `;

    const [solicitudes] = await db.query(querySolicitudes);

    if (!solicitudes || solicitudes.length === 0) {
      return [];
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
        b.descripcion AS bien_descripcion,
        b.trimestre
      FROM solicitud_registros sr
      JOIN bienes b ON sr.bien_id = b.bien_id
      WHERE sr.id_solicitud IN (?)
    `;
    const [registros] = await db.query(queryRegistros, [ids]);

    return solicitudes.map((sol) => ({
      ...sol,
      renglones: registros.filter((r) => r.solicitud_id === sol.id)
    }));
  }

  // 8. Obtener solicitudes filtradas por UOC/Dependencia
  async getSolicitudesPorDependencia(dependenciaId) {
    const querySolicitudes = `
      SELECT 
        s.id, 
        s.nro_convocatoria, 
        s.fecha_creacion, 
        s.estado, 
        s.usuario_id,
        s.usuario_autorizante,
        s.motivo_rechazo,
        u.nombre AS usuario_nombre, 
        u.apellido AS usuario_apellido, 
        u.email AS usuario_email,
        admin.nombre AS admin_nombre,
        admin.apellido AS admin_apellido,
        admin.email AS admin_email,
        d.nombre AS dependencia_nombre
      FROM solicitudes s
      JOIN usuario u ON s.usuario_id = u.usuario_id
      LEFT JOIN usuario admin ON s.usuario_autorizante = admin.usuario_id
      LEFT JOIN dependencias d ON u.dependencia_id = d.dependencia_id
      WHERE u.dependencia_id = ?
      ORDER BY s.id DESC
    `;

    const [solicitudes] = await db.query(querySolicitudes, [dependenciaId]);

    if (!solicitudes || solicitudes.length === 0) {
      return [];
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
        b.descripcion AS bien_descripcion,
        b.trimestre
      FROM solicitud_registros sr
      JOIN bienes b ON sr.bien_id = b.bien_id
      WHERE sr.id_solicitud IN (?)
    `;
    const [registros] = await db.query(queryRegistros, [ids]);

    return solicitudes.map((sol) => ({
      ...sol,
      renglones: registros.filter((r) => r.solicitud_id === sol.id)
    }));
  }

  // 9. Actualizar solicitud
  async updateSolicitud(id, nroConvocatoriaFinal, nuevoEstado, listaRenglones) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      await connection.query(
        `UPDATE solicitudes 
         SET nro_convocatoria = ?, 
             estado = ?, 
             motivo_rechazo = NULL, 
             fecha_creacion = NOW() 
         WHERE id = ?`,
        [nroConvocatoriaFinal, nuevoEstado, id]
      );

      await connection.query(
        `DELETE FROM solicitud_registros WHERE id_solicitud = ?`,
        [id]
      );

      const queryRenglones = `
        INSERT INTO solicitud_registros (id_solicitud, bien_id, cantidad, precio_unitario, observacion) 
        VALUES ?
      `;

      const valuesRenglones = listaRenglones.map((r) => [
        id,
        parseInt(r.bien_id || r.id, 10),
        parseInt(r.cantidad || r.cantidad_solicitada, 10) || 1,
        parseFloat(r.precio_unitario) || 0,
        r.observacion ? r.observacion.trim() : ''
      ]);

      await connection.query(queryRenglones, [valuesRenglones]);

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

  // 12. Obtener detalle de solicitud con renglones para reportes (PDF / Excel)
  async findSolicitudConDetalle(id) {
    const [solRows] = await db.query(
      `SELECT 
        s.id, s.nro_convocatoria, s.fecha_creacion, s.estado,
        u.nombre AS usuario_nombre, u.apellido AS usuario_apellido, u.email AS usuario_email,
        admin.nombre AS admin_nombre, admin.apellido AS admin_apellido, admin.email AS admin_email,
        d.nombre AS dependencia_nombre
       FROM solicitudes s
       JOIN usuario u ON s.usuario_id = u.usuario_id
       LEFT JOIN usuario admin ON s.usuario_autorizante = admin.usuario_id
       LEFT JOIN dependencias d ON u.dependencia_id = d.dependencia_id
       WHERE s.id = ?`,
      [id]
    );

    if (!solRows || solRows.length === 0) {
      return null;
    }

    const [renglones] = await db.query(
      `SELECT sr.cantidad, sr.precio_unitario, sr.observacion, b.descripcion, b.trimestre
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