import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt';
import { sendError } from '../utils/response';
import { prisma } from '../database/prisma';

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function authenticateJwt(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'Authentication required. No token provided.', 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    return next();
  } catch (error) {
    return sendError(res, 'Invalid or expired access token', 401);
  }
}

export function requireRole(...allowedRoles: Array<'CUSTOMER' | 'SALON_OWNER' | 'ADMIN'>) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(
        res,
        `Access denied. Requires one of [${allowedRoles.join(', ')}] role.`,
        403
      );
    }

    return next();
  };
}

/**
 * Ensures that the authenticated salon owner owns the salon with id = req.params.id (or salonId)
 */
export async function requireSalonOwner(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return sendError(res, 'Authentication required', 401);
  }

  if (req.user.role === 'ADMIN') {
    return next();
  }

  if (req.user.role !== 'SALON_OWNER') {
    return sendError(res, 'Forbidden: Salon owner access required', 403);
  }

  const salonId = req.params.salonId || req.params.id || req.body.salonId;
  if (!salonId) {
    return sendError(res, 'Salon ID is required', 400);
  }

  try {
    const salon = await prisma.salon.findUnique({
      where: { id: salonId },
      select: { ownerId: true },
    });

    if (!salon) {
      return sendError(res, 'Salon not found', 404);
    }

    if (salon.ownerId !== req.user.userId) {
      return sendError(res, 'Unauthorized: You do not own this salon', 403);
    }

    return next();
  } catch (err) {
    return sendError(res, 'Error validating salon ownership', 500);
  }
}
