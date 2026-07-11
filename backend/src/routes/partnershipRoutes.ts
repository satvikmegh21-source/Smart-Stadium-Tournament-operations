import { Router } from 'express';
import { 
  getVendors, 
  getSponsors, 
  createVendorLease, 
  createSponsorship 
} from '../controllers/partnershipController.js';
import { authenticateJWT, authorizeRoles } from '../middleware/authMiddleware.js';
import { Role } from '@prisma/client';

const router = Router();

// Public/Read-Only
router.get('/vendors', getVendors);
router.get('/sponsors', getSponsors);

// Protected modifying routes
router.use(authenticateJWT);

router.post('/vendors', authorizeRoles(Role.SUPER_ADMIN, Role.STADIUM_MANAGER), createVendorLease);
router.post('/sponsors', authorizeRoles(Role.SUPER_ADMIN, Role.TOURNAMENT_ORGANIZER), createSponsorship);

export default router;
