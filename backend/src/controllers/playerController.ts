import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/db.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { Role } from '@prisma/client';

const updateProfileSchema = z.object({
  position: z.string().optional(),
  jerseyNumber: z.number().int().optional(),
  birthDate: z.string().datetime().optional(),
  availability: z.boolean().optional(),
});

const updateFitnessSchema = z.object({
  fitnessStatus: z.enum(['FIT', 'INJURED', 'RECOVERING']),
  medicalHistory: z.string().optional(),
});

const updateSuspensionSchema = z.object({
  suspensionEnd: z.string().datetime().nullable(),
});

const logTransferSchema = z.object({
  toTeamId: z.string().nullable(),
  transferDate: z.string().datetime(),
  details: z.string().optional(),
});

export async function getPlayers(req: Request, res: Response, next: NextFunction) {
  try {
    const search = (req.query.search as string) || '';
    const position = req.query.position as string;
    const fitnessStatus = req.query.fitnessStatus as string;

    const where: any = {};
    if (search) {
      where.user = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ]
      };
    }
    if (position) {
      where.position = position;
    }
    if (fitnessStatus) {
      where.fitnessStatus = fitnessStatus;
    }

    const players = await prisma.player.findMany({
      where,
      include: {
        user: {
          select: { name: true, email: true, role: true }
        },
        team: {
          select: { id: true, name: true }
        }
      },
      orderBy: { user: { name: 'asc' } }
    });

    res.status(200).json({
      success: true,
      data: players,
    });
  } catch (err) {
    next(err);
  }
}

export async function getPlayerById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const player = await prisma.player.findUnique({
      where: { id },
      include: {
        user: {
          select: { name: true, email: true, isVerified: true }
        },
        team: {
          select: { id: true, name: true, primaryColor: true }
        }
      }
    });

    if (!player) {
      return res.status(404).json({ success: false, message: 'Player profile not found' });
    }

    res.status(200).json({
      success: true,
      data: player,
    });
  } catch (err) {
    next(err);
  }
}

export async function updatePlayerProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const body = updateProfileSchema.parse(req.body);

    const player = await prisma.player.findUnique({ where: { id } });
    if (!player) {
      return res.status(404).json({ success: false, message: 'Player profile not found' });
    }

    // RBAC: Player can update their own profile, Super Admin or Team Manager can update any
    const isOwner = req.user?.id === player.userId;
    const isAdminOrManager = req.user?.role === Role.SUPER_ADMIN || req.user?.role === Role.TEAM_MANAGER;

    if (!isOwner && !isAdminOrManager) {
      return res.status(403).json({ success: false, message: 'Forbidden. You cannot edit this player profile.' });
    }

    const updated = await prisma.player.update({
      where: { id },
      data: {
        position: body.position,
        jerseyNumber: body.jerseyNumber,
        birthDate: body.birthDate ? new Date(body.birthDate) : undefined,
        availability: body.availability,
      },
      include: {
        user: { select: { name: true } }
      }
    });

    res.status(200).json({
      success: true,
      message: 'Player profile updated successfully',
      data: updated,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: err.errors });
    }
    next(err);
  }
}

export async function updatePlayerFitness(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const body = updateFitnessSchema.parse(req.body);

    const player = await prisma.player.findUnique({ where: { id }, include: { user: { select: { name: true } } } });
    if (!player) {
      return res.status(404).json({ success: false, message: 'Player not found' });
    }

    // RBAC: Medical Staff, Coach, Super Admin
    const allowed = ([Role.SUPER_ADMIN, Role.COACH, Role.MEDICAL_STAFF] as Role[]).includes(req.user?.role as Role);
    if (!allowed) {
      return res.status(403).json({ success: false, message: 'Forbidden. Only medical staff, coaches, or admins can update fitness status.' });
    }

    const updated = await prisma.player.update({
      where: { id },
      data: {
        fitnessStatus: body.fitnessStatus,
        medicalHistory: body.medicalHistory ? `${player.medicalHistory || ''}\n[${new Date().toLocaleDateString()}] ${body.medicalHistory}` : undefined,
      }
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user?.id || 'SYSTEM',
        action: 'PLAYER_FITNESS_UPDATED',
        ipAddress: req.ip,
        device: req.headers['user-agent'],
        details: `Updated fitness status of player ${player.user.name} to ${body.fitnessStatus}`,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Player fitness status updated successfully',
      data: updated,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: err.errors });
    }
    next(err);
  }
}

export async function updatePlayerSuspension(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const body = updateSuspensionSchema.parse(req.body);

    const player = await prisma.player.findUnique({ where: { id }, include: { user: { select: { name: true } } } });
    if (!player) {
      return res.status(404).json({ success: false, message: 'Player not found' });
    }

    const updated = await prisma.player.update({
      where: { id },
      data: {
        suspensionEnd: body.suspensionEnd ? new Date(body.suspensionEnd) : null,
      }
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user?.id || 'SYSTEM',
        action: 'PLAYER_SUSPENSION_UPDATED',
        ipAddress: req.ip,
        device: req.headers['user-agent'],
        details: body.suspensionEnd 
          ? `Suspended player ${player.user.name} until ${new Date(body.suspensionEnd).toLocaleDateString()}` 
          : `Lifted suspension for player ${player.user.name}`,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Player suspension status updated successfully',
      data: updated,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: err.errors });
    }
    next(err);
  }
}

export async function logPlayerTransfer(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const body = logTransferSchema.parse(req.body);

    const player = await prisma.player.findUnique({ where: { id }, include: { team: true, user: { select: { name: true } } } });
    if (!player) {
      return res.status(404).json({ success: false, message: 'Player not found' });
    }

    const currentHistory = player.transferHistory ? (player.transferHistory as any[]) : [];
    
    // Unpack team info
    const fromTeamName = player.team?.name || 'Free Agent';
    let toTeamName = 'Free Agent';
    if (body.toTeamId) {
      const toTeam = await prisma.team.findUnique({ where: { id: body.toTeamId } });
      if (!toTeam) {
        return res.status(404).json({ success: false, message: 'Target team not found' });
      }
      toTeamName = toTeam.name;
    }

    const newTransferLog = {
      fromTeamId: player.teamId,
      fromTeamName,
      toTeamId: body.toTeamId,
      toTeamName,
      date: new Date(body.transferDate),
      details: body.details || 'Transferred',
    };

    const updatedHistory = [...currentHistory, newTransferLog];

    const updatedPlayer = await prisma.player.update({
      where: { id },
      data: {
        teamId: body.toTeamId,
        transferHistory: updatedHistory,
      }
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user?.id || 'SYSTEM',
        action: 'PLAYER_TRANSFERRED',
        ipAddress: req.ip,
        device: req.headers['user-agent'],
        details: `Logged transfer for player ${player.user.name} from ${fromTeamName} to ${toTeamName}`,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Player transfer logged successfully',
      data: updatedPlayer,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: err.errors });
    }
    next(err);
  }
}
