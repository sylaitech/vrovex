# 🚀 ShopGuard - Guía de Instalación Completa

## 📋 Requisitos del Sistema

- **Node.js** 18 o superior
- **MongoDB** 6 o superior
- **Git** (opcional)
- **Navegador** Chrome/Firefox/Edge

## 🔧 Instalación Paso a Paso

### 1. Instalar MongoDB

#### Windows:
```bash
# Descargar desde: https://www.mongodb.com/try/download/community
# Instalar y ejecutar:
net start MongoDB
```

#### Linux:
```bash
sudo apt-get install mongodb
sudo systemctl start mongod
sudo systemctl enable mongod
```

#### Mac:
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

### 2. Configurar Backend

```bash
# Navegar a la carpeta del servidor
cd server

# Instalar dependencias
npm install

# Copiar archivo de configuración
cp .env.example .env
```

### 3. Configurar Variables de Entorno

Editar `server/.env`:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/shopguard

# JWT (CAMBIAR ESTO)
JWT_SECRET=tu-secret-super-seguro-aqui-cambiar

# TikTok Shop API (Obtener en https://partner.tiktokshop.com/)
TIKTOK_APP_KEY=tu-app-key
TIKTOK_APP_SECRET=tu-app-secret
TIKTOK_API_BASE_URL=https://open-api.tiktokglobalshop.com

# Email (Opcional - para alertas)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password

# Thresholds
LATE_DISPATCH_THRESHOLD=4.0
ACCOUNT_HEALTH_CRITICAL=400
VTR_MINIMUM=95.0
ON_TIME_DELIVERY_TARGET=95.0

# Monitoring
METRICS_CHECK_INTERVAL=5
ALERT_CHECK_INTERVAL=10
```

### 4. Iniciar Backend

```bash
cd server
npm run dev
```

Deberías ver:
```
✅ Connected to MongoDB
🚀 ShopGuard Backend running on port 5000
📊 Environment: development
🔍 Metrics monitoring started
```

### 5. Configurar Frontend

En otra terminal:

```bash
# Volver a la raíz del proyecto
cd ..

# Instalar dependencias del frontend
npm install

# Iniciar frontend
npm run dev
```

Deberías ver:
```
VITE v8.0.14  ready in XXX ms
➜  Local:   http://localhost:5174/
```

### 6. Abrir en el Navegador

Navegar a: **http://localhost:5174/**

## 🔐 Obtener Credenciales de TikTok Shop

### Paso 1: Registrarse como Partner

1. Ir a: https://partner.tiktokshop.com/
2. Crear cuenta de desarrollador
3. Completar verificación

### Paso 2: Crear Aplicación

1. Dashboard → "Create App"
2. Nombre: "ShopGuard"
3. Tipo: "Seller Tools"
4. Redirect URI: `http://localhost:5000/api/auth/tiktok/callback`

### Paso 3: Obtener Credenciales

1. Copiar `App Key`
2. Copiar `App Secret`
3. Pegar en `server/.env`:
   ```env
   TIKTOK_APP_KEY=tu-app-key-aqui
   TIKTOK_APP_SECRET=tu-app-secret-aqui
   ```

### Paso 4: Reiniciar Backend

```bash
# Ctrl+C para detener
npm run dev
```

## 📧 Configurar Email (Opcional)

### Para Gmail:

1. Ir a: https://myaccount.google.com/security
2. Habilitar "Verificación en 2 pasos"
3. Ir a: https://myaccount.google.com/apppasswords
4. Crear contraseña de aplicación
5. Copiar password generado
6. Pegar en `server/.env`:
   ```env
   SMTP_USER=tu-email@gmail.com
   SMTP_PASS=password-de-16-caracteres
   ```

## ✅ Verificar Instalación

### Test Backend:

```bash
curl http://localhost:5000/health
```

Respuesta esperada:
```json
{
  "status": "ok",
  "timestamp": "2026-05-22T...",
  "uptime": 123.456
}
```

### Test Frontend:

Abrir http://localhost:5174/ - Deberías ver la landing page con animaciones.

## 🎯 Primer Uso

### 1. Registrar Usuario

1. Click en "Get started free"
2. Completar formulario
3. Recibirás email de bienvenida (si configuraste SMTP)

### 2. Conectar Tienda TikTok

1. Dashboard → "Conectar Tienda"
2. Autorizar en TikTok
3. Esperar sincronización inicial (30-60 segundos)

### 3. Ver Métricas

- El sistema comenzará a monitorear automáticamente cada 5 minutos
- Las alertas aparecerán en el dashboard
- Recibirás emails para alertas críticas

## 🐛 Solución de Problemas

### MongoDB no inicia:

```bash
# Windows
net start MongoDB

# Linux/Mac
sudo systemctl start mongod
```

### Puerto 5000 ocupado:

Cambiar en `server/.env`:
```env
PORT=5001
```

### Puerto 5174 ocupado:

El frontend automáticamente usará el siguiente disponible (5175, 5176, etc.)

### Error "Cannot connect to MongoDB":

Verificar que MongoDB esté corriendo:
```bash
# Windows
sc query MongoDB

# Linux/Mac
sudo systemctl status mongod
```

### Error "Invalid TikTok credentials":

1. Verificar que `TIKTOK_APP_KEY` y `TIKTOK_APP_SECRET` sean correctos
2. Verificar que la app esté aprobada en TikTok Partner
3. Verificar que el Redirect URI coincida exactamente

## 📦 Estructura del Proyecto

```
shopguard/
├── server/                 # Backend Node.js
│   ├── models/            # Modelos MongoDB
│   ├── routes/            # Rutas API
│   ├── services/          # Lógica de negocio
│   ├── utils/             # Utilidades
│   ├── middleware/        # Middleware Express
│   ├── server.js          # Punto de entrada
│   └── package.json
├── src/                   # Frontend React
│   ├── App.jsx           # Componente principal
│   ├── main.jsx          # Punto de entrada
│   └── index.css         # Estilos
├── public/               # Assets estáticos
├── package.json          # Dependencias frontend
└── vite.config.js        # Configuración Vite
```

## 🚀 Comandos Útiles

### Backend:
```bash
cd server
npm run dev      # Desarrollo con auto-reload
npm start        # Producción
```

### Frontend:
```bash
npm run dev      # Desarrollo
npm run build    # Build para producción
npm run preview  # Preview del build
```

### Base de Datos:
```bash
# Conectar a MongoDB
mongosh

# Ver bases de datos
show dbs

# Usar ShopGuard
use shopguard

# Ver colecciones
show collections

# Ver usuarios
db.users.find()
```

## 📚 Próximos Pasos

1. ✅ Registrar cuenta
2. ✅ Conectar tienda TikTok
3. ✅ Configurar preferencias de alertas
4. ✅ Probar generador de appeals
5. ✅ Probar scanner de compliance
6. ✅ Revisar métricas históricas

## 🆘 Soporte

- **Backend API**: Ver `server/README.md`
- **TikTok API**: https://partner.tiktokshop.com/doc
- **MongoDB**: https://docs.mongodb.com/

## 🎉 ¡Listo!

Tu instalación de ShopGuard está completa. El sistema ahora:

- ✅ Monitorea tus tiendas cada 5 minutos
- ✅ Detecta problemas antes de que sean críticos
- ✅ Genera alertas automáticas
- ✅ Envía notificaciones por email
- ✅ Predice riesgos de suspensión
- ✅ Genera appeals con IA

**Solo falta conectar tu API de TikTok y estás listo para proteger tu negocio 24/7.**
