import { z } from 'zod';

const trimmedRequired = (min, max, label) =>
  z
    .string({ required_error: `${label} is required` })
    .trim()
    .min(min, `${label} must be at least ${min} characters long`)
    .max(max, `${label} must not exceed ${max} characters`);

const trimmedOptional = (max, label) =>
  z.string().trim().max(max, `${label} must not exceed ${max} characters`).optional();

// ----------------------------------------------------------------------------
//   Shared shape for one child service — used both nested (on create) and
//   standalone (POST /service-categories/:id/services)
// ----------------------------------------------------------------------------
export const childServiceSchema = z
  .object({
    name: trimmedRequired(2, 100, 'Service name'),
    description: trimmedOptional(500, 'Service description'),
  })
  .strict();

// ----------------------------------------------------------------------------
//   POST /super-admin/service-categories
//   Single payload: category fields + an optional list of child services.
// ----------------------------------------------------------------------------
export const createServiceCategorySchema = z
  .object({
    name: trimmedRequired(2, 100, 'Category name'),
    description: trimmedOptional(500, 'Category description'),
    services: z.array(childServiceSchema).max(50, 'Too many services').optional().default([]),
  })
  .strict();

// ----------------------------------------------------------------------------
//   PATCH /super-admin/service-categories/:id
// ----------------------------------------------------------------------------
export const updateServiceCategorySchema = z
  .object({
    name: trimmedRequired(2, 100, 'Category name').optional(),
    description: trimmedOptional(500, 'Category description'),
    isActive: z.boolean().optional(),
  })
  .strict()
  .refine((d) => Object.keys(d).length > 0, {
    message: 'At least one field must be provided',
  });

// ----------------------------------------------------------------------------
//   PATCH /super-admin/services/:serviceId
// ----------------------------------------------------------------------------
export const updateServiceSchema = z
  .object({
    name: trimmedRequired(2, 100, 'Service name').optional(),
    description: trimmedOptional(500, 'Service description'),
    isActive: z.boolean().optional(),
  })
  .strict()
  .refine((d) => Object.keys(d).length > 0, {
    message: 'At least one field must be provided',
  });
