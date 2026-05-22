# ShopGuard Backend API

Backend completo para ShopGuard - Sistema de protección de cuentas de TikTok Shop.

## 🚀 Características

- ✅ Autenticación JWT completa
- ✅ Integración con TikTok Shop API
- ✅ Monitoreo automático de métricas cada 5 minutos
- ✅ Sistema de alertas en tiempo real
- ✅ Generador automático de appeals con IA
- ✅ Scanner de compliance para productos
- ✅ Historial de métricas con predicciones
- ✅ Notificaciones por email
- ✅ Base de datos MongoDB
- ✅ Logging con Winston

## 📋 Requisitos Previos

- Node.js 18+ 
- MongoDB 6+
- Cuenta de TikTok Shop Partner (para obtener API keys)

## 🔧 Instalación

1. Instalar dependencias:
```bash
cd server
npm install
```

2. Configurar variables de entorno:
```bash
cp .env.example .env
```

3. Editar `.env` con tus credenciales:
```env
# TikTok Shop API
TIKTOK_APP_KEY=tu-app-key-aqui
TIKTOK_APP_SECRET=tu-app-secret-aqui

# MongoDB
MONGODB_URI=mongodb://localhost:27017/shopguard

# JWT
JWT_SECRET=cambia-esto-por-un-secret-seguro

# Email (opcional)
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password
```

4. Iniciar MongoDB:
```bash
# Windows
net start MongoDB

# Linux/Mac
sudo systemctl start mongod
```

5. Iniciar servidor:
```bash
# Desarrollo
npm run dev

# Producción
npm start
```

## 📡 API Endpoints

### Autenticación
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/me` - Obtener usuario actual
- `PATCH /api/auth/preferences` - Actualizar preferencias

### Tiendas
- `GET /api/shops` - Listar tiendas del usuario
- `GET /api/shops/:shopId` - Obtener tienda específica
- `GET /api/shops/connect/url` - Obtener URL de autorización TikTok
- `POST /api/shops/connect` - Conectar tienda TikTok
- `POST /api/shops/:shopId/refresh` - Refrescar métricas manualmente
- `PATCH /api/shops/:shopId` - Actualizar configuración
- `DELETE /api/shops/:shopId` - Eliminar tienda

### Métricas
- `GET /api/metrics/:shopId/current` - Métricas actuales
- `GET /api/metrics/:shopId/history` - Historial de métricas
- `GET /api/metrics/summary` - Resumen de todas las tiendas

### Alertas
- `GET /api/alerts` - Listar alertas
- `GET /api/alerts/:alertId` - Obtener alerta específica
- `PATCH /api/alerts/:alertId/dismiss` - Descartar alerta
- `PATCH /api/alerts/:alertId/resolve` - Resolver alerta
- `GET /api/alerts/stats/summary` - Estadísticas de alertas

### Appeals
- `GET /api/appeals` - Listar appeals
- `POST /api/appeals/generate` - Generar appeal con IA
- `POST /api/appeals/:appealId/submit` - Enviar appeal a TikTok
- `PATCH /api/appeals/:appealId` - Actualizar appeal
- `DELETE /api/appeals/:appealId` - Eliminar appeal

### Compliance
- `POST /api/compliance/scan` - Escanear texto de producto
- `POST /api/compliance/scan/batch` - Escaneo masivo
- `GET /api/compliance/rules` - Obtener reglas de compliance

## 🔐 Autenticación

Todas las rutas (excepto register/login) requieren token JWT:

```javascript
headers: {
  'Authorization': 'Bearer tu-token-jwt'
}
```

## 🔄 Monitoreo Automático

El sistema ejecuta automáticamente:

- **Cada 5 minutos**: Verifica métricas de todas las tiendas activas
- **Detección de alertas**: Crea alertas cuando se detectan problemas
- **Envío de emails**: Notifica al usuario sobre alertas críticas
- **Predicciones**: Calcula riesgo de suspensión y días hasta crítico

## 📊 Modelos de Datos

### User
- email, password, name
- plan (basic/pro/enterprise)
- shops (referencias)
- alertPreferences

### Shop
- shopId, shopName, region
- tiktokAccessToken, tiktokRefreshToken
- metrics (accountHealth, lateDispatchRate, etc.)
- status (healthy/warning/critical/suspended)

### Alert
- shopId, userId
- type (danger/warning/info)
- category (late_dispatch/account_health/vtr/compliance)
- title, description, severity
- status (active/resolved/dismissed)

### Appeal
- shopId, userId
- category, generatedContent
- status (draft/submitted/approved/rejected)
- tiktokCaseId

### MetricsHistory
- shopId, timestamp
- metrics snapshot
- predictions (suspensionRisk, daysUntilCritical)

## 🔌 Integración con TikTok Shop API

### Obtener Credenciales

1. Registrarse en TikTok Shop Partner: https://partner.tiktokshop.com/
2. Crear una aplicación
3. Obtener `APP_KEY` y `APP_SECRET`
4. Configurar Redirect URI: `http://localhost:5000/api/auth/tiktok/callback`

### Flujo OAuth

1. Frontend solicita URL de autorización: `GET /api/shops/connect/url`
2. Usuario autoriza en TikTok
3. TikTok redirige con `auth_code`
4. Frontend envía código: `POST /api/shops/connect`
5. Backend intercambia código por tokens
6. Tokens se guardan y se inicia monitoreo

## 📧 Configuración de Email

Para Gmail:
1. Habilitar verificación en 2 pasos
2. Generar App Password: https://myaccount.google.com/apppasswords
3. Usar App Password en `SMTP_PASS`

## 🐛 Debugging

Logs se guardan en:
- `logs/error.log` - Solo errores
- `logs/combined.log` - Todos los logs

Ver logs en tiempo real:
```bash
tail -f logs/combined.log
```

## 🚀 Despliegue en Producción

### Variables de entorno adicionales:
```env
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://tu-dominio.com
```

### Recomendaciones:
- Usar MongoDB Atlas para base de datos
- Configurar HTTPS con certificado SSL
- Usar PM2 para gestión de procesos
- Configurar firewall y rate limiting
- Habilitar CORS solo para tu dominio

## 📝 Notas Importantes

- Los tokens de TikTok expiran - el sistema los refresca automáticamente
- El monitoreo se ejecuta solo para tiendas con `isActive: true`
- Las métricas históricas se eliminan automáticamente después de 90 días
- Los emails solo se envían si el usuario tiene `alertPreferences.email: true`

## 🆘 Soporte

Para problemas con la API de TikTok:
- Documentación oficial: https://partner.tiktokshop.com/doc
- Soporte: https://seller-support.tiktok.com/

## 📄 Licencia

Propietario - ShopGuard © 2026
