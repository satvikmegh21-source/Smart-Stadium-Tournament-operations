import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import app from './app.js';
import prisma from './config/db.js';

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Test Prisma Connection
    console.log('Connecting to database...');
    await prisma.$connect();
    console.log('Database connection established successfully.');

    app.listen(PORT, () => {
      console.log(`🚀 Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      console.log(`📄 Swagger documentation available at http://localhost:${PORT}/api-docs`);
    });
  } catch (err) {
    console.error('Fatal: Failed to start server:', err);
    process.exit(1);
  }
}

// Handle unhandled rejections and exceptions
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

startServer();
