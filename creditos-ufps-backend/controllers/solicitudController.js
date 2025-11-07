// src/controllers/solicitudController.js
const Solicitud = require('../models/Solicitud');
const Persona = require('../models/Persona');
const { generarToken, generarCodigoRadicado } = require('../services/tokenService');
const { enviarEmailValidacion } = require('../services/emailService');
const { validarSolicitud } = require('../services/validationService');

const registrarSolicitud = async (req, res, next) => {
  try {
    const { solicitante, codeudor, observacion, valor_solicitado } = req.body;

    // Validaciones de negocio
    await validarSolicitud(solicitante, codeudor);

    // Buscar o crear solicitante
    let personaSolicitante = await Persona.findOne({ documento: solicitante.documento });
    if (!personaSolicitante) {
      personaSolicitante = new Persona(solicitante);
      await personaSolicitante.save();
    }

    // Buscar o crear codeudor
    let personaCodeudor = await Persona.findOne({ documento: codeudor.documento });
    if (!personaCodeudor) {
      personaCodeudor = new Persona(codeudor);
      await personaCodeudor.save();
    }

    // Determinar estado basado en solicitudes previas
    const estado = await determinarEstadoSolicitud(personaSolicitante._id);

    // Generar token y código de radicado
    const token = generarToken();
    const expiracion = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos
    const codigo_radicado = generarCodigoRadicado();

    // Crear solicitud
    const nuevaSolicitud = new Solicitud({
      codigo_radicado,
      solicitante: personaSolicitante._id,
      codeudor: personaCodeudor._id,
      observacion,
      valor_solicitado,
      estado,
      token_validacion: {
        token,
        expiracion,
        validado: false
      }
    });

    await nuevaSolicitud.save();

    // Enviar token por email
    await enviarEmailValidacion(
      personaSolicitante.email,
      personaSolicitante.nombre,
      codigo_radicado,
      token
    );

    // Obtener solicitud con datos poblados
    const solicitudCompleta = await Solicitud.findById(nuevaSolicitud._id)
      .populate('solicitante', 'documento nombre email telefono fecha_nacimiento')
      .populate('codeudor', 'documento nombre email telefono fecha_nacimiento');

    res.status(201).json({
      success: true,
      data: {
        id: solicitudCompleta._id,
        fecha: solicitudCompleta.createdAt,
        codigo_radicado: solicitudCompleta.codigo_radicado,
        estado: solicitudCompleta.estado,
        solicitante: solicitudCompleta.solicitante,
        codeudor: solicitudCompleta.codeudor
      },
      message: 'Solicitud registrada exitosamente. Se ha enviado un token de validación al correo.'
    });

  } catch (error) {
    next(error);
  }
};

const obtenerSolicitudes = async (req, res, next) => {
  try {
    const { 
      estado, 
      page = 1, 
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const filter = {};
    if (estado) filter.estado = estado;

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const solicitudes = await Solicitud.find(filter)
      .populate('solicitante', 'documento nombre email telefono')
      .populate('codeudor', 'documento nombre email telefono')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Solicitud.countDocuments(filter);

    res.json({
      success: true,
      data: solicitudes,
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

const obtenerSolicitudPorId = async (req, res, next) => {
  try {
    const { id } = req.params;

    const solicitud = await Solicitud.findById(id)
      .populate('solicitante')
      .populate('codeudor');

    if (!solicitud) {
      return res.status(404).json({
        success: false,
        error: 'Solicitud no encontrada'
      });
    }

    res.json({
      success: true,
      data: solicitud
    });
  } catch (error) {
    next(error);
  }
};

const actualizarEstadoSolicitud = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { estado, motivo_rechazo } = req.body;

    const solicitud = await Solicitud.findById(id);
    if (!solicitud) {
      return res.status(404).json({
        success: false,
        error: 'Solicitud no encontrada'
      });
    }

    // Validar transición de estado
    const estadosValidos = ['solicitud', 'validada', 'aprobada', 'rechazada'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({
        success: false,
        error: 'Estado no válido'
      });
    }

    if (estado === 'rechazada' && !motivo_rechazo) {
      return res.status(400).json({
        success: false,
        error: 'Motivo de rechazo es requerido'
      });
    }

    solicitud.estado = estado;
    if (motivo_rechazo) {
      solicitud.motivo_rechazo = motivo_rechazo;
    }

    await solicitud.save();

    res.json({
      success: true,
      data: solicitud,
      message: `Solicitud ${estado} exitosamente`
    });
  } catch (error) {
    next(error);
  }
};

// Función auxiliar para determinar estado
async function determinarEstadoSolicitud(solicitanteId) {
  const solicitudesPrevias = await Solicitud.find({
    solicitante: solicitanteId,
    estado: { $in: ['solicitud', 'aprobada'] }
  });

  if (solicitudesPrevias.length > 0) {
    throw new Error('El solicitante ya tiene una solicitud en proceso o aprobada');
  }

  const solicitudesRechazadas = await Solicitud.find({
    solicitante: solicitanteId,
    estado: 'rechazada'
  });

  return solicitudesRechazadas.length > 0 ? 'rechazada' : 'solicitud';
}

module.exports = {
  registrarSolicitud,
  obtenerSolicitudes,
  obtenerSolicitudPorId,
  actualizarEstadoSolicitud
};