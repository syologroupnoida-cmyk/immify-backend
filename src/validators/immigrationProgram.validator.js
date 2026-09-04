import { z } from 'zod';

const pagination = {
  take: z.coerce.number().int().min(1).max(100).default(20),
  skip: z.coerce.number().int().min(0).default(0),
};

export const listImmigrationProgramsSchema = z.object({
  country: z.string().trim().max(100).optional(),
  category: z.string().trim().max(160).optional(),
  leadPriority: z.enum(['High', 'Medium']).optional(),
  search: z.string().trim().max(200).optional(),
  ...pagination,
}).strict();
