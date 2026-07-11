import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import swaggerJsDoc from 'swagger-jsdoc';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { errorHandler } from './middleware/errorMiddleware.js';

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
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Smart Stadium & Tournament Operations API',
      version: '1.0.0',
      description: 'API Documentation for the Smart Stadium Platform',
    },
    servers: [
      {
        url: process.env.BACKEND_URL || 'http://localhost:5000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.ts', './dist/routes/*.js'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date() });
});

// Route mounting
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// Global Error Handler
app.use(errorHandler);

export default app;
