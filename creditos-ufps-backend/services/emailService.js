// src/services/emailService.js
const nodemailer = require('nodemailer');

const crearTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

const enviarEmailValidacion = async (email, nombre, codigoRadicado, token) => {
  try {
    const transporter = crearTransporter();

    const mailOptions = {
      from: `"Créditos UFPS" <${process.env.SMTP_FROM}>`,
      to: email,
      subject: 'Validación de Solicitud de Crédito UFPS',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Validación de Solicitud de Crédito</h2>
          
          <p>Estimado/a <strong>${nombre}</strong>,</p>
          
          <p>Hemos recibido su solicitud de crédito con código: 
          <strong style="color: #3498db;">${codigoRadicado}</strong></p>
          
          <p>Para continuar con el proceso, por favor valide su solicitud utilizando el siguiente token:</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; 
                     margin: 20px 0; border: 2px dashed #3498db;">
            <h3 style="margin: 0; color: #2c3e50; font-size: 24px;">${token}</h3>
          </div>
          
          <p style="color: #e74c3c; font-weight: bold;">
            ⚠️ Importante: Este token tiene una validez de 15 minutos.
          </p>
          
          <p>Puede validar su solicitud ingresando el token en nuestro sistema.</p>
          
          <hr style="border: none; border-top: 1px solid #ecf0f1; margin: 20px 0;">
          
          <p style="color: #7f8c8d; font-size: 14px;">
            Atentamente,<br>
            <strong>Equipo de Créditos Financieros UFPS</strong>
          </p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email enviado a ${email}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('❌ Error enviando email:', error);
    throw new Error('Error al enviar el email de validación');
  }
};

module.exports = {
  enviarEmailValidacion
};// src/services/emailService.js
const nodemailer = require('nodemailer');

const crearTransporter = () => {
  // Si no hay configuración SMTP, usar ethereal.email para testing
  if (!process.env.SMTP_HOST) {
    console.log('⚠️  No hay configuración SMTP. Usando ethereal.email para testing...');
    return nodemailer.createTestAccount().then(testAccount => {
      return nodemailer.createTransporter({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
    });
  }

  return Promise.resolve(nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  }));
};

const enviarEmailValidacion = async (email, nombre, codigoRadicado, token) => {
  try {
    const transporter = await crearTransporter();

    const mailOptions = {
      from: process.env.SMTP_FROM || '"Créditos UFPS" <noreply@ufps.edu.co>',
      to: email,
      subject: 'Validación de Solicitud de Crédito UFPS',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <div style="background: linear-gradient(135deg, #2c3e50, #3498db); padding: 20px; border-radius: 8px 8px 0 0; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 24px;">Créditos Financieros UFPS</h1>
          </div>
          
          <div style="padding: 20px;">
            <h2 style="color: #2c3e50;">Validación de Solicitud de Crédito</h2>
            
            <p>Estimado/a <strong>${nombre}</strong>,</p>
            
            <p>Hemos recibido su solicitud de crédito con código: 
            <strong style="color: #3498db;">${codigoRadicado}</strong></p>
            
            <p>Para continuar con el proceso, por favor valide su solicitud utilizando el siguiente token:</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; 
                       margin: 20px 0; border: 2px dashed #3498db; font-family: monospace;">
              <h3 style="margin: 0; color: #2c3e50; font-size: 24px; letter-spacing: 2px;">${token}</h3>
            </div