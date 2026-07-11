import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/db.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

const purchaseSchema = z.object({
  matchId: z.string(),
  seatZone: z.string().min(1),
  seatNumber: z.string().min(1),
  price: z.number().positive(),
});

export async function getPurchasedTickets(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const tickets = await prisma.ticket.findMany({
      where: {
        booking: {
          userId: userId
        }
      },
      include: {
        booking: {
          include: {
            match: {
              include: {
                team1: { select: { name: true } },
                team2: { select: { name: true } },
                stadium: { select: { name: true } },
              }
            },
            payment: true,
          }
        }
      },
      orderBy: {
        booking: {
          createdAt: 'desc'
        }
      }
    });

    res.status(200).json({ success: true, data: tickets });
  } catch (err) {
    next(err);
  }
}

export async function purchaseTicket(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const body = purchaseSchema.parse(req.body);

    // 1. Verify match exists
    const match = await prisma.match.findUnique({ where: { id: body.matchId } });
    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }

    // 2. Check if seat is already booked in Category / Zone for this match
    const existing = await prisma.ticket.findFirst({
      where: {
        booking: {
          matchId: body.matchId,
        },
        zone: body.seatZone,
        seatNumber: body.seatNumber,
      }
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'This seat is already booked' });
    }

    // 3. Create Ticket and simulate payment transaction inside Prisma
    const result = await prisma.$transaction(async (tx) => {
      // Create booking
      const booking = await tx.booking.create({
        data: {
          userId,
          matchId: body.matchId,
          ticketsCount: 1,
          totalPrice: body.price,
          status: 'CONFIRMED',
        }
      });

      // Create ticket
      const ticket = await tx.ticket.create({
        data: {
          bookingId: booking.id,
          seatNumber: body.seatNumber,
          zone: body.seatZone,
          qrCode: `QR-${booking.id}-${body.seatZone}-${body.seatNumber}`,
        }
      });

      // Create payment
      await tx.payment.create({
        data: {
          bookingId: booking.id,
          amount: body.price,
          status: 'SUCCESSFUL',
          method: 'CREDIT_CARD',
          transactionId: `TXN-${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
        }
      });

      return ticket;
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'TICKET_PURCHASED',
        ipAddress: req.ip,
        device: req.headers['user-agent'],
        details: `Purchased seat ${body.seatZone}-${body.seatNumber} for match ${body.matchId}`,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Ticket purchased successfully',
      data: result,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: err.errors });
    }
    next(err);
  }
}
