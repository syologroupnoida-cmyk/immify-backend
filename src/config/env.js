const { z } = require('zod');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_RESET_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
  CORS_ORIGIN: z.string().default('*'),
  FRONTEND_URL: z.string().url().optional().or(z.literal('')),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().optional(),
  SMTP_SECURE: z.coerce.boolean().optional().default(false),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM_NAME: z.string().optional(),
  MAIL_FROM_ADDRESS: z.string().optional(),
  OTP_LENGTH: z.coerce.number().int().min(4).max(8).default(6),
  OTP_TTL_MINUTES: z.coerce.number().int().min(1).default(10),
  OTP_MAX_ATTEMPTS: z.coerce.number().int().min(1).default(5),
  OTP_RESEND_COOLDOWN_SECONDS: z.coerce.number().int().min(1).default(60),
  GOOGLE_CLIENT_ID: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.JWT_ACCESS_SECRET === data.JWT_REFRESH_SECRET) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'JWT access and refresh secrets must differ', path: ['JWT_REFRESH_SECRET'] });
  }
  if (data.JWT_ACCESS_SECRET === data.JWT_RESET_SECRET) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'JWT access and reset secrets must differ', path: ['JWT_RESET_SECRET'] });
  }
  if (data.JWT_REFRESH_SECRET === data.JWT_RESET_SECRET) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'JWT refresh and reset secrets must differ', path: ['JWT_RESET_SECRET'] });
  }
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const env = parsed.data;
const isProduction = env.NODE_ENV === 'production';
const isDevelopment = env.NODE_ENV === 'development';
const isTest = env.NODE_ENV === 'test';

module.exports = { env, isProduction, isDevelopment, isTest };
