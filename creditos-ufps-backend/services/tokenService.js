// src/services/tokenService.js
const crypto = require('crypto');

const generarToken = () => {
  return crypto.randomBytes(8).toString('hex').toUpperCase();
};

const generarCodigoRadicado = () => {
  const fecha = new Date();
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, '0');
  const day = String(fecha.getDate()).padStart(2, '0');
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  
  return `RAD-${year}${month}${day}-${random}`;
};

const validarExpiracionToken = (expiracion) => {
  return new Date() < new Date(expiracion);
};

module.exports = {
  generarToken,
  generarCodigoRadicado,
  validarExpiracionToken
};