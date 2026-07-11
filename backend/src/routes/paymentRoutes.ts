import { Router } from 'express';
import { createCheckoutSession, stripeWebhook } from '../controllers/paymentController.js';
import { authenticateJWT } from '../middleware/authMiddleware.js';

const router = Router();

// Webhook is called by Stripe, needs raw access (no JWT auth check)
router.post('/webhook', stripeWebhook);

// Protected checkouts
router.post('/create-checkout-session', authenticateJWT, createCheckoutSession);

export default router;
