import nodemailer from 'nodemailer';
import User from '../models/User.js';
import logger from '../utils/logger.js';

// Create email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

/**
 * Send alert email to user
 */
export async function sendAlertEmail(userId, alert) {
  try {
    const user = await User.findById(userId);
    
    if (!user || !user.alertPreferences.email) {
      return;
    }
    
    const emailTemplate = getAlertEmailTemplate(alert);
    
    await transporter.sendMail({
      from: `"ShopGuard Alerts" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: `🚨 ${alert.title}`,
      html: emailTemplate
    });
    
    logger.info(`Alert email sent to ${user.email}`);
  } catch (error) {
    logger.error('Failed to send alert email:', error);
    throw error;
  }
}

/**
 * Generate email template for alerts
 */
function getAlertEmailTemplate(alert) {
  const severityColor = alert.type === 'danger' ? '#FF4444' : '#FFA500';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(90deg, #00827C, #CBFFFC); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { color: white; margin: 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .alert-box { background: white; border-left: 4px solid ${severityColor}; padding: 20px; margin: 20px 0; border-radius: 4px; }
        .alert-title { color: ${severityColor}; font-size: 18px; font-weight: bold; margin-bottom: 10px; }
        .alert-desc { color: #666; }
        .cta-button { display: inline-block; background: #00827C; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🛡️ ShopGuard Alert</h1>
        </div>
        <div class="content">
          <p>Hola,</p>
          <p>Hemos detectado una situación que requiere tu atención inmediata:</p>
          
          <div class="alert-box">
            <div class="alert-title">${alert.title}</div>
            <div class="alert-desc">${alert.description}</div>
          </div>
          
          <p><strong>Severidad:</strong> ${alert.severity}/10</p>
          <p><strong>Categoría:</strong> ${alert.category}</p>
          
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5174'}/dashboard" class="cta-button">
            Ver Dashboard Completo
          </a>
          
          <p style="margin-top: 30px; color: #666; font-size: 14px;">
            Este es un mensaje automático de ShopGuard. Estamos monitoreando tu cuenta 24/7 para proteger tu negocio.
          </p>
        </div>
        <div class="footer">
          <p>ShopGuard © 2026 | Account Protection for TikTok Shop</p>
          <p>Para dejar de recibir estas alertas, actualiza tus preferencias en el dashboard.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Send welcome email
 */
export async function sendWelcomeEmail(user) {
  try {
    await transporter.sendMail({
      from: `"ShopGuard" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: '🎉 Bienvenido a ShopGuard',
      html: `
        <h1>¡Bienvenido a ShopGuard!</h1>
        <p>Hola ${user.name},</p>
        <p>Tu cuenta ha sido creada exitosamente. Ahora puedes conectar tus tiendas de TikTok Shop y comenzar a proteger tu negocio.</p>
        <p><a href="${process.env.FRONTEND_URL || 'http://localhost:5174'}/dashboard">Ir al Dashboard</a></p>
      `
    });
    
    logger.info(`Welcome email sent to ${user.email}`);
  } catch (error) {
    logger.error('Failed to send welcome email:', error);
  }
}
