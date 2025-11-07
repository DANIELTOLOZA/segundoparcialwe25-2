const Persona = require('../models/persona');
const Solicitud = require('../models/solicitud');

const validarSolicitud = async (solicitante, codeudor) => {
  // Validar que solicitante y codeudor sean distintos
  if (solicitante.documento === codeudor.documento) {
    throw new Error('El solicitante y el codeudor no pueden ser la misma persona.');
  }

  // Validar que no tengan los mismos datos de contacto
  if (solicitante.email === codeudor.email) {
    throw new Error('El solicitante y el codeudor no pueden tener el mismo email.');
  }

  if (solicitante.telefono === codeudor.telefono) {
    throw new Error('El solicitante y el codeudor no pueden tener el mismo teléfono.');
  }

  // Validar que el correo del solicitante esté validado
  const personaSolicitante = await Persona.findOne({ documento: solicitante.documento });
  if (personaSolicitante && !personaSolicitante.email_validado) {
    throw new Error('El email del solicitante no está validado.');
  }

  // Validar que el solicitante no tenga una solicitud en estado "aprobado" o "solicitud"
  if (personaSolicitante) {
    const solicitudesActivas = await Solicitud.find({
      solicitante: personaSolicitante._id,
      estado: { $in: ['solicitud', 'aprobada'] }
    });

    if (solicitudesActivas.length > 0) {
      throw new Error('El solicitante ya tiene una solicitud en proceso o aprobada.');
    }
  }

  return true;
};

const validarPersona = (persona) => {
  const errores = [];

  if (!persona.documento || persona.documento.length < 5) {
    errores.push('El documento debe tener al menos 5 caracteres');
  }

  if (!persona.nombre || persona.nombre.length < 2) {
    errores.push('El nombre debe tener al menos 2 caracteres');
  }

  if (!persona.email || !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(persona.email)) {
    errores.push('Por favor ingrese un email válido');
  }

  if (!persona.telefono || persona.telefono.length < 7) {
    errores.push('El teléfono debe tener al menos 7 caracteres');
  }

  if (!persona.fecha_nacimiento) {
    errores.push('La fecha de nacimiento es requerida');
  } else {
    const fechaNacimiento = new Date(persona.fecha_nacimiento);
    if (fechaNacimiento >= new Date()) {
      errores.push('La fecha de nacimiento debe ser en el pasado');
    }
  }

  if (errores.length > 0) {
    throw new Error(errores.join(', '));
  }

  return true;
};

module.exports = {
  validarSolicitud,
  validarPersona
};