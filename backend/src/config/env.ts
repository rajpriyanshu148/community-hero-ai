import { z } from 'zod';

const envSchema = z.object({
  // Server
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL URL'),

  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().optional().default(''),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(''),
  GOOGLE_CALLBACK_URL: z
    .string()
    .default('http://localhost:5000/api/v1/auth/google/callback'),

  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // Gemini AI
  GEMINI_API_KEY: z.string().optional().default(''),

  // Google Maps
  GOOGLE_MAPS_API_KEY: z.string().optional().default(''),

  // OpenWeatherMap
  OPENWEATHER_API_KEY: z.string().optional().default(''),

  // Frontend
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),

  // File Upload
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_FILE_SIZE: z.coerce.number().default(10485760),

  // Session
  SESSION_SECRET: z.string().min(16, 'SESSION_SECRET must be at least 16 characters').optional().default('default-session-secret-change-in-production'),

  // Optional monitoring
  SENTRY_DSN: z.string().optional().default(''),
  POSTHOG_KEY: z.string().optional().default(''),
});

type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.format();
    console.error('❌ Invalid environment variables:');
    console.error(JSON.stringify(errors, null, 2));
    process.exit(1);
  }

  return result.data;
}

export const env = validateEnv();
export type { Env };
