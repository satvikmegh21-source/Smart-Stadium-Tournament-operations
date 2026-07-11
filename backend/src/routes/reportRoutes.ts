import { Router } from 'express';
import { exportPDFReport, exportCSVReport } from '../controllers/reportController.js';
import { authenticateJWT } from '../middleware/authMiddleware.js';

const router = Router();

// Protected PDF audit export routes
router.get('/pdf', authenticateJWT, exportPDFReport);

// Protected CSV transaction export routes
router.get('/csv', authenticateJWT, exportCSVReport);

export default router;
