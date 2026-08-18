import { z } from 'zod';

const id = z.string().trim().min(1).max(100);
const nullableLimit = z.number().int().positive().max(100000).nullable();

const planFields = {
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(2000).optional(),
  priceInPaise: z.number().int().nonnegative(),
  currency: z.string().trim().length(3).transform((v) => v.toUpperCase()).default('INR'),
  billingPeriod: z.enum(['MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY']).default('MONTHLY'),
  durationDays: z.number().int().positive().max(3660),
  maxPublicServices: nullableLimit,
  maxJobPosts: nullableLimit,
  jobPortalAccess: z.boolean().default(false),
  directLeadCreditPrice: z.number().int().positive().max(1000000),
  displayOrder: z.number().int().min(0).default(0),
  isFeatured: z.boolean().default(false),
  categoryIds: z.array(id).min(1).max(100),
};

export const createSubscriptionPlanSchema = z.object(planFields).strict();
export const updateSubscriptionPlanSchema = z.object({
  ...Object.fromEntries(Object.entries(planFields).map(([key, value]) => [key, value.optional()])),
}).strict().refine((data) => Object.keys(data).length > 0, { message: 'At least one field is required' });

export const checkoutSubscriptionSchema = z.object({
  planId: id,
  autoRenew: z.boolean().default(false),
}).strict();

export const confirmSubscriptionPaymentSchema = z.object({
  providerPaymentId: z.string().trim().min(3).max(200),
  provider: z.string().trim().min(2).max(50).default('MANUAL'),
}).strict();

export const createServiceListingSchema = z.object({
  categoryId: id,
  serviceId: id.optional(),
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().max(5000).optional(),
  dynamicData: z.record(z.unknown()).optional(),
  publish: z.boolean().default(false),
}).strict();

export const updateServiceListingSchema = z.object({
  title: z.string().trim().min(3).max(160).optional(),
  description: z.string().trim().max(5000).nullable().optional(),
  dynamicData: z.record(z.unknown()).nullable().optional(),
}).strict().refine((data) => Object.keys(data).length > 0, { message: 'At least one field is required' });

export const setListingPublicationSchema = z.object({ published: z.boolean() }).strict();
