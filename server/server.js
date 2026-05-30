import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import cron from 'node-cron';
import logger from './utils/logger.js';
import { createClient } from '@supabase/supabase-js';

// Import routes
import authRoutes from './routes/auth.js';
import shopRoutes from './routes/shops.js';
import metricsRoutes from './routes/metrics.js';
import alertsRoutes from './routes/alerts.js';
import appealsRoutes from './routes/appeals.js';
import complianceRoutes from './routes/compliance.js';
import billingRoutes from './routes/billing.js';
import webhookRoutes from './routes/webhooks.js';
import tiktokOAuthRoutes from './routes/tiktokOAuth.js';
import adminRoutes from './routes/admin.js';
import dashboardRoutes from './routes/dashboard.js';

// Import services
import { startMetricsMonitoring } from './services/monitoring.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Trust Vercel/proxy X-Forwarded-For so rate limiting uses real client IP
app.set('trust proxy', 1);

// Initialize Supabase
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Security headers — applied before everything else
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", process.env.FRONTEND_URL || ''].filter(Boolean),
      frameSrc:   ["'none'"],
      objectSrc:  ["'none'"],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
}));

// Rate limiters — keyed by real client IP (requires trust proxy above)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,                     // 20 attempts per IP per 15 min (generous for real users)
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Try again in 15 minutes.' },
  skipSuccessfulRequests: true, // Only count failed attempts
  keyGenerator: (req) => req.ip || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown',
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests.' },
  keyGenerator: (req) => req.ip || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown',
});

// Middleware — restrict CORS to known frontend origins (with and without www)
const baseOrigins = (process.env.FRONTEND_URL || 'http://localhost:5174')
  .split(',').map((o) => o.trim());
const allowedOrigins = new Set([
  ...baseOrigins,
  ...baseOrigins.map((o) => o.replace('://', '://www.')),
  ...baseOrigins.map((o) => o.replace('://www.', '://')),
]);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.has(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
}));

// Apply rate limiters
app.use('/api/auth/login',           authLimiter);
app.use('/api/auth/register',        authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/auth/reset-password',  authLimiter);
app.use('/api',                      generalLimiter);

// Stripe webhooks need raw body (before JSON parser)
app.use('/api/webhooks', webhookRoutes);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/appeals', appealsRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/tiktok', tiktokOAuthRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/vrovex', dashboardRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Vercel serverless: export app as default, no app.listen()
// Local dev: listen on PORT
if (!process.env.VERCEL) {
  const server = app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Supabase connected: ${process.env.SUPABASE_URL}`);
    startMetricsMonitoring();
  });

  process.on('SIGTERM', () => {
    server.close(() => process.exit(0));
  });
} else {
  startMetricsMonitoring();
}

export default app;
