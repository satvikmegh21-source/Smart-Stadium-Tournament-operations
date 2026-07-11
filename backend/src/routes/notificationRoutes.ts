import { Router } from 'express';
import { streamNotifications, createNotification } from '../controllers/notificationController.js';
import { authenticateJWT } from '../middleware/authMiddleware.js';

const router = Router();

// Stream SSE is opened by browsers
router.get('/stream', streamNotifications);

// Modifying and dispatching alerts
router.post('/', authenticateJWT, createNotification);

export default router;
