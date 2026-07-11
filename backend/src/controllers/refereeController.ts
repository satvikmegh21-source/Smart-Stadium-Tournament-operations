import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/db.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { Role } from '@prisma/client';

const updateProfileSchema = z.object({
  licenseLevel: z.string().optional(),
});

export async function getReferees(req: Request, res: Response, next: NextFunction) {
  try {
    const referees = await prisma.referee.findMany({
      include: {
        user: { select: { name: true, email: true } },
        _count: { select: { matches: true } }
      },
      orderBy: { user: { name: 'asc' } }
    });
    res.status(200).json({ success: true, data: referees });
  } catch (err) {
    next(err);
  }
}

export async function getRefereeById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const referee = await prisma.referee.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true } },
        matches: {
          include: {
            team1: { select: { name: true } },
            team2: { select: { name: true } },
            stadium: { select: { name: true } }
          }
        }
      }
    });

    if (!referee) {
      return res.status(404).json({ success: false, message: 'Referee profile not found' });
    }

    res.status(200).json({ success: true, data: referee });
  } catch (err) {
    next(err);
  }
}

export async function updateRefereeProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const body = updateProfileSchema.parse(req.body);

    const referee = await prisma.referee.findUnique({ where: { id } });
    if (!referee) {
      return res.status(404).json({ success: false, message: 'Referee not found' });
    }

    const isOwner = req.user?.id === referee.userId;
    if (!isOwner && req.user?.role !== Role.SUPER_ADMIN) {
      return res.status(403).json({ success: false, message: 'Forbidden. You cannot edit this profile.' });
    }

    const updated = await prisma.referee.update({
      where: { id },
      data: {
        licenseLevel: body.licenseLevel,
      }
    });

    res.status(200).json({ success: true, message: 'Profile updated successfully', data: updated });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: err.errors });
    }
    next(err);
  }
}
