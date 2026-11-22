import { z } from 'zod';

export const CreateStaffSchema = z.object({
  body: z.object({
    salonId: z.string().uuid(),
    name: z.string().min(2, 'Staff name is required'),
    role: z.string().default('Senior Stylist'),
    avatarUrl: z.string().url().optional().nullable(),
    phone: z.string().regex(/^[6-9]\d{9}$/).optional().nullable(),
    serviceIds: z.array(z.string().uuid()).optional(),
  }),
});

export const UpdateStaffSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    role: z.string().optional(),
    avatarUrl: z.string().url().optional().nullable(),
    phone: z.string().optional().nullable(),
    isAvailable: z.boolean().optional(),
    isActive: z.boolean().optional(),
    serviceIds: z.array(z.string().uuid()).optional(),
  }),
});

export const StaffBreakSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    durationMinutes: z.number().int().min(5).max(120).default(30),
    reason: z.string().default('Lunch / Tea Break'),
  }),
});
