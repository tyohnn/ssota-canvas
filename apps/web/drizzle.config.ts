import { defineConfig } from 'drizzle-kit';

const isDevelopment = process.env.NODE_ENV === 'development';

export default defineConfig({
  schema: isDevelopment ? './src/db/dev-schema.ts' : './src/db/schema.ts',
  out: isDevelopment ? './drizzle-dev' : './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: isDevelopment
      ? process.env.DEV_DATABASE_URL || ''
      : process.env.DATABASE_URL || '',
  },
  verbose: true,
  strict: true,
});
