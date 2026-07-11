import { Router } from 'express';
import { 
  getCoaches, 
  getCoachById, 
  updateCoachProfile, 
  planTrainingSession, 
  logAttendance, 
  addPerformanceReport 
} from '../controllers/coachController.js';
import { authenticateJWT } from '../middleware/authMiddleware.js';

const router = Router();

// Public/Read-Only
router.get('/', getCoaches);
router.get('/:id', getCoachById);

// Protected modifying routes
router.use(authenticateJWT);

router.put('/:id', updateCoachProfile);
router.post('/:id/sessions', planTrainingSession);
router.post('/:id/attendance', logAttendance);
router.post('/:id/performance', addPerformanceReport);

export default router;
