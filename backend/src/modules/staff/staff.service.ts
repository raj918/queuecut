import { prisma } from '../../database/prisma';

export class StaffService {
  static async getStaffBySalon(salonId: string) {
    return prisma.staff.findMany({
      where: { salonId, isActive: true },
      include: {
        staffServices: {
          include: {
            service: {
              select: { id: true, name: true, price: true, durationMinutes: true },
            },
          },
        },
        breaks: {
          where: {
            endTime: null,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  static async createStaff(data: {
    salonId: string;
    name: string;
    role: string;
    avatarUrl?: string | null;
    phone?: string | null;
    serviceIds?: string[];
  }) {
    const { serviceIds, ...staffData } = data;

    const staff = await prisma.staff.create({
      data: {
        ...staffData,
        ...(serviceIds && serviceIds.length > 0
          ? {
              staffServices: {
                create: serviceIds.map((serviceId) => ({ serviceId })),
              },
            }
          : {}),
      },
      include: {
        staffServices: {
          include: { service: true },
        },
      },
    });

    return staff;
  }

  static async updateStaff(id: string, data: any) {
    const { serviceIds, ...rest } = data;

    const updated = await prisma.$transaction(async (tx) => {
      if (serviceIds) {
        // Remove existing associations
        await tx.staffService.deleteMany({ where: { staffId: id } });
        // Re-add selected services
        if (serviceIds.length > 0) {
          await tx.staffService.createMany({
            data: serviceIds.map((sId: string) => ({ staffId: id, serviceId: sId })),
          });
        }
      }

      return tx.staff.update({
        where: { id },
        data: rest,
        include: {
          staffServices: { include: { service: true } },
        },
      });
    });

    return updated;
  }

  static async startBreak(staffId: string, durationMinutes: number, reason: string) {
    const endTime = new Date(Date.now() + durationMinutes * 60000);

    const [staffBreak] = await prisma.$transaction([
      prisma.staffBreak.create({
        data: {
          staffId,
          startTime: new Date(),
          endTime,
          reason,
        },
      }),
      prisma.staff.update({
        where: { id: staffId },
        data: { isAvailable: false },
      }),
    ]);

    return staffBreak;
  }

  static async endBreak(staffId: string) {
    await prisma.$transaction([
      prisma.staffBreak.updateMany({
        where: { staffId, endTime: null },
        data: { endTime: new Date() },
      }),
      prisma.staff.update({
        where: { id: staffId },
        data: { isAvailable: true },
      }),
    ]);
  }
}
