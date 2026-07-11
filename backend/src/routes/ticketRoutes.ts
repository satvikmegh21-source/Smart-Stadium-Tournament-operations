import { Router } from 'express';
import { getPurchasedTickets, purchaseTicket } from '../controllers/ticketController.js';
import { authenticateJWT } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateJWT);

router.get('/', getPurchasedTickets);
router.post('/purchase', purchaseTicket);

export default router;
