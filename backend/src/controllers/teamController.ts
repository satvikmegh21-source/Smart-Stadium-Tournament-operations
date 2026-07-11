import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/db.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

const createTeamSchema = z.object({
  name: z.string().min(2),
  logoUrl: z.string().url().optional().or(z.literal('')),
  primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
  secondaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
});

const assignCoachSchema = z.object({
  teamId: z.string(),
  coachId: z.string(),
});

const assignPlayerSchema = z.object({
  teamId: z.string(),
  playerId: z.string(),
});

export async function getTeams(req: Request, res: Response, next: NextFunction) {
  try {
    const teams = await prisma.team.findMany({
      include: {
        coach: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        },
        _count: {
          select: { players: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.status(200).json({
      success: true,
      data: teams,
    });
  } catch (err) {
    next(err);
  }
}

export async function getTeamById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        coach: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        },
        players: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        }
      }
    });

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    res.status(200).json({
      success: true,
      data: team,
    });
  } catch (err) {
    next(err);
  }
}

export async function createTeam(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const body = createTeamSchema.parse(req.body);

    const existing = await prisma.team.findUnique({
      where: { name: body.name },
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'A team with this name already exists' });
    }

    const team = await prisma.team.create({
      data: {
        name: body.name,
        logoUrl: body.logoUrl || null,
        primaryColor: body.primaryColor || '#6366f1',
        secondaryColor: body.secondaryColor || '#10b981',
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user?.id || 'SYSTEM',
        action: 'TEAM_CREATED',
        ipAddress: req.ip,
        device: req.headers['user-agent'],
        details: `Created team ${team.name} (${team.id})`,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Team created successfully',
      data: team,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: err.errors });
    }
    next(err);
  }
}

export async function updateTeam(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const body = createTeamSchema.partial().parse(req.body);

    const team = await prisma.team.findUnique({ where: { id } });
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    const updated = await prisma.team.update({
      where: { id },
      data: {
        name: body.name,
        logoUrl: body.logoUrl === '' ? null : body.logoUrl,
        primaryColor: body.primaryColor,
        secondaryColor: body.secondaryColor,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user?.id || 'SYSTEM',
        action: 'TEAM_UPDATED',
        ipAddress: req.ip,
        device: req.headers['user-agent'],
        details: `Updated team details for ${updated.name}`,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Team updated successfully',
      data: updated,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: err.errors });
    }
    next(err);
  }
}

export async function deleteTeam(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const team = await prisma.team.findUnique({ where: { id } });
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    await prisma.team.delete({ where: { id } });

    await prisma.activityLog.create({
      data: {
        userId: req.user?.id || 'SYSTEM',
        action: 'TEAM_DELETED',
        ipAddress: req.ip,
        device: req.headers['user-agent'],
        details: `Deleted team ${team.name} (${id})`,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Team deleted successfully',
    });
  } catch (err) {
    next(err);
  }
}

export async function assignCoach(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const body = assignCoachSchema.parse(req.body);

    const [team, coach] = await Promise.all([
      prisma.team.findUnique({ where: { id: body.teamId } }),
      prisma.coach.findUnique({ where: { id: body.coachId }, include: { team: true } })
    ]);

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }
    if (!coach) {
      return res.status(404).json({ success: false, message: 'Coach not found' });
    }

    // If coach is already assigned to another team, unassign them first
    if (coach.team) {
      await prisma.team.update({
        where: { id: coach.team.id },
        data: { coachId: null }
      });
    }

    const updatedTeam = await prisma.team.update({
      where: { id: body.teamId },
      data: { coachId: body.coachId },
      include: {
        coach: {
          include: {
            user: { select: { name: true } }
          }
        }
      }
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user?.id || 'SYSTEM',
        action: 'TEAM_COACH_ASSIGNED',
        ipAddress: req.ip,
        device: req.headers['user-agent'],
        details: `Assigned coach ${updatedTeam.coach?.user.name} to team ${updatedTeam.name}`,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Coach assigned successfully',
      data: updatedTeam,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: err.errors });
    }
    next(err);
  }
}

export async function assignPlayer(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const body = assignPlayerSchema.parse(req.body);

    const [team, player] = await Promise.all([
      prisma.team.findUnique({ where: { id: body.teamId } }),
      prisma.player.findUnique({ where: { id: body.playerId } })
    ]);

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }
    if (!player) {
      return res.status(404).json({ success: false, message: 'Player not found' });
    }

    const updatedPlayer = await prisma.player.update({
      where: { id: body.playerId },
      data: { teamId: body.teamId },
      include: {
        user: { select: { name: true } }
      }
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user?.id || 'SYSTEM',
        action: 'TEAM_PLAYER_ASSIGNED',
        ipAddress: req.ip,
        device: req.headers['user-agent'],
        details: `Assigned player ${updatedPlayer.user.name} to team ${team.name}`,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Player assigned to team successfully',
      data: updatedPlayer,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: err.errors });
    }
    next(err);
  }
}

export async function removePlayer(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { playerId } = req.body;
    if (!playerId) {
      return res.status(400).json({ success: false, message: 'Player ID is required' });
    }

    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: { team: true, user: { select: { name: true } } }
    });

    if (!player) {
      return res.status(404).json({ success: false, message: 'Player not found' });
    }

    await prisma.player.update({
      where: { id: playerId },
      data: { teamId: null }
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user?.id || 'SYSTEM',
        action: 'TEAM_PLAYER_REMOVED',
        ipAddress: req.ip,
        device: req.headers['user-agent'],
        details: `Removed player ${player.user.name} from team ${player.team?.name || 'N/A'}`,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Player removed from team successfully',
    });
  } catch (err) {
    next(err);
  }
}
