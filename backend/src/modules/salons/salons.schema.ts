import { z } from 'zod';

export const NearbySalonsQuerySchema = z.object({
  query: z.object({
    latitude: z.string().transform((val) => parseFloat(val)),
    longitude: z.string().transform((val) => parseFloat(val)),
    radiusMeters: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 500)),
    category: z.string().optional(),
    search: z.string().optional(),
  }),
});

export const CreateSalonsSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Salon name is required'),
    description: z.string().optional(),
    address: z.string().min(5, 'Full street address is required'),
    locality: z.string().min(2, 'Locality/Area is required (e.g. Civil Lines)'),
    city: z.string().default('Kanpur'),
    state: z.string().default('Uttar Pradesh'),
    postalCode: z.string().regex(/^\d{6}$/, 'Enter valid 6-digit PIN code'),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    phone: z.string().regex(/^[6-9]\d{9}$/, 'Valid 10-digit mobile number'),
    email: z.string().email().optional().nullable(),
    coverImage: z.string().url().optional().nullable(),
    logoImage: z.string().url().optional().nullable(),
    openingTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).default('09:00'),
    closingTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).default('21:00'),
    weeklyClosingDays: z.string().default('Tuesday'),
    categories: z.string().default('Haircut,Beard,Facial,Grooming'),
  }),
});

export const UpdateSalonSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    address: z.string().min(5).optional(),
    locality: z.string().optional(),
    phone: z.string().optional(),
    coverImage: z.string().url().optional().nullable(),
    logoImage: z.string().url().optional().nullable(),
    openingTime: z.string().optional(),
    closingTime: z.string().optional(),
    weeklyClosingDays: z.string().optional(),
    isOpen: z.boolean().optional(),
    isPaused: z.boolean().optional(),
    pauseReason: z.string().optional().nullable(),
  }),
});
