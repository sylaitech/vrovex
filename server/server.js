import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cron from 'node-cron';
import logger from './utils/logger.js';

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

// Import services
import { startMetricsMonitoring } from './services/monitoring.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());

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

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    logger.info('✅ Connected to MongoDB');
    
    // Start server
    app.listen(PORT, () => {
      logger.info(`🚀 ShopGuard Backend running on port ${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV}`);
      
      // Start monitoring services
      startMetricsMonitoring();
      logger.info('🔍 Metrics monitoring started');
    });
  })
  .catch((err) => {
    logger.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  mongoose.connection.close(() => {
    logger.info('MongoDB connection closed');
    process.exit(0);
  });
});
