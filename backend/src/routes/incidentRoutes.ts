import { Router } from 'express';
import { 
  getIncidents, 
  reportIncident, 
  updateIncidentStatus 
} from '../controllers/incidentController.js';
import { authenticateJWT, authorizeRoles } from '../middleware/authMiddleware.js';
import { Role } from '@prisma/client';

const router = Router();

// Protected: All routes need authentication
router.use(authenticateJWT);

router.get('/', authorizeRoles(Role.SUPER_ADMIN, Role.STADIUM_MANAGER), getIncidents);
router.post('/', reportIncident); // Any logged in spectator or user can report emergency
router.post('/:id/resolve', authorizeRoles(Role.SUPER_ADMIN, Role.STADIUM_MANAGER), updateIncidentStatus);

export default router;
