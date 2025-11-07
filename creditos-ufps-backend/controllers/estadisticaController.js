// src/controllers/estadisticaController.js
const Solicitud = require('../models/Solicitud');
const Persona = require('../models/Persona');

const obtenerEstadisticasGenerales = async (req, res, next) => {
  try {
    // Estadísticas de solicitudes
    const totalSolicitudes = await Solicitud.countDocuments();
    const solicitudesAprobadas = await Solicitud.countDocuments({ estado: 'aprobada' });
    const solicitudesRechazadas = await Solicitud.countDocuments({ estado: 'rechazada' });
    const solicitudesPendientes = await Solicitud.countDocuments({ 
      estado: { $in: ['solicitud', 'validada'] } 
    });

    // Valor total de solicitudes aprobadas
    const valorTotalResult = await Solicitud.aggregate([
      { $match: { estado: 'aprobada' } },
      { $group: { _id: null, total: { $sum: '$valor_solicitado' } } }
    ]);
    const valorTotal = valorTotalResult.length > 0 ? valorTotalResult[0].total : 0;

    // Distribución por estado
    const distribucionEstados = await Solicitud.aggregate([
      {
        $group: {
          _id: '$estado',
          count: { $sum: 1 },
          totalValor: { $sum: '$valor_solicitado' }
        }
      }
    ]);

    // Solicitudes por mes (últimos 6 meses)
    const seisMesesAtras = new Date();
    seisMesesAtras.setMonth(seisMesesAtras.getMonth() - 6);

    const solicitudesPorMes = await Solicitud.aggregate([
      {
        $match: {
          createdAt: { $gte: seisMesesAtras }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalSolicitudes,
        solicitudesAprobadas,
        solicitudesRechazadas,
        solicitudesPendientes,
        valorTotal,
        distribucionEstados,
        solicitudesPorMes: solicitudesPorMes.map(item => ({
          mes: `${item._id.year}-${item._id.month.toString().padStart(2, '0')}`,
          cantidad: item.count
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

const obtenerEstadisticasPersonas = async (req, res, next) => {
  try {
    const totalPersonas = await Persona.countDocuments({ activo: true });
    const personasConSolicitudes = await Persona.aggregate([
      {
        $lookup: {
          from: 'solicitudes',
          localField: '_id',
          foreignField: 'solicitante',
          as: 'solicitudes'
        }
      },
      {
        $match: {
          'solicitudes.0': { $exists: true }
        }
      },
      {
        $count: 'total'
      }
    ]);

    const totalConSolicitudes = personasConSolicitudes.length > 0 ? personasConSolicitudes[0].total : 0;

    res.json({
      success: true,
      data: {
        totalPersonas,
        personasConSolicitudes: totalConSolicitudes,
        personasSinSolicitudes: totalPersonas - totalConSolicitudes
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  obtenerEstadisticasGenerales,
  obtenerEstadisticasPersonas
};