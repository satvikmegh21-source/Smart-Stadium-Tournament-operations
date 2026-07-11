import { Router } from 'express';
import { getReferees, getRefereeById, updateRefereeProfile } from '../controllers/refereeController.js';
import { authenticateJWT } from '../middleware/authMiddleware.js';

const router = Router();

// Public/Read-Only
router.get('/', getReferees);
router.get('/:id', getRefereeById);

// Protected modifying routes
router.use(authenticateJWT);

router.put('/:id', updateRefereeProfile);

export default router;
