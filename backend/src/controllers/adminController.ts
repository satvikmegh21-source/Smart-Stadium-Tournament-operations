import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import prisma from '../config/db.js';
import { z } from 'zod';
import { Role } from '@prisma/client';

const updateRoleSchema = z.object({
  userId: z.string(),
  role: z.nativeEnum(Role),
});

export async function getUsers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const search = (req.query.search as string) || '';
    const roleFilter = req.query.role as Role;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (roleFilter) {
      where.role = roleFilter;
    }

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isVerified: true,
          createdAt: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function updateUserRole(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const body = updateRoleSchema.parse(req.body);

    const targetUser = await prisma.user.findUnique({
      where: { id: body.userId },
    });

    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Do not allow self demotion
    if (targetUser.id === req.user?.id) {
      return res.status(400).json({ success: false, message: 'Super Admins cannot change their own role' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: body.userId },
      data: { role: body.role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    // Handle profile creation/deletion if changing to team roles, but keep basic for now
    await prisma.activityLog.create({
      data: {
        userId: req.user?.id || 'SYSTEM',
        action: 'USER_ROLE_UPDATED',
        ipAddress: req.ip,
        device: req.headers['user-agent'],
        details: `Updated role of user ${targetUser.email} from ${targetUser.role} to ${body.role}`,
      },
    });

    res.status(200).json({
      success: true,
      message: `User role updated successfully to ${body.role}`,
      data: updatedUser,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: err.errors });
    }
    next(err);
  }
}

export async function getActivityLogs(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const action = req.query.action as string;

    const where: any = {};
    if (action) {
      where.action = action;
    }

    const [logs, totalCount] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        include: {
          user: {
            select: {
              name: true,
              email: true,
              role: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
      }),
      prisma.activityLog.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        logs,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getSystemMetrics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const [totalUsers, totalSessions, totalLogs, usersByRole] = await Promise.all([
      prisma.user.count(),
      prisma.session.count({ where: { isValid: true } }),
      prisma.activityLog.count(),
      prisma.user.groupBy({
        by: ['role'],
        _count: {
          role: true,
        },
      }),
    ]);

    // Map role distributions
    const roleDistribution = usersByRole.reduce((acc: any, curr) => {
      acc[curr.role] = curr._count.role;
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: {
        metrics: {
          totalUsers,
          activeSessions: totalSessions,
          totalAuditLogs: totalLogs,
          roleDistribution,
        },
        systemStatus: 'OPERATIONAL',
        timestamp: new Date(),
      },
    });
  } catch (err) {
    next(err);
  }
}
