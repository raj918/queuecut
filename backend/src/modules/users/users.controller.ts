import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../database/prisma';
import { sendSuccess, sendError } from '../../utils/response';

export class UsersController {
  static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return sendError(res, 'Unauthenticated', 401);

      const { name, email, avatarUrl } = req.body;

      const user = await prisma.user.update({
        where: { id: req.user.userId },
        data: {
          ...(name ? { name } : {}),
          ...(email !== undefined ? { email } : {}),
          ...(avatarUrl !== undefined ? { avatarUrl } : {}),
        },
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          role: true,
          avatarUrl: true,
          createdAt: true,
        },
      });

      return sendSuccess(res, user, 'Profile updated successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to update profile', 400);
    }
  }

  static async getFavorites(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return sendError(res, 'Unauthenticated', 401);

      const favorites = await prisma.favorite.findMany({
        where: { userId: req.user.userId },
        include: {
          salon: {
            select: {
              id: true,
              name: true,
              locality: true,
              address: true,
              coverImage: true,
              averageRating: true,
              reviewCount: true,
              isOpen: true,
            },
          },
        },
      });

      return sendSuccess(res, favorites.map((f) => f.salon), 'Favorites retrieved');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to get favorites', 400);
    }
  }

  static async toggleFavorite(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return sendError(res, 'Unauthenticated', 401);
      const { salonId } = req.body;

      const existing = await prisma.favorite.findUnique({
        where: {
          userId_salonId: {
            userId: req.user.userId,
            salonId,
          },
        },
      });

      if (existing) {
        await prisma.favorite.delete({
          where: { id: existing.id },
        });
        return sendSuccess(res, { isFavorite: false }, 'Removed from favorites');
      } else {
        await prisma.favorite.create({
          data: {
            userId: req.user.userId,
            salonId,
          },
        });
        return sendSuccess(res, { isFavorite: true }, 'Added to favorites');
      }
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to toggle favorite', 400);
    }
  }
}
