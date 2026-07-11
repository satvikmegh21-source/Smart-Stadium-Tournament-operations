import { Router } from 'express';
import { 
  getTournaments, 
  getTournamentById, 
  createTournament, 
  recalculatePointsTable, 
  deleteTournament 
} from '../controllers/tournamentController.js';
import { authenticateJWT, authorizeRoles } from '../middleware/authMiddleware.js';
import { Role } from '@prisma/client';

const router = Router();

// Public/Read-Only
router.get('/', getTournaments);
router.get('/:id', getTournamentById);

// Protected modifying routes
router.use(authenticateJWT);

router.post('/', authorizeRoles(Role.SUPER_ADMIN, Role.TOURNAMENT_ORGANIZER), createTournament);
router.post('/:id/recalculate', authorizeRoles(Role.SUPER_ADMIN, Role.TOURNAMENT_ORGANIZER), recalculatePointsTable);
router.delete('/:id', authorizeRoles(Role.SUPER_ADMIN), deleteTournament);

export default router;
