// src/models/Solicitud.js
const mongoose = require('mongoose');

const solicitudSchema = new mongoose.Schema({
  codigo_radicado: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  solicitante: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Persona',
    required: [true, 'El solicitante es requerido']
  },
  codeudor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Persona',
    required: [true, 'El codeudor es requerido']
  },
  observacion: {
    type: String,
    trim: true,
    maxlength: [500, 'La observación no puede exceder 500 caracteres']
  },
  valor_solicitado: {
    type: Number,
    required: [true, 'El valor solicitado es requerido'],
    min: [100000, 'El valor mínimo de solicitud es $100,000'],
    max: [100000000, 'El valor máximo de solicitud es $100,000,000']
  },
  estado: {
    type: String,
    enum: {
      values: ['solicitud', 'validada', 'aprobada', 'rechazada'],
      message: 'Estado {VALUE} no es válido'
    },
    default: 'solicitud'
  },
  token_validacion: {
    token: {
      type: String,
      required: true
    },
    expiracion: {
      type: Date,
      required: true
    },
    validado: {
      type: Boolean,
      default: false
    }
  },
  fecha_validacion: Date,
  fecha_aprobacion: Date,
  fecha_rechazo: Date,
  motivo_rechazo: {
    type: String,
    trim: true,
    maxlength: [200, 'El motivo de rechazo no puede exceder 200 caracteres']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices
solicitudSchema.index({ codigo_radicado: 1 });
solicitudSchema.index({ solicitante: 1 });
solicitudSchema.index({ estado: 1 });
solicitudSchema.index({ createdAt: -1 });
solicitudSchema.index({ 'token_validacion.expiracion': 1 });

// Middleware para actualizar fechas de estado
solicitudSchema.pre('save', function(next) {
  if (this.isModified('estado')) {
    const ahora = new Date();
    
    switch (this.estado) {
      case 'validada':
        this.fecha_validacion = ahora;
        break;
      case 'aprobada':
        this.fecha_aprobacion = ahora;
        break;
      case 'rechazada':
        this.fecha_rechazo = ahora;
        break;
    }
  }
  next();
});

// Virtual para verificar si el token está expirado
solicitudSchema.virtual('token_expirado').get(function() {
  return new Date() > this.token_validacion.expiracion;
});

// Método estático para buscar por token
solicitudSchema.statics.findByToken = function(token) {
  return this.findOne({ 'token_validacion.token': token });
};

// Método para validar token
solicitudSchema.methods.validarToken = function() {
  if (this.token_validacion.validado) {
    throw new Error('El token ya fue validado');
  }
  
  if (this.token_expirado) {
    throw new Error('El token ha expirado');
  }
  
  this.token_validacion.validado = true;
  this.estado = 'validada';
  
  return this.save();
};

module.exports = mongoose.model('Solicitud', solicitudSchema);