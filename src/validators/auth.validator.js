const { z } = require('zod');

const passwordSchema = z.string().trim().min(8).max(72).refine((value) => /[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value), {
  message: 'Password must contain uppercase, lowercase, and a number',
});

const nameField = z.string().trim().min(2).max(40);
const emailField = z.string().trim().toLowerCase().email();
const phoneField = z.string().trim().regex(/^\d{10,15}$/);
const roleSchema = z.enum(['CLIENT', 'VENDOR']);

const registerSchema = z.object({
  firstName: nameField,
  lastName: nameField,
  email: emailField,
  phone: phoneField,
  password: passwordSchema,
  role: roleSchema,
  vendorType: z.enum(['TRAVEL_AGENT', 'PROPERTY_OWNER']).optional(),
}).strict().superRefine((data, ctx) => {
  if (data.role === 'VENDOR' && !data.vendorType) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'vendorType is required for vendor registration', path: ['vendorType'] });
  }
  if (data.role === 'CLIENT' && data.vendorType) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'vendorType is only allowed for VENDOR role', path: ['vendorType'] });
  }
});

const loginSchema = z.object({ email: emailField, password: z.string().min(8).max(72) }).strict();
const refreshTokenSchema = z.object({ refreshToken: z.string().optional() }).strict();
const verifyEmailSchema = z.object({ email: emailField, code: z.string().trim().min(4).max(8) }).strict();
const forgotPasswordSchema = z.object({ email: emailField }).strict();
const verifyResetOtpSchema = z.object({ email: emailField, code: z.string().trim().min(4).max(8) }).strict();
const resetPasswordSchema = z.object({ resetToken: z.string().min(1), newPassword: passwordSchema }).strict();
const googleLoginSchema = z.object({ token: z.string().min(1), role: roleSchema.optional(), vendorType: z.enum(['TRAVEL_AGENT', 'PROPERTY_OWNER']).optional() }).passthrough();
const updateProfileSchema = z.object({ firstName: nameField.optional(), lastName: nameField.optional(), phone: phoneField.optional(), avatarUrl: z.string().url().optional() }).strict().refine((data) => Object.keys(data).length > 0, { message: 'At least one field is required' });
const changePasswordSchema = z.object({ currentPassword: z.string().min(8).max(72), newPassword: passwordSchema }).strict().refine((data) => data.currentPassword !== data.newPassword, { message: 'New password must differ from current password' });

module.exports = { registerSchema, loginSchema, refreshTokenSchema, verifyEmailSchema, forgotPasswordSchema, verifyResetOtpSchema, resetPasswordSchema, googleLoginSchema, updateProfileSchema, changePasswordSchema };
