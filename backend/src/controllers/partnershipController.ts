import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/db.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { Role } from '@prisma/client';

const vendorSchema = z.object({
  userId: z.string(),
  businessName: z.string().min(2),
  stallNumber: z.string().optional(),
});

const sponsorSchema = z.object({
  userId: z.string(),
  companyName: z.string().min(2),
  logoUrl: z.string().url().optional(),
});

export async function getVendors(req: Request, res: Response, next: NextFunction) {
  try {
    const vendors = await prisma.vendor.findMany({
      include: {
        user: { select: { name: true, email: true } }
      },
      orderBy: { stallNumber: 'asc' }
    });
    res.status(200).json({ success: true, data: vendors });
  } catch (err) {
    next(err);
  }
}

export async function getSponsors(req: Request, res: Response, next: NextFunction) {
  try {
    const sponsors = await prisma.sponsor.findMany({
      include: {
        user: { select: { name: true, email: true } }
      },
      orderBy: { companyName: 'asc' }
    });
    res.status(200).json({ success: true, data: sponsors });
  } catch (err) {
    next(err);
  }
}

export async function createVendorLease(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const body = vendorSchema.parse(req.body);

    const allowed = req.user?.role === Role.SUPER_ADMIN || req.user?.role === Role.STADIUM_MANAGER;
    if (!allowed) {
      return res.status(403).json({ success: false, message: 'Forbidden. Only stadium managers or admins can manage vendor leases.' });
    }

    const lease = await prisma.vendor.create({
      data: {
        userId: body.userId,
        businessName: body.businessName,
        stallNumber: body.stallNumber || null,
      }
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user?.id || 'SYSTEM',
        action: 'VENDOR_LEASE_CREATED',
        ipAddress: req.ip,
        device: req.headers['user-agent'],
        details: `Created vendor lease for ${body.businessName} at Stall ${body.stallNumber}`,
      },
    });

    res.status(201).json({ success: true, message: 'Vendor lease created successfully', data: lease });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: err.errors });
    }
    next(err);
  }
}

export async function createSponsorship(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const body = sponsorSchema.parse(req.body);

    const allowed = req.user?.role === Role.SUPER_ADMIN || req.user?.role === Role.TOURNAMENT_ORGANIZER;
    if (!allowed) {
      return res.status(403).json({ success: false, message: 'Forbidden. Only tournament organizers or admins can configure sponsorships.' });
    }

    const sponsor = await prisma.sponsor.create({
      data: {
        userId: body.userId,
        companyName: body.companyName,
        logoUrl: body.logoUrl || null,
      }
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user?.id || 'SYSTEM',
        action: 'SPONSORSHIP_CREATED',
        ipAddress: req.ip,
        device: req.headers['user-agent'],
        details: `Created sponsorship for ${body.companyName}`,
      },
    });

    res.status(201).json({ success: true, message: 'Sponsorship configured successfully', data: sponsor });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: err.errors });
    }
    next(err);
  }
}
