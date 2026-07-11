import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import { Role } from '@prisma/client';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: Role;
  };
}

export function authenticateJWT(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authorization token missing or malformed' });
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyAccessToken(token);

  if (!payload) {
    return res.status(401).json({ success: false, message: 'Invalid or expired access token' });
  }

  req.user = {
    id: payload.userId,
    email: payload.email,
    role: payload.role as Role,
  };

  next();
}

export function authorizeRoles(...allowedRoles: Role[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized. Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Role '${req.user.role}' is not allowed to access this resource.`,
      });
    }

    next();
  };
}
