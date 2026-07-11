import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/db.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { Role } from '@prisma/client';

// Active SSE client connections
let clients: Response[] = [];

const notificationSchema = z.object({
  title: z.string().min(2),
  message: z.string().min(4),
  userId: z.string().optional(), // If targeting a specific user, otherwise broadcast
});

export function streamNotifications(req: Request, res: Response, next: NextFunction) {
  // Set headers for Server-Sent Events (SSE)
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Content-Encoding': 'none',
  });

  // Send an initial message to establish connection
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', message: 'SSE Stream Active' })}\n\n`);

  // Add client response object to listener queue
  clients.push(res);
  console.log(`[SSE Stream] Client connected. Active streams: ${clients.length}`);

  // Send keep-alive heartbeats every 20 seconds to prevent gateway timeouts
  const heartbeat = setInterval(() => {
    res.write(':\n\n');
  }, 20000);

  req.on('close', () => {
    clearInterval(heartbeat);
    clients = clients.filter(c => c !== res);
    console.log(`[SSE Stream] Client disconnected. Active streams: ${clients.length}`);
  });
}

// Broadcast helper
export function broadcastNotification(data: any) {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  clients.forEach(client => {
    try {
      client.write(payload);
    } catch (err) {
      console.error('[SSE Stream] Failed to write to client response stream:', err);
    }
  });
}

export async function createNotification(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const body = notificationSchema.parse(req.body);

    // Auth check: Admin, Organizer, or Stadium Manager
    const allowed = ([Role.SUPER_ADMIN, Role.STADIUM_MANAGER, Role.TOURNAMENT_ORGANIZER] as Role[]).includes(req.user?.role as Role);
    if (!allowed) {
      return res.status(403).json({ success: false, message: 'Forbidden. Only administrators or operators can broadcast notifications.' });
    }

    // If targeted at one user, otherwise create for all
    let result;
    if (body.userId) {
      result = await prisma.notification.create({
        data: {
          userId: body.userId,
          title: body.title,
          message: body.message,
        }
      });
      
      // Broadcast specific target notification
      broadcastNotification({
        type: 'NOTIFICATION_RECEIVED',
        data: result,
      });
    } else {
      // General announcement: create notification records for admin users and broadcast
      const adminUsers = await prisma.user.findMany({
        where: { role: Role.SUPER_ADMIN },
        take: 10,
      });

      // Create one default record for references
      result = await prisma.notification.create({
        data: {
          userId: req.user?.id || adminUsers[0]?.id || 'SYSTEM',
          title: body.title,
          message: body.message,
        }
      });

      broadcastNotification({
        type: 'BROADCAST_RECEIVED',
        data: {
          id: result.id,
          title: body.title,
          message: body.message,
          createdAt: result.createdAt,
        },
      });
    }

    res.status(201).json({
      success: true,
      message: 'Notification dispatched successfully',
      data: result,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: err.errors });
    }
    next(err);
  }
}
