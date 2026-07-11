import { Router } from 'express';
import { getUsers, updateUserRole, getActivityLogs, getSystemMetrics } from '../controllers/adminController.js';
import { authenticateJWT, authorizeRoles } from '../middleware/authMiddleware.js';
import { Role } from '@prisma/client';

const router = Router();

// Apply auth middleware to all admin routes
router.use(authenticateJWT);
router.use(authorizeRoles(Role.SUPER_ADMIN));

router.get('/users', getUsers);
router.post('/update-role', updateUserRole);
router.get('/logs', getActivityLogs);
router.get('/metrics', getSystemMetrics);

export default router;
