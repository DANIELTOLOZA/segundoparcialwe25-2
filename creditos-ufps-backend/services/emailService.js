const nodemailer = require('nodemailer');

// Crear transporter de email
const crearTransporter = async () => {
  // Si no hay configuración SMTP, usar ethereal.email para testing
  if (!process.env.SMTP_HOST) {
    console.log('⚠️  No hay configuración SMTP. Usando ethereal.email para testing...');
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransporter({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  }

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

// Enviar email de validación
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
            </div>
            
            <p style="color: #e74c3c; font-weight: bold;">
              ⚠️ Importante: Este token tiene una validez de 15 minutos.
            </p>
            
            <p>Puede validar su solicitud ingresando el token en nuestro sistema.</p>
            
            <hr style="border: none; border-top: 1px solid #ecf0f1; margin: 20px 0;">
            
            <p style="color: #7f8c8d; font-size: 14px;">
              Atentamente,<br>
              <strong>Equipo de Créditos Financieros UFPS</strong><br>
              Universidad Francisco de Paula Santander
            </p>
          </div>
          
          <div style="background: #f8f9fa; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; color: #95a5a6;">
            <p>Este es un email automático, por favor no responda a este mensaje.</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    
    // Si estamos usando ethereal.email, mostrar el preview URL
    if (!process.env.SMTP_HOST) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log(`📧 Email de prueba enviado. Preview URL: ${previewUrl}`);
    } else {
      console.log(`✅ Email enviado a ${email}: ${info.messageId}`);
    }
    
    return {
      success: true,
      messageId: info.messageId,
      previewUrl: !process.env.SMTP_HOST ? nodemailer.getTestMessageUrl(info) : null
    };
  } catch (error) {
    console.error('❌ Error enviando email:', error);
    throw new Error('Error al enviar el email de validación: ' + error.message);
  }
};

// Enviar email de notificación de estado
const enviarEmailNotificacion = async (email, nombre, codigoRadicado, estado, motivo = '') => {
  try {
    const transporter = await crearTransporter();

    const estados = {
      'aprobada': {
        subject: '¡Solicitud de Crédito Aprobada!',
        color: '#27ae60',
        message: 'Su solicitud de crédito ha sido aprobada.'
      },
      'rechazada': {
        subject: 'Solicitud de Crédito Rechazada',
        color: '#e74c3c',
        message: `Su solicitud de crédito ha sido rechazada.${motivo ? ` Motivo: ${motivo}` : ''}`
      },
      'validada': {
        subject: 'Solicitud de Crédito Validada',
        color: '#3498db',
        message: 'Su solicitud de crédito ha sido validada exitosamente.'
      }
    };

    const estadoInfo = estados[estado] || {
      subject: 'Actualización de Solicitud de Crédito',
      color: '#95a5a6',
      message: `El estado de su solicitud ha cambiado a: ${estado}`
    };

    const mailOptions = {
      from: process.env.SMTP_FROM || '"Créditos UFPS" <noreply@ufps.edu.co>',
      to: email,
      subject: estadoInfo.subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <div style="background: linear-gradient(135deg, #2c3e50, ${estadoInfo.color}); padding: 20px; border-radius: 8px 8px 0 0; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 24px;">Créditos Financieros UFPS</h1>
          </div>
          
          <div style="padding: 20px;">
            <h2 style="color: #2c3e50;">${estadoInfo.subject}</h2>
            
            <p>Estimado/a <strong>${nombre}</strong>,</p>
            
            <p>Le informamos que su solicitud de crédito con código: 
            <strong style="color: #3498db;">${codigoRadicado}</strong></p>
            
            <div style="background: ${estadoInfo.color}20; padding: 15px; border-radius: 8px; border-left: 4px solid ${estadoInfo.color}; margin: 20px 0;">
              <p style="margin: 0; color: #2c3e50; font-weight: bold;">${estadoInfo.message}</p>
            </div>
            
            <p>Puede consultar el estado de su solicitud en cualquier momento en nuestro sistema.</p>
            
            <hr style="border: none; border-top: 1px solid #ecf0f1; margin: 20px 0;">
            
            <p style="color: #7f8c8d; font-size: 14px;">
              Atentamente,<br>
              <strong>Equipo de Créditos Financieros UFPS</strong><br>
              Universidad Francisco de Paula Santander
            </p>
          </div>
          
          <div style="background: #f8f9fa; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; color: #95a5a6;">
            <p>Este es un email automático, por favor no responda a este mensaje.</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    
    if (!process.env.SMTP_HOST) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log(`📧 Email de notificación enviado. Preview URL: ${previewUrl}`);
    } else {
      console.log(`✅ Email de notificación enviado a ${email}: ${info.messageId}`);
    }
    
    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error('❌ Error enviando email de notificación:', error);
    throw new Error('Error al enviar el email de notificación: ' + error.message);
  }
};

module.exports = {
  crearTransporter,
  enviarEmailValidacion,
  enviarEmailNotificacion
};
