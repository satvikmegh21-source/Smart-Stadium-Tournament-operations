import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/db.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { Role } from '@prisma/client';

const reportSchema = z.object({
  location: z.string().min(2),
  description: z.string().min(5),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  type: z.enum(['SAFETY', 'MEDICAL']),
});

const resolveSchema = z.object({
  status: z.enum(['LOGGED', 'INVESTIGATING', 'RESOLVED']),
  details: z.string().optional(),
});

export async function getIncidents(req: Request, res: Response, next: NextFunction) {
  try {
    const status = req.query.status as string;

    const where: any = {};
    if (status) where.status = status;

    const incidents = await prisma.incidentReport.findMany({
      where,
      include: {
        reportedBy: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ success: true, data: incidents });
  } catch (err) {
    next(err);
  }
}

export async function reportIncident(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const body = reportSchema.parse(req.body);

    const report = await prisma.incidentReport.create({
      data: {
        reporterId: req.user?.id || '',
        location: body.location,
        description: body.description,
        severity: body.priority,
        status: 'LOGGED',
      }
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user?.id || 'SYSTEM',
        action: 'INCIDENT_REPORTED',
        ipAddress: req.ip,
        device: req.headers['user-agent'],
        details: `Incident reported: ${body.type} at ${body.location} (ID: ${report.id})`,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Incident reported successfully. Stadium staff have been notified.',
      data: report,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: err.errors });
    }
    next(err);
  }
}

export async function updateIncidentStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const body = resolveSchema.parse(req.body);

    const incident = await prisma.incidentReport.findUnique({ where: { id } });
    if (!incident) {
      return res.status(404).json({ success: false, message: 'Incident report not found' });
    }

    // RBAC: STADIUM_MANAGER or SUPER_ADMIN
    const allowed = req.user?.role === Role.SUPER_ADMIN || req.user?.role === Role.STADIUM_MANAGER;
    if (!allowed) {
      return res.status(403).json({ success: false, message: 'Forbidden. Only stadium managers or admins can update incident tickets.' });
    }

    const updated = await prisma.incidentReport.update({
      where: { id },
      data: {
        status: body.status,
        actionTaken: body.details || null,
      }
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user?.id || 'SYSTEM',
        action: 'INCIDENT_STATUS_UPDATED',
        ipAddress: req.ip,
        device: req.headers['user-agent'],
        details: `Updated incident ticket ${id} status to ${body.status}`,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Incident ticket updated successfully',
      data: updated,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: err.errors });
    }
    next(err);
  }
}
