import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import complaintsRouter from './routes/complaints.js';
import statsRouter from './routes/stats.js';
import authRouter from './routes/auth.js';
import { requestLogger } from './middleware/logger.js';
import { globalErrorHandler, notFoundHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();

// Enable CORS for frontend requests
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// JSON body parsing for standard API requests
app.use(express.json());

// Raw text parsing for XML direct uploads
app.use(express.text({ type: ['text/xml', 'application/xml'] }));

// URL-encoded body parsing
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Mount modular API routes
app.use('/api/auth', authRouter);
app.use('/api/stats', statsRouter);
app.use('/api/complaints', complaintsRouter);

// 404 handler
app.use(notFoundHandler);

// Global centralized error handler
app.use(globalErrorHandler);

export default app;
