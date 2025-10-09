import { defineConfig } from 'drizzle-kit';

const isDevelopment = process.env.NODE_ENV === 'development';

// Debug logging
console.log('🔍 Drizzle Config Debug:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('isDevelopment:', isDevelopment);
console.log('DEV_DATABASE_URL exists:', !!process.env.DEV_DATABASE_URL);
console.log('DEV_DIRECT_URL exists:', !!process.env.DEV_DIRECT_URL);
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);

// Use DEV_DIRECT_URL for migrations (port 6543) as pooler (5432) times out
const databaseUrl = isDevelopment
  ? process.env.DEV_DATABASE_URL || process.env.DEV_DIRECT_URL || ''
  : process.env.DATABASE_URL || '';

console.log(
  'Using database URL:',
  databaseUrl ? `${databaseUrl.substring(0, 50)}...` : 'EMPTY'
);

export default defineConfig({
  schema: isDevelopment ? './src/db/schema-dev.ts' : './src/db/schema.ts',
  out: isDevelopment ? './drizzle-dev' : './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl,
  },
  verbose: true,
  strict: true,
});
