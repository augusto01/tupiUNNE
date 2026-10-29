const db = require('../config/db');

class UsuarioRepository {

  // 1. OBTENER TODOS LOS USUARIOS CON PERMISOS Y DEPENDENCIAS
  async findAll() {
    const [rows] = await db.query(`
      SELECT 
        u.usuario_id AS id, 
        u.username, 
        u.email, 
        u.nombre, 
        u.apellido, 
        u.dni, 
        u.celular, 
        u.activo,
        u.tipo_usuario_id, 
        u.dependencia_id,
        tu.nombre AS rol,
        d.nombre AS dependencia,
        IFNULL(GROUP_CONCAT(DISTINCT p.slug), '') AS permisos_raw
      FROM usuario u
      LEFT JOIN tipos_usuario tu ON u.tipo_usuario_id = tu.tipos_usuarios_id
      LEFT JOIN dependencias d ON u.dependencia_id = d.dependencia_id
      LEFT JOIN usuario_permiso up ON u.usuario_id = up.usuario_id
      LEFT JOIN permisos p ON up.permiso_id = p.permiso_id
      GROUP BY u.usuario_id
      ORDER BY u.apellido ASC, u.nombre ASC
    `);

    return rows.map(user => ({
      ...user,
      permisos: user.permisos_raw ? user.permisos_raw.split(',') : []
    }));
  }

  // 2. BUSCAR USUARIO POR ID
  async findById(id) {
    const [rows] = await db.query(`
      SELECT 
        u.usuario_id AS id, 
        u.username, 
        u.email, 
        u.nombre, 
        u.apellido, 
        u.dni, 
        u.celular, 
        u.activo,
        u.tipo_usuario_id, 
        u.dependencia_id,
        tu.nombre AS rol,
        d.nombre AS dependencia,
        IFNULL(GROUP_CONCAT(DISTINCT p.slug), '') AS permisos_raw
      FROM usuario u
      LEFT JOIN tipos_usuario tu ON u.tipo_usuario_id = tu.tipos_usuarios_id
      LEFT JOIN dependencias d ON u.dependencia_id = d.dependencia_id
      LEFT JOIN usuario_permiso up ON u.usuario_id = up.usuario_id
      LEFT JOIN permisos p ON up.permiso_id = p.permiso_id
      WHERE u.usuario_id = ?
      GROUP BY u.usuario_id
    `, [id]);

    if (rows.length === 0) return null;

    const user = rows[0];
    return {
      ...user,
      permisos: user.permisos_raw ? user.permisos_raw.split(',') : []
    };
  }

  // 3. OBTENER CATÁLOGO DE TIPOS DE USUARIOS (ROLES)
  async findTiposUsuario() {
    const [rows] = await db.query(`
      SELECT 
        tipos_usuarios_id AS id, 
        nombre, 
        descripcion 
      FROM tipos_usuario 
      ORDER BY tipos_usuarios_id ASC
    `);
    return rows;
  }

  // 4. OBTENER CATÁLOGO DE DEPENDENCIAS (UOC)
  async findDependencias() {
    const [rows] = await db.query(`
      SELECT 
        dependencia_id AS id, 
        nombre, 
        descripcion 
      FROM dependencias 
      ORDER BY nombre ASC
    `);
    return rows;
  }

  // 5. CREAR USUARIO Y ASIGNAR PERMISOS ATÓMICAMENTE
  async create(datosUsuario, permisosSlugs) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const { 
        username, 
        email, 
        password, 
        nombre, 
        apellido, 
        dni, 
        celular, 
        tipo_usuario_id, 
        dependencia_id,
        reset_password_token,
        reset_password_expires
      } = datosUsuario;

      const [result] = await connection.query(
        `INSERT INTO usuario (
          username, email, password, nombre, apellido, 
          dni, celular, tipo_usuario_id, dependencia_id, 
          reset_password_token, reset_password_expires, activo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          username, 
          email, 
          password, 
          nombre, 
          apellido, 
          dni, 
          celular || null, 
          tipo_usuario_id, 
          dependencia_id,
          reset_password_token || null,
          reset_password_expires || null
        ]
      );

      const nuevoId = result.insertId;

      if (Array.isArray(permisosSlugs) && permisosSlugs.length > 0) {
        const placeholders = permisosSlugs.map(() => '?').join(',');
        
        // Corrección: busca 'permiso_id' en la tabla permisos
        const [permisosRows] = await connection.query(
          `SELECT permiso_id FROM permisos WHERE slug IN (${placeholders})`,
          permisosSlugs
        );

        for (const permiso of permisosRows) {
          await connection.query(
            `INSERT INTO usuario_permiso (usuario_id, permiso_id) VALUES (?, ?)`,
            [nuevoId, permiso.permiso_id]
          );
        }
      }

      await connection.commit();
      return nuevoId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // 6. ACTUALIZAR USUARIO Y SINCRONIZAR PERMISOS ATÓMICAMENTE
  async update(id, datosUsuario, permisosSlugs) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const { username, email, nombre, apellido, dni, celular, tipo_usuario_id, dependencia_id } = datosUsuario;

      await connection.query(
        `UPDATE usuario 
         SET username = ?, email = ?, nombre = ?, apellido = ?, dni = ?, celular = ?, 
             tipo_usuario_id = ?, dependencia_id = ? 
         WHERE usuario_id = ?`,
        [username, email, nombre, apellido, dni, celular || null, tipo_usuario_id, dependencia_id, id]
      );

      if (Array.isArray(permisosSlugs)) {
        await connection.query('DELETE FROM usuario_permiso WHERE usuario_id = ?', [id]);

        if (permisosSlugs.length > 0) {
          const placeholders = permisosSlugs.map(() => '?').join(',');
          
          // Corrección: busca 'permiso_id' en la tabla permisos
          const [permisosRows] = await connection.query(
            `SELECT permiso_id FROM permisos WHERE slug IN (${placeholders})`,
            permisosSlugs
          );

          for (const p of permisosRows) {
            await connection.query(
              'INSERT INTO usuario_permiso (usuario_id, permiso_id) VALUES (?, ?)',
              [id, p.permiso_id]
            );
          }
        }
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

  // 7. TOGGLE ESTADO BAJA LÓGICA
  async toggleEstado(id) {
    const [rows] = await db.query('SELECT activo FROM usuario WHERE usuario_id = ?', [id]);
    if (rows.length === 0) return null;

    const nuevoEstado = rows[0].activo ? 0 : 1;
    await db.query('UPDATE usuario SET activo = ? WHERE usuario_id = ?', [nuevoEstado, id]);

    return nuevoEstado === 1;
  }
}

module.exports = new UsuarioRepository();