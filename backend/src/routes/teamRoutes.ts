import { Router } from 'express';
import { 
  getTeams, 
  getTeamById, 
  createTeam, 
  updateTeam, 
  deleteTeam, 
  assignCoach, 
  assignPlayer, 
  removePlayer 
} from '../controllers/teamController.js';
import { authenticateJWT, authorizeRoles } from '../middleware/authMiddleware.js';
import { Role } from '@prisma/client';

const router = Router();

// Public/Read-Only
router.get('/', getTeams);
router.get('/:id', getTeamById);

// Protected modifying routes
router.use(authenticateJWT);

router.post('/', authorizeRoles(Role.SUPER_ADMIN, Role.TOURNAMENT_ORGANIZER), createTeam);
router.put('/:id', authorizeRoles(Role.SUPER_ADMIN, Role.TEAM_MANAGER), updateTeam);
router.delete('/:id', authorizeRoles(Role.SUPER_ADMIN), deleteTeam);
router.post('/assign-coach', authorizeRoles(Role.SUPER_ADMIN, Role.TEAM_MANAGER), assignCoach);
router.post('/assign-player', authorizeRoles(Role.SUPER_ADMIN, Role.TEAM_MANAGER), assignPlayer);
router.post('/remove-player', authorizeRoles(Role.SUPER_ADMIN, Role.TEAM_MANAGER), removePlayer);

export default router;
