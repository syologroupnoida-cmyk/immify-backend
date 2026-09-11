import { z } from 'zod';

const optionalText = (max) => z.string().trim().max(max).optional()
  .or(z.literal('').transform(() => undefined));

export const createJobApplicationSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(320).transform((value) => value.toLowerCase()),
  phone: z.string().trim().min(7).max(30),
  currentLocation: optionalText(200),
  yearsExperience: optionalText(100),
  noticePeriod: optionalText(100),
  coverLetter: optionalText(5000),
  linkedinUrl: z.string().trim().url().max(2000).optional()
    .or(z.literal('#'))
    .or(z.literal('').transform(() => undefined)),
  portfolioUrl: z.string().trim().url().max(2000).optional()
    .or(z.literal('#'))
    .or(z.literal('').transform(() => undefined)),
  resumeUrl: z.string().trim().url().max(2000),
  consent: z.literal(true, { errorMap: () => ({ message: 'consent must be true' }) }),
}).strict();

const pagination = {
  take: z.coerce.number().int().min(1).max(100).default(20),
  skip: z.coerce.number().int().min(0).default(0),
};

export const listAdminJobApplicationsSchema = z.object({
  jobListingId: z.string().trim().min(1).optional(),
  assignedVendorUserId: z.string().trim().min(1).optional(),
  assignment: z.enum(['ALL', 'ASSIGNED', 'UNASSIGNED']).default('ALL'),
  status: z.enum(['SUBMITTED', 'REVIEWING', 'SHORTLISTED', 'REJECTED', 'HIRED']).optional(),
  search: z.string().trim().max(200).optional(),
  ...pagination,
}).strict();

export const listVendorJobApplicationsSchema = z.object({
  jobListingId: z.string().trim().min(1).optional(),
  status: z.enum(['SUBMITTED', 'REVIEWING', 'SHORTLISTED', 'REJECTED', 'HIRED']).optional(),
  ...pagination,
}).strict();

export const updateJobApplicationStatusSchema = z.object({
  status: z.enum(['REVIEWING', 'SHORTLISTED', 'REJECTED', 'HIRED']),
  note: optionalText(2000),
}).strict();
