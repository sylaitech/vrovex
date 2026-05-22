# ⚡ ShopGuard - Inicio Rápido (5 minutos)

## 🚀 Instalación Express

### 1. Instalar Todo (1 minuto)
```bash
npm run setup
```

Este comando:
- ✅ Instala dependencias del frontend
- ✅ Instala dependencias del backend
- ✅ Verifica que todo esté correcto

---

### 2. Configurar Backend (2 minutos)

```bash
# Copiar template
cp server/.env.example server/.env

# Editar server/.env
```

**Mínimo requerido:**
```env
MONGODB_URI=mongodb://localhost:27017/shopguard
JWT_SECRET=cambia-esto-por-algo-seguro-123456
TIKTOK_APP_KEY=tu-app-key-aqui
TIKTOK_APP_SECRET=tu-app-secret-aqui
```

---

### 3. Iniciar MongoDB (30 segundos)

**Windows:**
```bash
net start MongoDB
```

**Linux/Mac:**
```bash
sudo systemctl start mongod
```

---

### 4. Iniciar Sistema (1 minuto)

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

Espera ver:
```
✅ Connected to MongoDB
🚀 ShopGuard Backend running on port 5000
🔍 Metrics monitoring started
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

Espera ver:
```
VITE v8.0.14  ready in XXX ms
➜  Local:   http://localhost:5174/
```

---

### 5. Abrir Navegador (30 segundos)

```
http://localhost:5174/
```

✅ Deberías ver la landing page con animaciones 3D

---

## 🔑 Obtener Credenciales TikTok (Opcional)

Si quieres conectar tiendas reales:

1. Ir a: https://partner.tiktokshop.com/
2. Crear cuenta de desarrollador
3. Crear aplicación
4. Copiar `APP_KEY` y `APP_SECRET`
5. Pegar en `server/.env`
6. Reiniciar backend

---

## ✅ Verificar que Todo Funciona

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
Abrir http://localhost:5174/ - Deberías ver:
- ✅ Landing page
- ✅ Animaciones 3D
- ✅ Partículas flotantes
- ✅ Luces ambientales

---

## 🎯 Primer Uso

### 1. Registrar Usuario
```
Click "Get started free" → Completar formulario
```

### 2. Ver Dashboard
```
Después de registrar → Ver dashboard simulado
```

### 3. Conectar Tienda (con credenciales TikTok)
```
Dashboard → "Conectar Tienda" → Autorizar en TikTok
```

---

## 🐛 Problemas Comunes

### MongoDB no inicia
```bash
# Windows
net start MongoDB

# Linux/Mac
sudo systemctl start mongod
```

### Puerto ocupado
Cambiar en `server/.env`:
```env
PORT=5001
```

### Dependencias faltantes
```bash
npm install
cd server && npm install
```

---

## 📚 Documentación Completa

- **SETUP.md** - Guía detallada de instalación
- **README.md** - Documentación principal
- **server/README.md** - Documentación del backend
- **BACKEND-COMPLETE.md** - Resumen del backend
- **RESUMEN-EJECUTIVO.md** - Resumen ejecutivo

---

## 🎉 ¡Listo!

Tu sistema ShopGuard está funcionando.

**Sin credenciales TikTok:**
- ✅ Frontend completo
- ✅ Dashboard simulado
- ✅ Generador de appeals (demo)
- ✅ Scanner de compliance (funcional)

**Con credenciales TikTok:**
- ✅ Todo lo anterior +
- ✅ Conexión real con TikTok Shop
- ✅ Monitoreo automático 24/7
- ✅ Alertas reales por email

---

**⚡ Tiempo total: ~5 minutos**

**🛡️ Tu negocio de TikTok Shop ahora está protegido 24/7**
