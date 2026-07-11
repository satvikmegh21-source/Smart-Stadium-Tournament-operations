import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/db.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { Role } from '@prisma/client';

const updateProfileSchema = z.object({
  licenseLevel: z.string().optional(),
});

const planSessionSchema = z.object({
  date: z.string().datetime(),
  title: z.string().min(2),
  description: z.string().optional(),
  durationMinutes: z.number().int().positive(),
});

const logAttendanceSchema = z.object({
  sessionId: z.string(),
  attendanceMap: z.record(z.string(), z.boolean()), // playerId -> present (true/false)
});

const addPerformanceSchema = z.object({
  playerId: z.string(),
  rating: z.number().min(1).max(10),
  feedback: z.string().min(2),
});

export async function getCoaches(req: Request, res: Response, next: NextFunction) {
  try {
    const coaches = await prisma.coach.findMany({
      include: {
        user: { select: { name: true, email: true } },
        team: { select: { name: true } }
      },
      orderBy: { user: { name: 'asc' } }
    });
    res.status(200).json({ success: true, data: coaches });
  } catch (err) {
    next(err);
  }
}

export async function getCoachById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const coach = await prisma.coach.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true } },
        team: { select: { name: true } }
      }
    });

    if (!coach) {
      return res.status(404).json({ success: false, message: 'Coach profile not found' });
    }

    res.status(200).json({ success: true, data: coach });
  } catch (err) {
    next(err);
  }
}

export async function updateCoachProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const body = updateProfileSchema.parse(req.body);

    const coach = await prisma.coach.findUnique({ where: { id } });
    if (!coach) {
      return res.status(404).json({ success: false, message: 'Coach not found' });
    }

    const isOwner = req.user?.id === coach.userId;
    if (!isOwner && req.user?.role !== Role.SUPER_ADMIN) {
      return res.status(403).json({ success: false, message: 'Forbidden. You cannot edit this profile.' });
    }

    const updated = await prisma.coach.update({
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

export async function planTrainingSession(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params; // coachId
    const body = planSessionSchema.parse(req.body);

    const coach = await prisma.coach.findUnique({ where: { id } });
    if (!coach) {
      return res.status(404).json({ success: false, message: 'Coach not found' });
    }

    // Auth check
    if (coach.userId !== req.user?.id && req.user?.role !== Role.SUPER_ADMIN) {
      return res.status(403).json({ success: false, message: 'Forbidden. Only the assigned coach can plan training.' });
    }

    const sessions = coach.trainingSessions ? (coach.trainingSessions as any[]) : [];
    
    const newSession = {
      id: Math.random().toString(36).substring(2, 9),
      date: new Date(body.date),
      title: body.title,
      description: body.description || '',
      durationMinutes: body.durationMinutes,
      attendance: {}, // empty attendance initially
    };

    const updatedSessions = [...sessions, newSession];

    const updatedCoach = await prisma.coach.update({
      where: { id },
      data: {
        trainingSessions: updatedSessions
      }
    });

    res.status(200).json({
      success: true,
      message: 'Training session planned successfully',
      data: updatedCoach.trainingSessions,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: err.errors });
    }
    next(err);
  }
}

export async function logAttendance(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params; // coachId
    const body = logAttendanceSchema.parse(req.body);

    const coach = await prisma.coach.findUnique({ where: { id } });
    if (!coach) {
      return res.status(404).json({ success: false, message: 'Coach not found' });
    }

    if (coach.userId !== req.user?.id && req.user?.role !== Role.SUPER_ADMIN) {
      return res.status(403).json({ success: false, message: 'Forbidden. Only the assigned coach can log attendance.' });
    }

    const sessions = coach.trainingSessions ? (coach.trainingSessions as any[]) : [];
    const sessionIndex = sessions.findIndex((s: any) => s.id === body.sessionId);

    if (sessionIndex === -1) {
      return res.status(404).json({ success: false, message: 'Training session not found' });
    }

    // Update session attendance
    sessions[sessionIndex].attendance = body.attendanceMap;

    await prisma.coach.update({
      where: { id },
      data: {
        trainingSessions: sessions
      }
    });

    res.status(200).json({
      success: true,
      message: 'Training attendance logged successfully',
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: err.errors });
    }
    next(err);
  }
}

export async function addPerformanceReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params; // coachId
    const body = addPerformanceSchema.parse(req.body);

    const [coach, player] = await Promise.all([
      prisma.coach.findUnique({ where: { id } }),
      prisma.player.findUnique({ where: { id: body.playerId }, include: { user: { select: { name: true } } } })
    ]);

    if (!coach) {
      return res.status(404).json({ success: false, message: 'Coach not found' });
    }
    if (!player) {
      return res.status(404).json({ success: false, message: 'Player not found' });
    }

    if (coach.userId !== req.user?.id && req.user?.role !== Role.SUPER_ADMIN) {
      return res.status(403).json({ success: false, message: 'Forbidden. Only the assigned coach can submit reports.' });
    }

    const logs = coach.performanceLogs ? (coach.performanceLogs as any[]) : [];
    
    const newReport = {
      id: Math.random().toString(36).substring(2, 9),
      playerId: body.playerId,
      playerName: player.user.name,
      rating: body.rating,
      feedback: body.feedback,
      date: new Date(),
    };

    const updatedLogs = [...logs, newReport];

    await prisma.coach.update({
      where: { id },
      data: {
        performanceLogs: updatedLogs
      }
    });

    res.status(200).json({
      success: true,
      message: 'Player performance report submitted successfully',
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: err.errors });
    }
    next(err);
  }
}
