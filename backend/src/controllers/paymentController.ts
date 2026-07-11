import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import Stripe from 'stripe';
import prisma from '../config/db.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_dummy';
const stripe = new Stripe(stripeKey, {
  apiVersion: '2024-11-20.acacia' as any,
});

const checkoutSchema = z.object({
  matchId: z.string(),
  seatZone: z.string(),
  seatNumber: z.string(),
  price: z.number().positive(),
});

export async function createCheckoutSession(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const body = checkoutSchema.parse(req.body);

    const match = await prisma.match.findUnique({
      where: { id: body.matchId },
      include: {
        team1: { select: { name: true } },
        team2: { select: { name: true } }
      }
    });

    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }

    // If using mock Stripe key, simulate session URL
    if (stripeKey === 'sk_test_dummy') {
      const mockSessionId = `cs_test_${Math.random().toString(36).substring(2, 15)}`;
      const mockUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/tickets?session_id=${mockSessionId}&matchId=${body.matchId}&seatZone=${encodeURIComponent(body.seatZone)}&seatNumber=${encodeURIComponent(body.seatNumber)}&price=${body.price}`;

      return res.status(200).json({
        success: true,
        message: 'Mock checkout session created',
        url: mockUrl,
        sessionId: mockSessionId,
      });
    }

    // Real Stripe implementation
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Match Ticket: ${match.team1.name} vs ${match.team2.name}`,
              description: `Zone: ${body.seatZone}, Seat: ${body.seatNumber}`,
            },
            unit_amount: Math.round(body.price * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/tickets?session_id={CHECKOUT_SESSION_ID}&matchId=${body.matchId}&seatZone=${encodeURIComponent(body.seatZone)}&seatNumber=${encodeURIComponent(body.seatNumber)}&price=${body.price}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/tickets?cancelled=true`,
      metadata: {
        userId,
        matchId: body.matchId,
        seatZone: body.seatZone,
        seatNumber: body.seatNumber,
        price: body.price.toString(),
      }
    });

    res.status(200).json({
      success: true,
      url: session.url,
      sessionId: session.id,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: err.errors });
    }
    next(err);
  }
}

export async function stripeWebhook(req: Request, res: Response, next: NextFunction) {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !endpointSecret) {
    return res.status(400).json({ success: false, message: 'Missing Stripe webhook signature or secret.' });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err: any) {
    console.error(`[Webhook] Signature verification failed:`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle transaction confirmation event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    // Extract metadata
    const metadata = session.metadata;
    if (metadata) {
      const { userId, matchId, seatZone, seatNumber, price } = metadata;
      
      try {
        await prisma.$transaction(async (tx) => {
          const booking = await tx.booking.create({
            data: {
              userId,
              matchId,
              ticketsCount: 1,
              totalPrice: parseFloat(price),
              status: 'CONFIRMED',
            }
          });

          await tx.ticket.create({
            data: {
              bookingId: booking.id,
              seatNumber,
              zone: seatZone,
              qrCode: `STRIPE-QR-${booking.id}`,
            }
          });

          await tx.payment.create({
            data: {
              bookingId: booking.id,
              amount: parseFloat(price),
              status: 'SUCCESSFUL',
              method: 'STRIPE',
              transactionId: session.payment_intent as string || `STRIPE-${session.id}`,
            }
          });
        });

        console.log(`[Webhook] Created booking for user: ${userId}, match: ${matchId}`);
      } catch (err) {
        console.error(`[Webhook] Database processing failed:`, err);
      }
    }
  }

  res.status(200).json({ received: true });
}
