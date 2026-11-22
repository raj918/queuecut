import { prisma } from '../../database/prisma';

export class ServicesService {
  static async getServicesBySalon(salonId: string) {
    return prisma.service.findMany({
      where: { salonId, isActive: true },
      include: {
        staffServices: {
          include: {
            staff: {
              select: { id: true, name: true, role: true, isAvailable: true },
            },
          },
        },
      },
      orderBy: { category: 'asc' },
    });
  }

  static async createService(data: {
    salonId: string;
    name: string;
    description?: string;
    category: string;
    price: number;
    durationMinutes: number;
    qualifiedStaffIds?: string[];
  }) {
    const { qualifiedStaffIds, ...serviceData } = data;

    const service = await prisma.service.create({
      data: {
        ...serviceData,
        ...(qualifiedStaffIds && qualifiedStaffIds.length > 0
          ? {
              staffServices: {
                create: qualifiedStaffIds.map((staffId) => ({ staffId })),
              },
            }
          : {}),
      },
      include: {
        staffServices: true,
      },
    });

    return service;
  }

  static async updateService(id: string, data: any) {
    return prisma.service.update({
      where: { id },
      data,
    });
  }

  static async deleteService(id: string) {
    // Soft disable to preserve historical references
    return prisma.service.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
