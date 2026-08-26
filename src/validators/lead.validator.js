import { z } from 'zod';

const id = z.string().trim().min(1).max(100);
const optionalText = (max) => z.string().trim().max(max).optional();
const optionalRequiredText = (max) => z.string().trim().min(1).max(max).optional();
const optionalFileUrl = z.string().trim().url().max(2048).optional();
const optionalDate = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format').optional();

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
  whatsappNumber: optionalRequiredText(20),
  gender: z.enum(['Male', 'Female', 'Other', 'Prefer not to say']).optional(),
  dateOfBirth: optionalDate,
  maritalStatus: z.enum(['Single', 'Married']).optional(),
  nationality: optionalRequiredText(80),
  servicesRequired: z.array(z.string().trim().min(1).max(100)).max(20).default([]),
  destinationCountries: z.array(z.string().trim().min(1).max(80)).max(20).default([]),
  highestQualification: optionalRequiredText(50),
  passingYear: z.coerce.number().int().min(1950).max(new Date().getFullYear() + 10).optional(),
  university: optionalRequiredText(200),
  percentageOrCgpa: optionalRequiredText(30),
  currentCompany: optionalRequiredText(150),
  currentDesignation: optionalRequiredText(150),
  industry: optionalRequiredText(150),
  yearsOfExperience: z.coerce.number().min(0).max(80).optional(),
  currentSalary: optionalRequiredText(80),
  relevantExperience: optionalRequiredText(500),
  languageTestTaken: z.enum(['IELTS', 'PTE', 'TOEFL', 'Duolingo', 'None']).optional(),
  overallScore: optionalRequiredText(20),
  listeningScore: optionalRequiredText(20),
  readingScore: optionalRequiredText(20),
  writingScore: optionalRequiredText(20),
  speakingScore: optionalRequiredText(20),
  passportAvailable: z.enum(['Yes', 'No']).optional(),
  passportExpiry: optionalDate,
  familyMaritalStatus: z.enum(['Single', 'Married']).optional(),
  spouseQualification: optionalRequiredText(100),
  children: z.coerce.number().int().min(0).max(50).optional(),
  dependents: z.coerce.number().int().min(0).max(50).optional(),
  investmentBudget: z.enum(['Under 1 Lakh', '1-3 Lakhs', '3-5 Lakhs', '5-10 Lakhs', 'Above 10 Lakhs']).optional(),
  applicationTimeline: z.enum(['Immediately', 'Within 1 Month', 'Within 3 Months', 'Within 6 Months', 'Just Researching']).optional(),
  resumeUrl: optionalFileUrl,
  passportDocumentUrl: optionalFileUrl,
  ieltsDocumentUrl: optionalFileUrl,
  educationalCertificateUrls: z.array(z.string().trim().url().max(2048)).max(20).default([]),
  experienceLetterUrls: z.array(z.string().trim().url().max(2048)).max(20).default([]),
  bankStatementUrl: optionalFileUrl,
  additionalInformation: optionalText(2000),
  consentToCalls: z.boolean().default(false),
  termsAccepted: z.literal(true),
}).strict();

export const leadFormConfigQuerySchema = z.object({
  categoryId: id,
  serviceId: id,
}).strict();

export const activateLeadSchema = z.object({
  creditCost: z.coerce.number().int().positive().max(1_000_000),
  maxUnlocks: z.coerce.number().int().min(1).max(100_000),
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
