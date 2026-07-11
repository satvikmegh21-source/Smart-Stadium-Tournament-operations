import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/db.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { TournamentFormat, MatchStatus } from '@prisma/client';

const createTournamentSchema = z.object({
  name: z.string().min(2),
  format: z.nativeEnum(TournamentFormat),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  prizeDetails: z.string().optional(),
  teamIds: z.array(z.string()).min(2),
});

export async function getTournaments(req: Request, res: Response, next: NextFunction) {
  try {
    const tournaments = await prisma.tournament.findMany({
      include: {
        _count: {
          select: { teams: true, matches: true }
        }
      },
      orderBy: { startDate: 'desc' }
    });

    res.status(200).json({
      success: true,
      data: tournaments,
    });
  } catch (err) {
    next(err);
  }
}

export async function getTournamentById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        teams: {
          select: { id: true, name: true, logoUrl: true }
        },
        matches: {
          include: {
            team1: { select: { name: true } },
            team2: { select: { name: true } },
            stadium: { select: { name: true } },
            referee: { include: { user: { select: { name: true } } } }
          },
          orderBy: { date: 'asc' }
        },
        pointsTables: {
          include: {
            team: { select: { name: true } }
          },
          orderBy: { points: 'desc' }
        }
      }
    });

    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }

    res.status(200).json({
      success: true,
      data: tournament,
    });
  } catch (err) {
    next(err);
  }
}

export async function createTournament(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const body = createTournamentSchema.parse(req.body);

    const existing = await prisma.tournament.findUnique({
      where: { name: body.name },
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A tournament with this name already exists' });
    }

    // Verify all teams exist
    const teamCount = await prisma.team.count({
      where: { id: { in: body.teamIds } }
    });
    if (teamCount !== body.teamIds.length) {
      return res.status(400).json({ success: false, message: 'One or more team IDs are invalid' });
    }

    // 1. Create Tournament
    const tournament = await prisma.tournament.create({
      data: {
        name: body.name,
        format: body.format,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        prizeDetails: body.prizeDetails || null,
        teams: {
          connect: body.teamIds.map(id => ({ id }))
        }
      }
    });

    // 2. Initialize Points Table entries
    const pointsTableData = body.teamIds.map(teamId => ({
      tournamentId: tournament.id,
      teamId,
    }));
    await prisma.pointsTable.createMany({
      data: pointsTableData
    });

    // 3. Auto Schedule Matches
    // Find or create default stadium
    let stadium = await prisma.stadium.findFirst();
    if (!stadium) {
      stadium = await prisma.stadium.create({
        data: {
          name: 'Default Arena Ground A',
          city: 'Metropolis',
          capacity: 50000,
          groundType: 'Grass',
        }
      });
    }

    // Gather referees
    const referees = await prisma.referee.findMany({ take: 5 });

    // Round Robin / Circle Method Algorithm
    const teamList = [...body.teamIds];
    if (teamList.length % 2 !== 0) {
      teamList.push('BYE'); // Represent a bye
    }
    const numTeams = teamList.length;
    const rounds = numTeams - 1;
    const matchesPerRound = numTeams / 2;

    const matchesToCreate = [];
    const baseDate = new Date(body.startDate);

    for (let round = 0; round < rounds; round++) {
      // Offset dates: 1 round every 2 days
      const roundDate = new Date(baseDate.getTime() + round * 2 * 24 * 60 * 60 * 1000);
      
      for (let matchIndex = 0; matchIndex < matchesPerRound; matchIndex++) {
        const home = (round + matchIndex) % (numTeams - 1);
        let away = (numTeams - 1 - matchIndex + round) % (numTeams - 1);

        if (matchIndex === 0) {
          away = numTeams - 1;
        }

        const team1 = teamList[home];
        const team2 = teamList[away];

        // Only schedule if it's not a bye
        if (team1 !== 'BYE' && team2 !== 'BYE') {
          // Assign referee if available
          const refereeId = referees.length > 0 ? referees[matchIndex % referees.length].id : null;

          matchesToCreate.push({
            tournamentId: tournament.id,
            stadiumId: stadium.id,
            team1Id: team1,
            team2Id: team2,
            refereeId,
            date: roundDate,
            status: MatchStatus.SCHEDULED,
          });
        }
      }
    }

    // Batch create matches
    await prisma.match.createMany({
      data: matchesToCreate
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user?.id || 'SYSTEM',
        action: 'TOURNAMENT_CREATED',
        ipAddress: req.ip,
        device: req.headers['user-agent'],
        details: `Created tournament ${tournament.name} with ${body.teamIds.length} teams. Auto-scheduled ${matchesToCreate.length} matches.`,
      },
    });

    res.status(201).json({
      success: true,
      message: `Tournament created and ${matchesToCreate.length} matches scheduled successfully`,
      data: tournament,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: err.errors });
    }
    next(err);
  }
}

export async function recalculatePointsTable(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const matches = await prisma.match.findMany({
      where: {
        tournamentId: id,
        status: MatchStatus.COMPLETED,
      }
    });

    // Reset table values
    const tableEntries = await prisma.pointsTable.findMany({
      where: { tournamentId: id }
    });

    const statsMap: Record<string, { played: number, won: number, drawn: number, lost: number, points: number, gf: number, ga: number }> = {};
    tableEntries.forEach(entry => {
      statsMap[entry.teamId] = { played: 0, won: 0, drawn: 0, lost: 0, points: 0, gf: 0, ga: 0 };
    });

    // Aggregate matches
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

    // Update database
    const updatePromises = Object.entries(statsMap).map(([teamId, stats]) => {
      return prisma.pointsTable.updateMany({
        where: { tournamentId: id, teamId },
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

    res.status(200).json({
      success: true,
      message: 'Points table recalculated successfully',
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteTournament(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const tournament = await prisma.tournament.findUnique({ where: { id } });
    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }

    await prisma.tournament.delete({ where: { id } });

    await prisma.activityLog.create({
      data: {
        userId: req.user?.id || 'SYSTEM',
        action: 'TOURNAMENT_DELETED',
        ipAddress: req.ip,
        device: req.headers['user-agent'],
        details: `Deleted tournament ${tournament.name} (${id})`,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Tournament deleted successfully',
    });
  } catch (err) {
    next(err);
  }
}
