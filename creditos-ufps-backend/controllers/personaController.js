// src/controllers/personaController.js
const Persona = require('../models/Persona');

const crearPersona = async (req, res, next) => {
  try {
    const { documento, nombre, email, telefono, fecha_nacimiento } = req.body;

    // Verificar si la persona ya existe
    const personaExistente = await Persona.findOne({ 
      $or: [{ documento }, { email }] 
    });

    if (personaExistente) {
      return res.status(400).json({
        success: false,
        error: 'Ya existe una persona con este documento o email'
      });
    }

    const persona = new Persona({
      documento,
      nombre,
      email,
      telefono,
      fecha_nacimiento
    });

    await persona.save();

    res.status(201).json({
      success: true,
      data: persona,
      message: 'Persona creada exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

const obtenerPersonas = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search } = req.query;

    const filter = { activo: true };
    
    if (search) {
      filter.$or = [
        { documento: { $regex: search, $options: 'i' } },
        { nombre: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const personas = await Persona.find(filter)
      .sort({ nombre: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Persona.countDocuments(filter);

    res.json({
      success: true,
      data: personas,
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

const obtenerPersonaPorId = async (req, res, next) => {
  try {
    const { id } = req.params;

    const persona = await Persona.findById(id);

    if (!persona) {
      return res.status(404).json({
        success: false,
        error: 'Persona no encontrada'
      });
    }

    res.json({
      success: true,
      data: persona
    });
  } catch (error) {
    next(error);
  }
};

const actualizarPersona = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre, telefono, fecha_nacimiento } = req.body;

    const persona = await Persona.findById(id);

    if (!persona) {
      return res.status(404).json({
        success: false,
        error: 'Persona no encontrada'
      });
    }

    // Actualizar campos permitidos
    if (nombre) persona.nombre = nombre;
    if (telefono) persona.telefono = telefono;
    if (fecha_nacimiento) persona.fecha_nacimiento = fecha_nacimiento;

    await persona.save();

    res.json({
      success: true,
      data: persona,
      message: 'Persona actualizada exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

const desactivarPersona = async (req, res, next) => {
  try {
    const { id } = req.params;

    const persona = await Persona.findById(id);

    if (!persona) {
      return res.status(404).json({
        success: false,
        error: 'Persona no encontrada'
      });
    }

    persona.activo = false;
    await persona.save();

    res.json({
      success: true,
      message: 'Persona desactivada exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  crearPersona,
  obtenerPersonas,
  obtenerPersonaPorId,
  actualizarPersona,
  desactivarPersona
};