import { z } from 'zod';

const id = z.string().trim().min(1).max(100);
const nullableLimit = z.number().int().positive().max(100000).nullable();
const displayContent = z.object({
  badgeText: z.string().trim().max(50).nullable().default(null),
  ribbonText: z.string().trim().max(50).nullable().default(null),
  iconUrl: z.union([z.literal(''), z.string().trim().url().max(2000)]).default(''),
  themeColor: z.string().trim().regex(/^#[0-9A-Fa-f]{6}$/, 'themeColor must be a 6-digit hex color'),
  ctaButtonText: z.string().trim().min(1).max(50),
  features: z.array(z.object({ text: z.string().trim().min(1).max(200), included: z.boolean() }).strict()).max(50).default([]),
}).strict();

const planFields = {
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(2000).optional(),
  salePriceInPaise: z.number().int().nonnegative(),
  offerPriceInPaise: z.number().int().nonnegative().nullable().optional(),
  currency: z.string().trim().length(3).transform((v) => v.toUpperCase()).default('INR'),
  billingCycle: z.enum(['MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY']).default('MONTHLY'),
  durationDays: z.number().int().positive().max(3660),
  trialDays: z.number().int().min(0).max(365).default(0),
  includedCredits: z.number().int().min(0).max(10000000).default(0),
  maxPackages: nullableLimit,
  maxJobPosts: nullableLimit,
  jobPortalAccess: z.boolean().default(false),
  directLeadPriceCredits: z.number().int().positive().max(1000000),
  priorityWeight: z.number().int().min(0).max(1000000).default(0),
  displayOrder: z.number().int().min(0).default(0),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  displayContent,
  rules: z.record(z.unknown()).default({}),
  categoryIds: z.array(id).min(1).max(100),
};

const validPrices = (data) => data.offerPriceInPaise == null || data.salePriceInPaise == null || data.offerPriceInPaise <= data.salePriceInPaise;
export const createSubscriptionPlanSchema = z.object(planFields).strict()
  .refine(validPrices, { path: ['offerPriceInPaise'], message: 'Offer price cannot exceed sale price' });
export const updateSubscriptionPlanSchema = z.object({
  ...Object.fromEntries(Object.entries(planFields).map(([key, value]) => [key, value.optional()])),
}).strict()
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field is required' })
  .refine(validPrices, { path: ['offerPriceInPaise'], message: 'Offer price cannot exceed sale price' });

export const checkoutSubscriptionSchema = z.object({
  planId: id,
  autoRenew: z.boolean().default(false),
}).strict();

export const confirmSubscriptionPaymentSchema = z.object({
  providerPaymentId: z.string().trim().min(3).max(200),
  provider: z.string().trim().min(2).max(50).default('MANUAL'),
}).strict();

export const rejectSubscriptionPaymentSchema = z.object({
  reason: z.string().trim().min(3).max(500),
}).strict();

export const listAdminSubscriptionsQuerySchema = z.object({
  status: z.enum(['PENDING_PAYMENT', 'ACTIVE', 'EXPIRED', 'CANCELLED', 'PAYMENT_FAILED']).optional(),
  vendorUserId: id.optional(),
  planId: id.optional(),
  take: z.coerce.number().int().min(1).max(100).default(20),
  skip: z.coerce.number().int().min(0).default(0),
}).strict();

export const createServiceListingSchema = z.object({
  categoryId: id,
  serviceId: id.optional(),
  title: z.string().trim().max(160).optional(),
  description: z.string().trim().max(5000).optional(),
  includes: z.array(z.string().trim().min(1).max(500)).max(100).optional(),
  chargesIncludeGst: z.boolean().optional(),
  imageUrl: z.union([z.literal(''), z.string().trim().url().max(2000)]).optional(),
  overview: z.string().trim().max(10000).optional(),
  process: z.string().trim().max(10000).optional(),
  priceInPaise: z.number().int().nonnegative().max(2147483647).optional(),
  currency: z.string().trim().length(3).transform((value) => value.toUpperCase()).optional(),
  pricingDetails: z.string().trim().max(10000).optional(),
  termsAndConditions: z.string().trim().max(10000).optional(),
  dynamicData: z.record(z.unknown()).optional(),
}).strict();

export const createServiceListingQuerySchema = z.object({
  draft: z.enum(['true', 'false']).default('true').transform((value) => value === 'true'),
}).strict();

export const updateServiceListingSchema = z.object({
  serviceId: id.nullable().optional(),
  title: z.string().trim().max(160).nullable().optional(),
  description: z.string().trim().max(5000).nullable().optional(),
  includes: z.array(z.string().trim().min(1).max(500)).max(100).nullable().optional(),
  chargesIncludeGst: z.boolean().nullable().optional(),
  imageUrl: z.union([z.literal(''), z.string().trim().url().max(2000)]).nullable().optional(),
  overview: z.string().trim().max(10000).nullable().optional(),
  process: z.string().trim().max(10000).nullable().optional(),
  priceInPaise: z.number().int().nonnegative().max(2147483647).nullable().optional(),
  currency: z.string().trim().length(3).transform((value) => value.toUpperCase()).nullable().optional(),
  pricingDetails: z.string().trim().max(10000).nullable().optional(),
  termsAndConditions: z.string().trim().max(10000).nullable().optional(),
  dynamicData: z.record(z.unknown()).nullable().optional(),
}).strict().refine((data) => Object.keys(data).length > 0, { message: 'At least one field is required' });

export const listServiceListingsForReviewSchema = z.object({
  status: z.enum(['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED']).optional(),
  vendorUserId: id.optional(),
  categoryId: id.optional(),
  take: z.coerce.number().int().min(1).max(100).default(20),
  skip: z.coerce.number().int().min(0).default(0),
}).strict();

export const rejectServiceListingSchema = z.object({
  reason: z.string().trim().min(3).max(2000),
}).strict();
