import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { config } from './config';
import { logger } from './utils/logger';
import { errorHandler, requestLogger } from './middleware/error.handler';

// Route imports
import authRoutes from './modules/auth/auth.routes';
import adminRoutes from './modules/admin/admin.routes';
import takmirRoutes from './modules/takmir';
import publicRoutes from './modules/public/public.routes';
import { locationRouter } from './modules/location';

const app = express();

// ─── Global Middleware ──────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// ─── Static Files (public uploads) ─────────────────────────
app.use('/uploads/public', express.static(path.join(config.upload.dir, 'public')));

// ─── API Routes ─────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'Masjid Ecosystem API is running.', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/takmir', takmirRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/location', locationRouter);

// ─── 404 Handler ────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint not found.' });
});

// ─── Global Error Handler ───────────────────────────────────
app.use(errorHandler);

// ─── Start Server ───────────────────────────────────────────
app.listen(config.port, () => {
  logger.success(`🕌 Masjid Ecosystem API running on port ${config.port}`);
  logger.info(`Environment: ${config.nodeEnv}`);
});

export default app;
