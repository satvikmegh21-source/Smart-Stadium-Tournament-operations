import { Router } from 'express';
import { 
  getPlayers, 
  getPlayerById, 
  updatePlayerProfile, 
  updatePlayerFitness, 
  updatePlayerSuspension, 
  logPlayerTransfer 
} from '../controllers/playerController.js';
import { authenticateJWT, authorizeRoles } from '../middleware/authMiddleware.js';
import { Role } from '@prisma/client';

const router = Router();

// Public/Read-Only
router.get('/', getPlayers);
router.get('/:id', getPlayerById);

// Protected modifying routes
router.use(authenticateJWT);

router.put('/:id', updatePlayerProfile); // Inside controller, checks ownership or Manager/Admin
router.post('/:id/fitness', authorizeRoles(Role.SUPER_ADMIN, Role.COACH, Role.MEDICAL_STAFF), updatePlayerFitness);
router.post('/:id/suspension', authorizeRoles(Role.SUPER_ADMIN, Role.TOURNAMENT_ORGANIZER), updatePlayerSuspension);
router.post('/:id/transfer', authorizeRoles(Role.SUPER_ADMIN, Role.TEAM_MANAGER), logPlayerTransfer);

export default router;
