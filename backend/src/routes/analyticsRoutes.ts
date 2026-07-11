import { Router } from 'express';
import { getAnalyticsSummary, getAIOutcomePrediction } from '../controllers/analyticsController.js';
import { authenticateJWT } from '../middleware/authMiddleware.js';

const router = Router();

// Protected analytics summary routes
router.get('/summary', authenticateJWT, getAnalyticsSummary);

// Protected AI outcome matches predictors
router.post('/predict', authenticateJWT, getAIOutcomePrediction);

export default router;
