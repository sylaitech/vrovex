import nodemailer from 'nodemailer';
import { supabase } from '../server.js';
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
    const { data: user, error } = await supabase
      .from('users')
      .select('email, alert_email')
      .eq('id', userId)
      .single();

    if (error || !user || !user.alert_email) {
      return;
    }

    const emailTemplate = getAlertEmailTemplate(alert);

    await transporter.sendMail({
      from: `"Vrovex Alerts" <${process.env.SMTP_USER}>`,
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
          <h1>🛡️ Vrovex Alert</h1>
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
            Este es un mensaje automático de Vrovex. Estamos monitoreando tu cuenta 24/7 para proteger tu negocio.
          </p>
        </div>
        <div class="footer">
          <p>Vrovex © 2026 | Account Protection for TikTok Shop</p>
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
      from: `"Vrovex" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: '🎉 Cuenta creada en Vrovex',
      html: `
        <div style="font-family: Arial, sans-serif; color: #1F2937; line-height: 1.6;">
          <h1 style="color: #003A5B;">¡Bienvenido a Vrovex!</h1>
          <p>Hola ${user.name || 'amig@'},</p>
          <p>Tu cuenta se ha creado correctamente. Estás a un paso de proteger tu tienda de TikTok Shop con Vrovex.</p>
          <p>Para activar tu suscripción y obtener acceso completo por 30 días, completa el pago desde el dashboard.</p>
          <p style="margin-top: 20px;">Cuando tu suscripción expire, tu acceso se cerrará automáticamente, y podrás renovarla cuando lo necesites.</p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5174'}/dashboard" style="display: inline-block; padding: 12px 24px; background: #0F766E; color: white; border-radius: 8px; text-decoration: none;">Ir a Vrovex</a>
          <p style="margin-top: 24px; color: #4B5563;">Gracias por confiar en Vrovex para proteger tu negocio en TikTok Shop.</p>
          <p style="margin-top: 16px; color: #6B7280; font-size: 14px;">Si tienes dudas, responde este correo y te ayudaremos.</p>
        </div>
      `
    });
    
    logger.info(`Welcome email sent to ${user.email}`);
  } catch (error) {
    logger.error('Failed to send welcome email:', error);
  }
}

export async function sendSubscriptionActivatedEmail(user) {
  try {
    const endDate = user.current_period_end
      ? new Date(user.current_period_end).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
      : '30 días desde el pago';

    await transporter.sendMail({
      from: `"Vrovex" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: '✅ Tu suscripción en Vrovex está activa',
      html: `
        <div style="font-family: Arial, sans-serif; color: #1F2937; line-height: 1.6;">
          <h1 style="color: #0F766E;">¡Bienvenido a Vrovex!</h1>
          <p>Hola ${user.name || 'amig@'},</p>
          <p>Tu pago se ha procesado correctamente y tu membresía en Vrovex está activa.</p>
          <p>Ahora tienes acceso completo a la protección de tu tienda TikTok Shop durante 30 días, hasta el <strong>${endDate}</strong>.</p>
          <div style="background: #ECFDF5; border-left: 4px solid #10B981; padding: 16px; margin: 24px 0; border-radius: 8px;">
            <strong>Tu negocio está más seguro:</strong>
            <ul style="margin: 12px 0 0 16px; color: #374151;">
              <li>Monitoreo automático 24/7</li>
              <li>Alertas por cualquier riesgo</li>
              <li>Protección ante problemas en TikTok Shop</li>
              <li>Acceso a reportes y propuestas de acción inmediata</li>
            </ul>
          </div>
          <p>Cuando tu suscripción termine, tu acceso se cerrará automáticamente. Si quieres continuar, podrás renovarla directamente desde tu cuenta.</p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5174'}/dashboard" style="display: inline-block; padding: 12px 24px; background: #0F766E; color: white; border-radius: 8px; text-decoration: none;">Ir al Dashboard</a>
          <p style="margin-top: 24px; color: #4B5563;">Gracias por confiar en Vrovex. Estamos cuidando tu tienda para que vos puedas concentrarte en vender.</p>
          <p style="margin-top: 16px; color: #6B7280; font-size: 14px;">Si necesitas ayuda, contáctanos y te asistiremos de inmediato.</p>
        </div>
      `
    });

    logger.info(`Subscription activation email sent to ${user.email}`);
  } catch (error) {
    logger.error('Failed to send subscription activation email:', error);
  }
}

export async function sendPasswordResetEmail(user, resetUrl) {
  try {
    await transporter.sendMail({
      from: `"Vrovex Shield" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: '🔐 Restablecer contraseña — Vrovex Shield',
      html: `
        <div style="font-family: Arial, sans-serif; background: #0F172A; color: #E2E8F0; padding: 40px; border-radius: 12px; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2DD4BF; font-size: 24px; margin-bottom: 8px;">Vrovex Shield</h1>
          <h2 style="color: #F1F5F9; font-size: 18px; margin-bottom: 24px;">Restablece tu contraseña</h2>
          <p style="color: #CBD5E1;">Hola ${user.name || 'amig@'},</p>
          <p style="color: #CBD5E1;">Recibimos una solicitud para restablecer la contraseña de tu cuenta Vrovex Shield. Haz clic en el botón de abajo para crear una nueva contraseña.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" style="display: inline-block; background: #0F766E; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">Restablecer contraseña</a>
          </div>
          <p style="color: #94A3B8; font-size: 13px;">Este enlace expira en 1 hora. Si no solicitaste el restablecimiento, ignora este correo.</p>
          <p style="color: #64748B; font-size: 12px; margin-top: 24px;">Vrovex Shield © 2026 | Account Protection for TikTok Shop</p>
        </div>
      `
    });
    logger.info(`Password reset email sent to ${user.email}`);
  } catch (error) {
    logger.error('Failed to send password reset email:', error);
    throw error;
  }
}
