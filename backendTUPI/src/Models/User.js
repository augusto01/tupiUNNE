const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  dni: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  apellido: {
    type: String,
    required: true,
    trim: true
  },
  celular: {
    type: String,
    trim: true
  },
  activo: {
    type: Boolean,
    default: true
  },
  
  // ==========================================
  // DOCUMENTO EMBEBIDO (Sin entidad aparte)
  // ==========================================
  dependencia: {
    codigo: { 
      type: String, 
      required: true // Ej: "01"
    },
    nombre: { 
      type: String, 
      required: true // Ej: "Rectorado UNNE"
    }
  },

  // ==========================================
  // RELACIÓN (Mantenemos los roles separados)
  // ==========================================
  tipo_usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TipoUsuario',
    required: true
  }
  
}, { 
  timestamps: true 
});

userSchema.index({ email: 1, dni: 1, username: 1 });

module.exports = mongoose.model('User', userSchema);