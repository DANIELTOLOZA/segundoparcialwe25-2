// src/models/Persona.js
const mongoose = require('mongoose');

const personaSchema = new mongoose.Schema({
  documento: {
    type: String,
    required: [true, 'El documento es requerido'],
    unique: true,
    trim: true,
    minlength: [5, 'El documento debe tener al menos 5 caracteres'],
    maxlength: [20, 'El documento no puede exceder 20 caracteres']
  },
  nombre: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true,
    minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
    maxlength: [100, 'El nombre no puede exceder 100 caracteres']
  },
  email: {
    type: String,
    required: [true, 'El email es requerido'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Por favor ingrese un email válido']
  },
  telefono: {
    type: String,
    required: [true, 'El teléfono es requerido'],
    trim: true,
    minlength: [7, 'El teléfono debe tener al menos 7 caracteres'],
    maxlength: [15, 'El teléfono no puede exceder 15 caracteres']
  },
  fecha_nacimiento: {
    type: Date,
    required: [true, 'La fecha de nacimiento es requerida'],
    validate: {
      validator: function(value) {
        return value < new Date();
      },
      message: 'La fecha de nacimiento debe ser en el pasado'
    }
  },
  email_validado: {
    type: Boolean,
    default: false
  },
  activo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices para mejor performance
personaSchema.index({ documento: 1 });
personaSchema.index({ email: 1 });
personaSchema.index({ activo: 1 });

// Virtual para la edad
personaSchema.virtual('edad').get(function() {
  const hoy = new Date();
  const nacimiento = new Date(this.fecha_nacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  
  return edad;
});

module.exports = mongoose.model('Persona', personaSchema);