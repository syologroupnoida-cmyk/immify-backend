import { z } from 'zod';

const id = z.string().trim().min(1).max(100);
const optionalText = (max) => z.string().trim().max(max).optional();

export const createGlobalLeadSchema = z.object({
  categoryId: id,
  serviceId: id,
  firstName: z.string().trim().min(2).max(80),
  lastName: optionalText(80),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  phone: z.string().trim().min(7).max(20),
  country: optionalText(80),
  state: optionalText(100),
  city: optionalText(100),
  message: optionalText(2000),
  metadata: z.record(z.unknown()).optional(),
}).strict();

export const activateLeadSchema = z.object({
  creditCost: z.coerce.number().int().positive().max(1_000_000),
  expiresAt: z.coerce.date().refine((date) => date > new Date(), {
    message: 'expiresAt must be in the future',
  }).optional(),
}).strict();

export const rejectLeadSchema = z.object({
  reason: z.string().trim().min(5).max(1000),
}).strict();

export const listAdminLeadsQuerySchema = z.object({
  status: z.enum(['PENDING', 'VERIFIED', 'ACTIVE', 'REJECTED', 'EXPIRED', 'CLOSED']).optional(),
  type: z.enum(['GLOBAL', 'DIRECT']).optional(),
  categoryId: id.optional(),
  serviceId: id.optional(),
  take: z.coerce.number().int().min(1).max(100).default(20),
  skip: z.coerce.number().int().min(0).default(0),
}).strict();

export const listVendorLeadsQuerySchema = z.object({
  categoryId: id.optional(),
  serviceId: id.optional(),
  take: z.coerce.number().int().min(1).max(100).default(20),
  skip: z.coerce.number().int().min(0).default(0),
}).strict();

export const updateOfferingsSchema = z.object({
  categoryIds: z.array(id).max(100).default([]),
}).strict();
