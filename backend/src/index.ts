import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import importRouter from './routes/import.routes';
import { setupSwagger } from './utils/swagger';
import { logger } from './utils/logger';

const app = express();
const PORT = process.env.PORT || 5000;

// Security Headers
app.use(helmet());

// CORS configuration
const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
app.use(
  cors({
    origin: allowedOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  })
);

// Rate Limiter: 100 requests per 15 minutes
const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10);
const maxRequests = parseInt(process.env.RATE_LIMIT_MAX || '100', 10);
const limiter = rateLimit({
  windowMs,
  max: maxRequests,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// Request Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logging Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info({ method: req.method, url: req.url, ip: req.ip }, 'Incoming request');
  next();
});

// API Routes
app.use('/api', importRouter);

// Setup Interactive Swagger UI Documentation
setupSwagger(app);

// Health Check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', time: new Date() });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error({ error: err.message, stack: err.stack }, 'Unhandled application error');
  res.status(500).json({
    success: false,
    error: 'An internal server error occurred',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

export default app; // export for testing
