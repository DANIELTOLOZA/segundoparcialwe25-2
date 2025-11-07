// src/controllers/validacionController.js
const Solicitud = require('../models/Solicitud');

const validarToken = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token es requerido'
      });
    }

    // Buscar solicitud por token
    const solicitud = await Solicitud.findByToken(token);
    
    if (!solicitud) {
      return res.status(404).json({
        success: false,
        error: 'Token no encontrado'
      });
    }

    // Validar token usando el método del modelo
    try {
      await solicitud.validarToken();
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    res.json({
      success: true,
      data: {
        solicitud_id: solicitud._id,
        codigo_radicado: solicitud.codigo_radicado,
        estado: solicitud.estado,
        fecha_validacion: solicitud.fecha_validacion
      },
      message: 'Token validado exitosamente'
    });

  } catch (error) {
    next(error);
  }
};

const obtenerValidacionesPendientes = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const validacionesPendientes = await Solicitud.find({
      'token_validacion.validado': false,
      'token_validacion.expiracion': { $gt: new Date() }
    })
    .populate('solicitante', 'documento nombre email')
    .populate('codeudor', 'documento nombre')
    .sort({ 'token_validacion.expiracion': 1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();

    const total = await Solicitud.countDocuments({
      'token_validacion.validado': false,
      'token_validacion.expiracion': { $gt: new Date() }
    });

    res.json({
      success: true,
      data: validacionesPendientes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  validarToken,
  obtenerValidacionesPendientes
};