import bcrypt from 'bcryptjs';
import { prisma } from '../../database/prisma';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt';

export class AuthService {
  static async register(data: {
    name: string;
    phone: string;
    email?: string | null;
    password: string;
    role: 'CUSTOMER' | 'SALON_OWNER';
  }) {
    // Check if phone or email already in use
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: data.phone },
          ...(data.email ? [{ email: data.email }] : []),
        ],
      },
    });

    if (existing) {
      if (existing.phone === data.phone) {
        throw new Error('An account with this mobile number already exists');
      }
      throw new Error('An account with this email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        passwordHash,
        role: data.role,
        notificationPref: {
          create: {
            bookingUpdates: true,
            queueAlerts: true,
            soundEnabled: true,
          },
        },
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

    const tokenPayload = {
      userId: user.id,
      role: user.role,
      phone: user.phone,
      email: user.email,
    };

    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    return {
      user,
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  static async login(identifier: string, passwordPlain: string) {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: identifier },
          { email: identifier },
        ],
      },
      include: {
        ownedSalons: {
          select: { id: true, name: true, slug: true, city: true, isOpen: true },
        },
      },
    });

    if (!user) {
      throw new Error('Invalid mobile/email or password');
    }

    if (!user.isActive) {
      throw new Error('Your account has been deactivated. Please contact support.');
    }

    const isMatch = await bcrypt.compare(passwordPlain, user.passwordHash);
    if (!isMatch) {
      throw new Error('Invalid mobile/email or password');
    }

    const tokenPayload = {
      userId: user.id,
      role: user.role,
      phone: user.phone,
      email: user.email,
    };

    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    const { passwordHash: _, ...userSafe } = user;

    return {
      user: userSafe,
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  static async refreshToken(refreshToken: string) {
    const payload = verifyRefreshToken(refreshToken);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true, phone: true, email: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new Error('User not found or deactivated');
    }

    const tokenPayload = {
      userId: user.id,
      role: user.role,
      phone: user.phone,
      email: user.email,
    };

    const newAccessToken = signAccessToken(tokenPayload);
    const newRefreshToken = signRefreshToken(tokenPayload);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  static async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
        ownedSalons: {
          select: {
            id: true,
            name: true,
            slug: true,
            address: true,
            locality: true,
            city: true,
            isOpen: true,
            isPaused: true,
            averageRating: true,
            coverImage: true,
          },
        },
        notificationPref: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }
}
