
const db = require('../config/db'); // Tu conexión pool de mysql2/promise
const bcrypt = require('bcrypt');

class UsuarioController {
  
  // 1. LISTAR USUARIOS
  async listar(req, res) {
    try {
      // Traemos todos, ordenados por los más recientes primero
      const [rows] = await db.query(
        'SELECT id, username, email, nombre,apellido, dni, celular, activo, creado_en FROM usuarios ORDER BY id DESC'
      );
      return res.status(200).json(rows);
    } catch (error) {
      console.error('Error al listar usuarios:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // 2. DAR DE ALTA (CREAR)
  async crear(req, res) {
    try {
      const { username, email, password, nombre, apellido, dni, celular } = req.body;

      // Validaciones básicas
      if (!username || !email || !password || !nombre || !apellido || !dni) {
        return res.status(400).json({ error: 'Faltan campos mandatorios.' });
      }

      // Hashear password antes de guardar
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const [result] = await db.query(
        `INSERT INTO usuarios (username, email, password, nombre, apellido, dni, celular, activo) 
         VALUES (?, ?, ?, ?, ?, ?, 1)`,
        [username, email, hashedPassword, nombre, dni, celular || null]
      );

      return res.status(201).json({
        id: result.insertId,
        username,
        email,
        nombre,
        apellido,
        dni,
        celular,
        activo: true,
        message: 'Operador registrado exitosamente.'
      });
    } catch (error) {
      console.error('Error al crear usuario:', error);
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
      const { username, email, password, nombre, apellido, dni, celular } = req.body;

      // Verificamos si existe el usuario
      const [userExist] = await db.query('SELECT password FROM usuarios WHERE id = ?', [id]);
      if (userExist.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado.' });
      }

      let query = `UPDATE usuarios SET username = ?, email = ?, nombre = ?, apellido = ?, dni = ?, celular = ?`;
      let params = [username, email, nombre, apellido, dni, celular || null];

      // Si el usuario envió una nueva contraseña, la hasheamos y la agregamos al query
      if (password && password.trim() !== '') {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        query += `, password = ?`;
        params.push(hashedPassword);
      }

      query += ` WHERE id = ?`;
      params.push(id);

      await db.query(query, params);

      return res.status(200).json({ message: 'Ecosistema de usuario actualizado correctamente.' });
    } catch (error) {
      console.error('Error al modificar usuario:', error);
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