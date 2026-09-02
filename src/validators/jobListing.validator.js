import { z } from 'zod';

const id = z.string().trim().min(1).max(100);
const optionalText = (max) => z.string().trim().max(max).nullable().optional();
const dateTime = z.string().datetime({ offset: true }).transform((value) => new Date(value));

const writableFields = {
  country: z.string().trim().min(2).max(100),
  cityRegion: z.string().trim().min(1).max(160),
  title: z.string().trim().min(2).max(200),
  industry: z.string().trim().min(2).max(160),
  qualification: optionalText(500),
  experience: optionalText(200),
  indicativeSalary: optionalText(200),
  employmentType: z.string().trim().min(2).max(100),
  visaWorkPermit: optionalText(1000),
  sourceStatus: optionalText(160),
  description: optionalText(10000),
  responsibilities: z.array(z.string().trim().min(1).max(1000)).max(100).optional(),
  requiredSkills: z.array(z.string().trim().min(1).max(200)).max(100).optional(),
  vacancyCount: z.number().int().positive().max(100000).optional(),
  applicationEmail: z.string().trim().email().max(320).nullable().optional(),
  applicationUrl: z.string().trim().url().max(2000).nullable().optional(),
  applicationDeadline: dateTime.nullable().optional(),
  expiresAt: dateTime.nullable().optional(),
  dynamicData: z.record(z.unknown()).nullable().optional(),
};

export const createJobListingSchema = z.object(writableFields).strict();
export const updateJobListingSchema = z.object(Object.fromEntries(
  Object.entries(writableFields).map(([key, value]) => [key, value.optional()]),
)).strict().refine((data) => Object.keys(data).length > 0, { message: 'At least one field is required' });

export const createAdminJobListingSchema = z.object({
  ...writableFields,
  vendorUserId: id.nullable().optional(),
  reviewStatus: z.enum(['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED']).optional(),
}).strict();

const pagination = {
  take: z.coerce.number().int().min(1).max(100).default(20),
  skip: z.coerce.number().int().min(0).default(0),
};
export const listVendorJobsSchema = z.object({
  reviewStatus: z.enum(['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED']).optional(),
  ...pagination,
}).strict();
export const listAdminJobsSchema = z.object({
  reviewStatus: z.enum(['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED']).optional(),
  vendorUserId: id.optional(), country: z.string().trim().max(100).optional(),
  industry: z.string().trim().max(160).optional(), search: z.string().trim().max(200).optional(),
  ...pagination,
}).strict();
export const listPublicJobsSchema = z.object({
  country: z.string().trim().max(100).optional(), cityRegion: z.string().trim().max(160).optional(),
  industry: z.string().trim().max(160).optional(), employmentType: z.string().trim().max(100).optional(),
  search: z.string().trim().max(200).optional(), ...pagination,
}).strict();
export const rejectJobListingSchema = z.object({ reason: z.string().trim().min(3).max(2000) }).strict();
