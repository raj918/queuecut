import { prisma } from '../../database/prisma';
import { calculateDistanceMeters, formatDistance, getBoundingBox } from '../../utils/distance';

export class SalonsService {
  /**
   * Discover nearby salons with accurate GPS distance filtering
   */
  static async findNearbySalons(params: {
    latitude: number;
    longitude: number;
    radiusMeters?: number;
    category?: string;
    search?: string;
  }) {
    const radius = params.radiusMeters || 25000;
    const { minLat, maxLat, minLon, maxLon } = getBoundingBox(
      params.latitude,
      params.longitude,
      radius
    );

    const todayStr = new Date().toISOString().split('T')[0];

    // Filter using bounding box first
    const candidates = await prisma.salon.findMany({
      where: {
        latitude: { gte: minLat, lte: maxLat },
        longitude: { gte: minLon, lte: maxLon },
        ...(params.category
          ? {
              categories: {
                contains: params.category,
                mode: 'insensitive',
              },
            }
          : {}),
        ...(params.search
          ? {
              OR: [
                { name: { contains: params.search, mode: 'insensitive' } },
                { locality: { contains: params.search, mode: 'insensitive' } },
                { address: { contains: params.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        services: {
          where: { isActive: true },
          select: { price: true },
        },
        staff: {
          where: { isActive: true, isAvailable: true },
          select: { id: true },
        },
        bookings: {
          where: {
            scheduledDate: todayStr,
            status: { in: ['CONFIRMED', 'CHECKED_IN', 'WAITING', 'CALLED', 'IN_SERVICE'] },
          },
          select: {
            status: true,
            totalDurationMinutes: true,
          },
        },
      },
    });

    // Calculate exact Haversine distance and filter strictly within radius
    const enriched = candidates
      .map((salon) => {
        const distanceMeters = calculateDistanceMeters(
          params.latitude,
          params.longitude,
          salon.latitude,
          salon.longitude
        );

        // Find starting service price (minimum)
        const prices = salon.services.map((s) => s.price);
        const startingPrice = prices.length > 0 ? Math.min(...prices) : 100;

        // Calculate current waiting time
        // Total minutes of waiting queue divided by available staff count (minimum 1)
        const availableStaffCount = salon.staff.length;
        const waitingBookings = salon.bookings.filter((b) =>
          (['CONFIRMED', 'CHECKED_IN', 'WAITING', 'CALLED'] as string[]).includes(b.status)
        );
        const totalWaitingMinutes = waitingBookings.reduce(
          (sum, b) => sum + b.totalDurationMinutes,
          0
        );
        const estimatedWaitMinutes =
          availableStaffCount > 0
            ? Math.round(totalWaitingMinutes / Math.max(1, availableStaffCount))
            : totalWaitingMinutes;

        const currentQueueCount = waitingBookings.length;

        return {
          id: salon.id,
          name: salon.name,
          slug: salon.slug,
          coverImage: salon.coverImage,
          logoImage: salon.logoImage,
          address: salon.address,
          locality: salon.locality,
          city: salon.city,
          latitude: salon.latitude,
          longitude: salon.longitude,
          averageRating: salon.averageRating,
          reviewCount: salon.reviewCount,
          isOpen: salon.isOpen,
          isPaused: salon.isPaused,
          categories: salon.categories.split(','),
          distanceMeters,
          distanceFormatted: formatDistance(distanceMeters),
          startingPrice,
          estimatedWaitMinutes,
          currentQueueCount,
          availableBarbersCount: availableStaffCount,
        };
      })
      .filter((s) => s.distanceMeters <= radius)
      .sort((a, b) => a.distanceMeters - b.distanceMeters);

    return enriched;
  }

  /**
   * Get single salon complete details
   */
  static async getSalonDetails(id: string, userLat?: number, userLon?: number) {
    const todayStr = new Date().toISOString().split('T')[0];

    const salon = await prisma.salon.findUnique({
      where: { id },
      include: {
        services: {
          where: { isActive: true },
          orderBy: { price: 'asc' },
        },
        staff: {
          where: { isActive: true },
          include: {
            staffServices: {
              select: { serviceId: true },
            },
          },
        },
        businessHours: {
          orderBy: { dayOfWeek: 'asc' },
        },
        photos: {
          orderBy: { sortOrder: 'asc' },
        },
        reviews: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            customer: {
              select: { name: true, avatarUrl: true },
            },
          },
        },
        bookings: {
          where: {
            scheduledDate: todayStr,
            status: { in: ['CONFIRMED', 'CHECKED_IN', 'WAITING', 'CALLED', 'IN_SERVICE'] },
          },
          select: {
            id: true,
            status: true,
            totalDurationMinutes: true,
            tokenNumber: true,
          },
        },
      },
    });

    if (!salon) {
      throw new Error('Salon not found');
    }

    let distanceMeters: number | null = null;
    let distanceFormatted: string | null = null;

    if (userLat !== undefined && userLon !== undefined) {
      distanceMeters = calculateDistanceMeters(userLat, userLon, salon.latitude, salon.longitude);
      distanceFormatted = formatDistance(distanceMeters);
    }

    const availableStaffCount = salon.staff.filter((s) => s.isAvailable).length;
    const waitingBookings = salon.bookings.filter((b) =>
      (['CONFIRMED', 'CHECKED_IN', 'WAITING', 'CALLED'] as string[]).includes(b.status)
    );
    const totalWaitingMinutes = waitingBookings.reduce(
      (sum, b) => sum + b.totalDurationMinutes,
      0
    );
    const estimatedWaitMinutes =
      availableStaffCount > 0
        ? Math.round(totalWaitingMinutes / Math.max(1, availableStaffCount))
        : totalWaitingMinutes;

    return {
      ...salon,
      distanceMeters,
      distanceFormatted,
      currentQueueCount: waitingBookings.length,
      estimatedWaitMinutes,
      availableStaffCount,
    };
  }

  static async createSalon(ownerId: string, data: any) {
    const slug = `${data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}`;

    const salon = await prisma.salon.create({
      data: {
        ...data,
        ownerId,
        slug,
      },
    });

    return salon;
  }

  static async updateSalon(id: string, data: any) {
    const updated = await prisma.salon.update({
      where: { id },
      data,
    });
    return updated;
  }
}
