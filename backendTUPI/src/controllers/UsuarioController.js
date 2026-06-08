
const db = require('../config/db'); // Tu conexión pool de mysql2/promise
const bcrypt = require('bcrypt');

class UsuarioController {

// 1. LISTAR USUARIOS CON JERARQUÍA Y DEPENDENCIA
// 1. LISTAR USUARIOS CON JERARQUÍA Y DEPENDENCIA
async listar(req, res) {
  try {
    const [rows] = await db.query(`
      SELECT 
        u.id, 
        u.username, 
        u.email, 
        u.nombre,
        u.apellido, 
        u.dni, 
        u.celular, 
        u.activo, 
        u.creado_en,
        u.tipo_usuario_id,   
        u.dependencia_id,    
        t.nombre AS rol,
        d.nombre AS dependencia 
      FROM usuarios u
      JOIN tipos_usuario t ON u.tipo_usuario_id = t.id
      JOIN dependencias d ON u.dependencia_id = d.id 
      ORDER BY u.id DESC
    `);
    
    return res.status(200).json(rows);
  } catch (error) {
    console.error('Error al listar usuarios estructurados:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

  // 2. DAR DE ALTA (CREAR)
  async crear(req, res) {
  try {
    const { username, email, password, nombre, apellido, dni, celular, tipo_usuario_id, dependencia_id } = req.body;

    if (!username || !email || !password || !nombre || !apellido || !dni || !tipo_usuario_id || !dependencia_id) {
      return res.status(400).json({ error: 'Faltan campos mandatorios.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Quitamos 'calle' y 'numero' de la query
    const [result] = await db.query(
      `INSERT INTO usuarios (
        username, email, password, nombre, apellido, 
        dni, celular, tipo_usuario_id, dependencia_id, activo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [username, email, hashedPassword, nombre, apellido, dni, celular || null, tipo_usuario_id, dependencia_id]
    );

    return res.status(201).json({
      id: result.insertId,
      username,
      email,
      nombre,
      apellido,
      dni,
      celular,
      tipo_usuario_id,
      dependencia_id,
      activo: true,
      message: 'Operador registrado exitosamente.'
    });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ error: 'El Rol o la Dependencia seleccionada no son válidos.' });
    }
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'El username, email o DNI ya se encuentra registrado.' });
    }
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

  // 3. MODIFICAR (ACTUALIZAR)
  async modificar(req, res) {
  try {
    const { id } = req.params;
    
    // 🔥 Extraemos solo los campos que REALMENTE existen en tu tabla de MySQL
    const { 
      username, 
      email, 
      password, 
      nombre, 
      apellido, 
      dni, 
      celular, 
      tipo_usuario_id, 
      dependencia_id 
    } = req.body;

    // Verificamos si existe el usuario
    const [userExist] = await db.query('SELECT password FROM usuarios WHERE id = ?', [id]);
    if (userExist.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    // 🔥 Query ajustado estrictamente a la estructura de tu BD
    let query = `
      UPDATE usuarios 
      SET username = ?, 
          email = ?, 
          nombre = ?, 
          apellido = ?, 
          dni = ?, 
          celular = ?, 
          tipo_usuario_id = ?, 
          dependencia_id = ?
    `;
    
    let params = [
      username, 
      email, 
      nombre, 
      apellido, 
      dni, 
      celular || null,
      tipo_usuario_id,
      dependencia_id
    ];

    // Si viene password para cambio, la hasheamos
    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      query += `, password = ?`;
      params.push(hashedPassword);
    }

    query += ` WHERE id = ?`;
    params.push(id);

    // Ejecutamos la consulta limpia
    await db.query(query, params);

    return res.status(200).json({ message: 'Ecosistema de usuario actualizado correctamente.' });
  } catch (error) {
    console.error('Error al modificar usuario:', error);
    
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ error: 'El Rol o la Dependencia seleccionada no existen en los registros base.' });
    }
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Conflicto de duplicados: El username, email o DNI ya existen.' });
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