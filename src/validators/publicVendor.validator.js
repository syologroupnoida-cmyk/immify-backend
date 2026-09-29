import { z } from 'zod';

const publicVendorFilters = {
  search: z.string().trim().min(1).max(100).optional(),
  city: z.string().trim().min(1).max(100).optional(),
  state: z.string().trim().min(1).max(100).optional(),
  country: z.string().trim().min(1).max(100).optional(),
  categoryId: z.string().trim().min(1).max(100).optional(),
  serviceId: z.string().trim().min(1).max(100).optional(),
};

export const listPublicVendorsQuerySchema = z.object({
  ...publicVendorFilters,
  take: z.coerce.number().int().min(1).max(100).default(20),
  skip: z.coerce.number().int().min(0).default(0),
}).strict();

export const publicVendorDetailQuerySchema = z.object(publicVendorFilters).strict();
