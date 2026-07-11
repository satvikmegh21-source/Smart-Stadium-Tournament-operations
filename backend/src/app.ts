import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import teamRoutes from './routes/teamRoutes.js';
import tournamentRoutes from './routes/tournamentRoutes.js';
import playerRoutes from './routes/playerRoutes.js';
import coachRoutes from './routes/coachRoutes.js';
import refereeRoutes from './routes/refereeRoutes.js';
import matchRoutes from './routes/matchRoutes.js';
import incidentRoutes from './routes/incidentRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import partnershipRoutes from './routes/partnershipRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import { errorHandler } from './middleware/errorMiddleware.js';
import swaggerSpec from './config/swagger.js';

const app = express();

// Security Middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger Config
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date() });
});

// Route mounting
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/coaches', coachRoutes);
app.use('/api/referees', refereeRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/partnerships', partnershipRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reports', reportRoutes);

// Global Error Handler
app.use(errorHandler);

export default app;
