import { z } from 'zod';

const fields = {
  slug: z.string().trim().min(1).max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers, and hyphens.'),
  title: z.string().trim().min(1).max(300),
  excerpt: z.string().trim().min(1),
  category: z.string().trim().min(1).max(100),
  readTime: z.string().trim().min(1).max(50),
  image: z.string().trim().min(1).max(2000),
  content: z.array(z.string().trim().min(1)).min(1),
  isActive: z.boolean().optional(),
};

export const createBlogSchema = z.object(fields).strict();
export const updateBlogSchema = z.object(Object.fromEntries(
  Object.entries(fields).map(([key, value]) => [key, value.optional()]),
)).strict().refine((value) => Object.keys(value).length > 0, 'At least one field is required.');

const pagination = {
  take: z.coerce.number().int().min(1).max(100).default(20),
  skip: z.coerce.number().int().min(0).default(0),
  category: z.string().trim().min(1).max(100).optional(),
};
export const listAdminBlogsSchema = z.object({ ...pagination, isActive: z.enum(['true', 'false']).transform((value) => value === 'true').optional() }).strict();
export const listPublicBlogsSchema = z.object(pagination).strict();
