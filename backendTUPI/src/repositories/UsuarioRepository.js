const db = require('../config/db');

class UsuarioRepository {

  // 1. OBTENER TODOS LOS USUARIOS CON PERMISOS CONSOLIDADOS
  async findAll() {
    const [users] = await db.query(`
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
        d.nombre AS dependencia
      FROM usuario u
      LEFT JOIN tipos_usuario tu ON u.tipo_usuario_id = tu.tipos_usuarios_id
      LEFT JOIN dependencias d ON u.dependencia_id = d.dependencia_id
      ORDER BY u.apellido ASC, u.nombre ASC
    `);

    const usuariosConPermisos = await Promise.all(users.map(async (user) => {
      const [permisosRows] = await db.query(`
        SELECT DISTINCT p.slug 
        FROM permisos p
        INNER JOIN usuario_permiso up ON p.permiso_id = up.permiso_id
        WHERE up.usuario_id = ?

        UNION

        SELECT DISTINCT p.slug 
        FROM permisos p
        INNER JOIN tipo_usuario_permiso tup ON p.permiso_id = tup.permiso_id
        WHERE tup.tipo_usuario_id = ?
      `, [user.id, user.tipo_usuario_id]);

      return {
        ...user,
        permisos: permisosRows.map(row => row.slug).filter(Boolean)
      };
    }));

    return usuariosConPermisos;
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
        d.nombre AS dependencia
      FROM usuario u
      LEFT JOIN tipos_usuario tu ON u.tipo_usuario_id = tu.tipos_usuarios_id
      LEFT JOIN dependencias d ON u.dependencia_id = d.dependencia_id
      WHERE u.usuario_id = ?
    `, [id]);

    if (!rows || rows.length === 0) return null;

    const user = rows[0];

    const [permisosRows] = await db.query(`
      SELECT DISTINCT p.slug 
      FROM permisos p
      INNER JOIN usuario_permiso up ON p.permiso_id = up.permiso_id
      WHERE up.usuario_id = ?

      UNION

      SELECT DISTINCT p.slug 
      FROM permisos p
      INNER JOIN tipo_usuario_permiso tup ON p.permiso_id = tup.permiso_id
      WHERE tup.tipo_usuario_id = ?
    `, [id, user.tipo_usuario_id]);

    const permisosArray = permisosRows.map(row => row.slug).filter(Boolean);

    return {
      ...user,
      permisos: permisosArray
    };
  }

  // 3. OBTENER LISTADO DE ROLES Y DEPENDENCIAS
  async findTiposUsuario() {
    const [rows] = await db.query('SELECT tipos_usuarios_id AS id, nombre, descripcion FROM tipos_usuario');
    return rows;
  }

  async findDependencias() {
    const [rows] = await db.query('SELECT dependencia_id AS id, nombre FROM dependencias');
    return rows;
  }

  // 4. CREAR USUARIO Y ASIGNAR PERMISOS ATÓMICAMENTE
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
        reset_password_expires,
        activo
      } = datosUsuario;

      const estadoInicial = activo !== undefined ? activo : (reset_password_token ? 0 : 1);

      const [result] = await connection.query(
        `INSERT INTO usuario (
          username, email, password, nombre, apellido, 
          dni, celular, tipo_usuario_id, dependencia_id, 
          reset_password_token, reset_password_expires, activo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
          reset_password_expires || null,
          estadoInicial
        ]
      );

      const nuevoId = result.insertId;

      if (Array.isArray(permisosSlugs) && permisosSlugs.length > 0) {
        const placeholders = permisosSlugs.map(() => '?').join(',');
        
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

  // 5. ACTUALIZAR USUARIO Y SINCRONIZAR PERMISOS ATÓMICAMENTE
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

  // 6. TOGGLE ESTADO BAJA LÓGICA
  async toggleEstado(id) {
    const [rows] = await db.query('SELECT activo FROM usuario WHERE usuario_id = ?', [id]);
    if (rows.length === 0) return null;

    const nuevoEstado = rows[0].activo ? 0 : 1;
    await db.query('UPDATE usuario SET activo = ? WHERE usuario_id = ?', [nuevoEstado, id]);

    return nuevoEstado === 1;
  }
}

module.exports = new UsuarioRepository();