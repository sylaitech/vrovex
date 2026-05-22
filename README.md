# 🛡️ ShopGuard - Account Protection for TikTok Shop

Sistema completo de protección y monitoreo 24/7 para cuentas de TikTok Shop. Detecta problemas antes de que se conviertan en suspensiones, genera appeals automáticos con IA y escanea productos para compliance.

## ✨ Características Principales

### 🔍 Monitoreo Automático 24/7
- Verifica métricas cada 5 minutos
- Detecta anomalías 48 horas antes del umbral crítico
- Predicción de riesgo de suspensión con IA

### 🚨 Sistema de Alertas Inteligente
- Alertas en tiempo real por email y push
- Categorización por severidad (1-10)
- Recomendaciones de acción inmediata

### 📝 Generador de Appeals con IA
- Redacción automática optimizada legalmente
- Plantillas específicas por tipo de infracción
- Mayor tasa de éxito del mercado

### ✅ Scanner de Compliance
- Detección de keywords prohibidos
- Verificación de marcas registradas
- Análisis de afirmaciones engañosas

### 📊 Dashboard Interactivo
- Métricas en tiempo real
- Historial de 90 días
- Múltiples tiendas en un solo panel

## 🚀 Instalación Rápida

```bash
# 1. Instalar dependencias
npm install
cd server && npm install && cd ..

# 2. Configurar
cp server/.env.example server/.env
# Editar server/.env con tus credenciales

# 3. Verificar setup
npm run verify

# 4. Iniciar (2 terminales)
cd server && npm run dev  # Terminal 1
npm run dev               # Terminal 2
```

Ver **[SETUP.md](SETUP.md)** para instrucciones completas.

## 📖 Documentación

- **[SETUP.md](SETUP.md)** - Guía de instalación completa
- **[server/README.md](server/README.md)** - Documentación del backend API

## 🔐 Obtener Credenciales TikTok

1. Registrarse en [TikTok Shop Partner](https://partner.tiktokshop.com/)
2. Crear aplicación
3. Copiar `APP_KEY` y `APP_SECRET` a `server/.env`

## 📦 Stack Tecnológico

**Frontend:** React 19 + Vite 8 + Tailwind CSS 4  
**Backend:** Node.js + Express + MongoDB  
**Monitoreo:** Node-Cron + Winston  
**Notificaciones:** Nodemailer

## 🎯 Uso Básico

1. **Registrar cuenta** → Dashboard
2. **Conectar tienda TikTok** → Autorizar
3. **Monitoreo automático** → Cada 5 minutos
4. **Recibir alertas** → Email + Dashboard
5. **Generar appeals** → Con IA

## 📊 Métricas Monitoreadas

- Account Health Score (< 400 = crítico)
- Late Dispatch Rate (> 4% = crítico)
- Valid Tracking Rate (< 95% = warning)
- On-Time Delivery (< 90% = warning)

## 🤖 IA y Predicciones

- **Shield Score** (0-100): Salud general de la cuenta
- **Riesgo de Suspensión** (0-100%): Probabilidad de ban
- **Días hasta Crítico**: Ventana de acción

## 📧 Notificaciones

- Alertas críticas por email
- Resumen diario (opcional)
- Confirmación de appeals

## 🔒 Seguridad

✅ JWT Authentication  
✅ Passwords hasheados  
✅ Tokens encriptados  
✅ CORS configurado  
✅ Logs de auditoría

## 📄 Licencia

Propietario - ShopGuard © 2026

## 🆘 Soporte

- **Documentación**: SETUP.md y server/README.md
- **TikTok API**: https://partner.tiktokshop.com/doc

---

**⚡ Protege tu negocio 24/7. Solo falta conectar tu API de TikTok.**
