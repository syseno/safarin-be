import { Role } from '@prisma/client';

// Extend Express Request to include user info from JWT
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: Role;
        masjidId?: string;
      };
    }
  }
}

export interface JwtPayload {
  id: string;
  email: string;
  role: Role;
  masjidId?: string;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
}
