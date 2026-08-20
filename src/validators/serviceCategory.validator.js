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
    isActive: z.boolean().optional(),
  })
  .strict();

const existingChildServiceSchema = z
  .object({
    id: z.string().uuid('Service id must be a valid UUID'),
    name: trimmedRequired(2, 100, 'Service name').optional(),
    description: trimmedOptional(500, 'Service description'),
    isActive: z.boolean().optional(),
  })
  .strict()
  .refine((service) => Object.keys(service).some((key) => key !== 'id'), {
    message: 'At least one service field must be provided',
  });

// On category PATCH, an id identifies a child to update; no id means create.
export const patchChildServiceSchema = z.union([
  existingChildServiceSchema,
  childServiceSchema,
]);

// ----------------------------------------------------------------------------
//   POST /super-admin/service-categories
//   Single payload: category fields + an optional list of child services.
// ----------------------------------------------------------------------------
export const createServiceCategorySchema = z
  .object({
    name: trimmedRequired(2, 100, 'Category name'),
    description: trimmedOptional(500, 'Category description'),
    isActive: z.boolean().optional(),
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
    services: z
      .array(patchChildServiceSchema)
      .min(1, 'At least one service must be provided')
      .max(50, 'Too many services')
      .optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    const ids = (data.services ?? []).flatMap((service) => (service.id ? [service.id] : []));
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['services'],
        message: 'A service id may only appear once',
      });
    }
  })
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
