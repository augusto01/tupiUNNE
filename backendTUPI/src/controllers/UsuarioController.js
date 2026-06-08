
const db = require('../config/db'); // Tu conexión pool de mysql2/promise
const bcrypt = require('bcrypt');

class UsuarioController {

// 1. LISTAR USUARIOS CON JERARQUÍA Y DEPENDENCIA
// 1. LISTAR USUARIOS CON JERARQUÍA Y DEPENDENCIA
async listar(req, res) {
  try {
    const [rows] = await db.query(`
      SELECT 
        u.id, u.username, u.email, u.nombre, u.apellido, u.dni, u.celular, u.activo,
        u.tipo_usuario_id, u.dependencia_id,
        tu.nombre AS rol,
        d.nombre AS dependencia,
        IFNULL(GROUP_CONCAT(p.slug), '') AS permisos_raw
      FROM usuarios u
      JOIN tipos_usuario tu ON u.tipo_usuario_id = tu.id
      JOIN dependencias d ON u.dependencia_id = d.id
      LEFT JOIN usuario_permiso up ON u.id = up.usuario_id
      LEFT JOIN permisos p ON up.permiso_id = p.id
      GROUP BY u.id
      ORDER BY u.apellido ASC, u.nombre ASC
    `);

    // Mapeamos las filas para convertir el string de permisos en un Array de JS compatible con el Front
    const usuariosConPermisos = rows.map(user => ({
      ...user,
      permisos: user.permisos_raw ? user.permisos_raw.split(',') : []
    }));

    return res.status(200).json(usuariosConPermisos);
  } catch (error) {
    console.error('❌ Error al listar usuarios:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
  // 2. DAR DE ALTA (CREAR)
  async crear(req, res) {
  try {
    const { username, email, password, nombre, apellido, dni, celular, tipo_usuario_id, dependencia_id } = req.body;

    // 1. Validaciones de control mandatorias de la UNNE
    if (!username || !email || !password || !nombre || !apellido || !dni || !tipo_usuario_id || !dependencia_id) {
      return res.status(400).json({ error: 'Faltan campos mandatorios.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 2. Registro base del operador centralizado
    const [result] = await db.query(
      `INSERT INTO usuarios (
        username, email, password, nombre, apellido, 
        dni, celular, tipo_usuario_id, dependencia_id, activo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [username, email, hashedPassword, nombre, apellido, dni, celular || null, tipo_usuario_id, dependencia_id]
    );

    const nuevoUsuarioId = result.insertId;

    // 3. MATRIZ DE PERMISOS POR DEFECTO (Reglas de Negocio Centrales)
    // Buscamos los slugs correspondientes para mapear a IDs reales de tu tabla de permisos
    let slugsPorDefecto = [];
    const ID_ROL = Number(tipo_usuario_id);

    if (ID_ROL === 1) {
      // Superusuario: Acceso absoluto a todo el ecosistema TUPI
      slugsPorDefecto = ['panel', 'usuarios', 'compras', 'correlatos'];
    } else if (ID_ROL === 2) {
      // Administrador: Gestión operacional sin administración de personal (seguridad cruzada)
      slugsPorDefecto = ['panel', 'compras', 'correlatos'];
    } else if (ID_ROL === 3) {
      // Operador: Carga básica de matrices de control, excluido de compras y usuarios
      slugsPorDefecto = ['panel', 'correlatos'];
    }

    // 4. Inyección atómica a la tabla intermedia 'usuario_permiso'
    if (slugsPorDefecto.length > 0) {
      // Obtenemos los IDs reales de los permisos basados en los slugs requeridos
      const placeholders = slugsPorDefecto.map(() => '?').join(',');
      const [permisosRows] = await db.query(
        `SELECT id FROM permisos WHERE slug IN (${placeholders})`,
        slugsPorDefecto
      );

      // Vinculamos cada permiso al nuevo usuario de forma directa e independiente
      for (const permiso of permisosRows) {
        await db.query(
          `INSERT INTO usuario_permiso (usuario_id, permiso_id) VALUES (?, ?)`,
          [nuevoUsuarioId, permiso.id]
        );
      }
    }

    // 5. Retorno de estructura limpia al cliente
    return res.status(201).json({
      id: nuevoUsuarioId,
      username,
      email,
      nombre,
      apellido,
      dni,
      celular,
      tipo_usuario_id,
      dependencia_id,
      activo: true,
      permisosAsignados: slugsPorDefecto,
      message: 'Operador registrado y matriz de permisos inicializada con éxito.'
    });

  } catch (error) {
    console.error('❌ Error crítico al crear usuario con permisos:', error);
    
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ error: 'El Rol o la Dependencia seleccionada no existen en la base de datos.' });
    }
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Conflicto de integridad: El username, email o DNI ya se encuentra registrado.' });
    }
    
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
  // 3. MODIFICAR (ACTUALIZAR)
  async modificar(req, res) {
  try {
    const { id } = req.params;
    const { username, email, nombre, apellido, dni, celular, tipo_usuario_id, dependencia_id, permisos } = req.body;

    // 1. Validaciones de control de campos obligatorios
    if (!username || !email || !nombre || !apellido || !dni || !tipo_usuario_id || !dependencia_id) {
      return res.status(400).json({ error: 'Faltan campos mandatorios para actualizar el legajo.' });
    }

    // 2. Actualizamos los atributos personales del operador
    await db.query(
      `UPDATE usuarios 
       SET username = ?, email = ?, nombre = ?, apellido = ?, dni = ?, celular = ?, 
           tipo_usuario_id = ?, dependencia_id = ? 
       WHERE id = ?`,
      [username, email, nombre, apellido, dni, celular || null, tipo_usuario_id, dependencia_id, id]
    );

    // 3. SINCRO DE PERMISOS (Checkboxes Dorados)
    // Limpiamos la matriz de permisos anterior para este usuario específico
    await db.query('DELETE FROM usuario_permiso WHERE usuario_id = ?', [id]);

    // Si el Front envió slugs en el array de permisos, los vinculamos uno a uno
    if (permisos && permisos.length > 0) {
      // Buscamos las IDs reales correspondientes a los slugs seleccionados
      const placeholders = permisos.map(() => '?').join(',');
      const [permisosRows] = await db.query(
        `SELECT id FROM permisos WHERE slug IN (${placeholders})`,
        permisos
      );

      // Inyección en la tabla intermedia
      for (const p of permisosRows) {
        await db.query(
          'INSERT INTO usuario_permiso (usuario_id, permiso_id) VALUES (?, ?)',
          [id, p.id]
        );
      }
    }

    return res.status(200).json({ 
      ok: true, 
      message: 'Legajo y matriz de permisos actualizados correctamente.' 
    });

  } catch (error) {
    console.error('❌ Error crítico al modificar usuario con permisos:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'El username, email o DNI ya se encuentra registrado por otro operador.' });
    }
    
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

  // 4. ELIMINACIÓN LÓGICA (TOGGLE BAJA)
  async toggleBaja(req, res) {
    try {
      const { id } = req.params;

      // Buscamos el estado actual
      const [user] = await db.query('SELECT activo FROM usuarios WHERE id = ?', [id]);
      if (user.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado.' });
      }

      // Invertimos el estado binario (0 a 1 o 1 a 0)
      const nuevoEstado = user[0].activo ? 0 : 1;

      await db.query('UPDATE usuarios SET activo = ? WHERE id = ?', [nuevoEstado, id]);

      return res.status(200).json({ 
        id: Number(id),
        activo: nuevoEstado === 1,
        message: nuevoEstado === 1 ? 'Usuario reactivado.' : 'Baja lógica procesada correctamente.' 
      });
    } catch (error) {
      console.error('Error en la baja lógica:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

module.exports = new UsuarioController();