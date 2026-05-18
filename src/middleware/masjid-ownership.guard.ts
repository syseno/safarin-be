import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import prisma from '../config/database';
import { sendError } from '../utils/response';

/**
 * Middleware to ensure a MASJID_ADMIN can only access their own masjid.
 * Expects `masjidId` in req.params.
 * Must be used AFTER authenticate middleware.
 * SUPER_ADMIN bypasses this check.
 */
export const requireMasjidOwnership = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    sendError(res, 'Authentication required.', 401);
    return;
  }

  // SUPER_ADMIN can access any masjid
  if (req.user.role === Role.SUPER_ADMIN) {
    next();
    return;
  }

  const masjidId = req.params.masjidId as string;

  if (!masjidId) {
    sendError(res, 'Masjid ID is required.', 400);
    return;
  }

  // Check if the user is the admin of this masjid
  const masjid = await prisma.masjid.findUnique({
    where: { id: masjidId },
    select: { adminId: true },
  });

  if (!masjid) {
    sendError(res, 'Masjid not found. Session invalid.', 401);
    return;
  }

  if (masjid.adminId !== req.user.id) {
    sendError(res, 'Forbidden: You can only access your own masjid.', 403);
    return;
  }

  // Attach masjidId to user for convenience
  req.user.masjidId = masjidId;
  next();
};
