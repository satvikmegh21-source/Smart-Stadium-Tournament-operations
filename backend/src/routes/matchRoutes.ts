import { Router } from 'express';
import { 
  getMatches, 
  getMatchById, 
  updateMatchStatus, 
  updateMatchScore, 
  addMatchEvent 
} from '../controllers/matchController.js';
import { authenticateJWT } from '../middleware/authMiddleware.js';

const router = Router();

// Public/Read-Only
router.get('/', getMatches);
router.get('/:id', getMatchById);

// Protected score updates & event logging
router.use(authenticateJWT);

router.post('/:id/status', updateMatchStatus);
router.post('/:id/score', updateMatchScore);
router.post('/:id/events', addMatchEvent);

export default router;
