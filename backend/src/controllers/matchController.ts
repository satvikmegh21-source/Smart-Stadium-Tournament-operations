import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/db.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { MatchStatus, Role } from '@prisma/client';

const statusSchema = z.object({
  status: z.nativeEnum(MatchStatus),
});

const scoreSchema = z.object({
  score1: z.number().int().nonnegative(),
  score2: z.number().int().nonnegative(),
});

const eventSchema = z.object({
  type: z.enum(['GOAL', 'YELLOW_CARD', 'RED_CARD', 'SUBSTITUTION', 'MILESTONE']),
  minute: z.number().int().min(1).max(120),
  teamId: z.string().nullable(),
  playerName: z.string(),
  details: z.string().optional(),
});

export async function getMatches(req: Request, res: Response, next: NextFunction) {
  try {
    const tournamentId = req.query.tournamentId as string;
    const status = req.query.status as MatchStatus;

    const where: any = {};
    if (tournamentId) where.tournamentId = tournamentId;
    if (status) where.status = status;

    const matches = await prisma.match.findMany({
      where,
      include: {
        team1: { select: { name: true, logoUrl: true } },
        team2: { select: { name: true, logoUrl: true } },
        stadium: { select: { name: true, city: true } },
        referee: { include: { user: { select: { name: true } } } }
      },
      orderBy: { date: 'asc' }
    });

    res.status(200).json({ success: true, data: matches });
  } catch (err) {
    next(err);
  }
}

export async function getMatchById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        team1: { select: { id: true, name: true, logoUrl: true } },
        team2: { select: { id: true, name: true, logoUrl: true } },
        stadium: { select: { name: true, city: true, capacity: true } },
        referee: { include: { user: { select: { name: true } } } }
      }
    });

    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }

    res.status(200).json({ success: true, data: match });
  } catch (err) {
    next(err);
  }
}

export async function updateMatchStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const body = statusSchema.parse(req.body);

    const match = await prisma.match.findUnique({ where: { id } });
    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }

    // RBAC: REFEREE or SUPER_ADMIN
    const allowed = req.user?.role === Role.SUPER_ADMIN || req.user?.role === Role.REFEREE;
    if (!allowed) {
      return res.status(403).json({ success: false, message: 'Forbidden. Only the assigned referee or admin can update match status.' });
    }

    const updated = await prisma.match.update({
      where: { id },
      data: { status: body.status }
    });

    // Auto-update Standings if completed
    if (body.status === MatchStatus.COMPLETED) {
      await autoUpdateStandings(match.tournamentId);
    }

    await prisma.activityLog.create({
      data: {
        userId: req.user?.id || 'SYSTEM',
        action: 'MATCH_STATUS_UPDATED',
        ipAddress: req.ip,
        device: req.headers['user-agent'],
        details: `Updated match ${id} status to ${body.status}`,
      },
    });

    res.status(200).json({ success: true, message: 'Match status updated successfully', data: updated });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: err.errors });
    }
    next(err);
  }
}

export async function updateMatchScore(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const body = scoreSchema.parse(req.body);

    const match = await prisma.match.findUnique({ where: { id } });
    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }

    const allowed = req.user?.role === Role.SUPER_ADMIN || req.user?.role === Role.REFEREE;
    if (!allowed) {
      return res.status(403).json({ success: false, message: 'Forbidden. Only referees or admins can record goals.' });
    }

    const updated = await prisma.match.update({
      where: { id },
      data: {
        score1: body.score1,
        score2: body.score2,
      }
    });

    res.status(200).json({ success: true, message: 'Match scores updated successfully', data: updated });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: err.errors });
    }
    next(err);
  }
}

export async function addMatchEvent(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const body = eventSchema.parse(req.body);

    const match = await prisma.match.findUnique({ where: { id } });
    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }

    const allowed = req.user?.role === Role.SUPER_ADMIN || req.user?.role === Role.REFEREE;
    if (!allowed) {
      return res.status(403).json({ success: false, message: 'Forbidden.' });
    }

    const timeline = match.liveTimelineJson ? (match.liveTimelineJson as any[]) : [];
    
    const newEvent = {
      id: Math.random().toString(36).substring(2, 9),
      type: body.type,
      minute: body.minute,
      teamId: body.teamId,
      playerName: body.playerName,
      details: body.details || '',
      timestamp: new Date(),
    };

    const updatedTimeline = [...timeline, newEvent];

    const updated = await prisma.match.update({
      where: { id },
      data: {
        liveTimelineJson: updatedTimeline
      }
    });

    res.status(200).json({ success: true, message: 'Match event logged successfully', data: updated });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: err.errors });
    }
    next(err);
  }
}

// Standings calculation helper
async function autoUpdateStandings(tournamentId: string) {
  const matches = await prisma.match.findMany({
    where: {
      tournamentId,
      status: MatchStatus.COMPLETED,
    }
  });

  const tableEntries = await prisma.pointsTable.findMany({
    where: { tournamentId }
  });

  const statsMap: Record<string, { played: number, won: number, drawn: number, lost: number, points: number, gf: number, ga: number }> = {};
  tableEntries.forEach(entry => {
    statsMap[entry.teamId] = { played: 0, won: 0, drawn: 0, lost: 0, points: 0, gf: 0, ga: 0 };
  });

  matches.forEach(m => {
    if (!statsMap[m.team1Id] || !statsMap[m.team2Id]) return;

    statsMap[m.team1Id].played += 1;
    statsMap[m.team2Id].played += 1;
    statsMap[m.team1Id].gf += m.score1;
    statsMap[m.team1Id].ga += m.score2;
    statsMap[m.team2Id].gf += m.score2;
    statsMap[m.team2Id].ga += m.score1;

    if (m.score1 > m.score2) {
      statsMap[m.team1Id].won += 1;
      statsMap[m.team1Id].points += 3;
      statsMap[m.team2Id].lost += 1;
    } else if (m.score2 > m.score1) {
      statsMap[m.team2Id].won += 1;
      statsMap[m.team2Id].points += 3;
      statsMap[m.team1Id].lost += 1;
    } else {
      statsMap[m.team1Id].drawn += 1;
      statsMap[m.team1Id].points += 1;
      statsMap[m.team2Id].drawn += 1;
      statsMap[m.team2Id].points += 1;
    }
  });

  const updatePromises = Object.entries(statsMap).map(([teamId, stats]) => {
    return prisma.pointsTable.updateMany({
      where: { tournamentId, teamId },
      data: {
        played: stats.played,
        won: stats.won,
        drawn: stats.drawn,
        lost: stats.lost,
        points: stats.points,
        goalsFor: stats.gf,
        goalsAgainst: stats.ga,
      }
    });
  });

  await Promise.all(updatePromises);
}
