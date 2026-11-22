import { z } from 'zod';

export const CreateServiceSchema = z.object({
  body: z.object({
    salonId: z.string().uuid(),
    name: z.string().min(2, 'Service name is required'),
    description: z.string().optional(),
    category: z.string().default('Haircut'),
    price: z.number().positive('Price must be greater than 0'),
    durationMinutes: z.number().int().min(5, 'Duration must be at least 5 minutes'),
    qualifiedStaffIds: z.array(z.string().uuid()).optional(),
  }),
});

export const UpdateServiceSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    category: z.string().optional(),
    price: z.number().positive().optional(),
    durationMinutes: z.number().int().min(5).optional(),
    isActive: z.boolean().optional(),
  }),
});
