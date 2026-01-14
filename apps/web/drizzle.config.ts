import { defineConfig } from 'drizzle-kit';
import { config } from '@/config';

export default defineConfig({
  schema: [
    './src/db/schema.ts',
    './src/db/schemas/image-app-space-schema.ts',
    './src/db/schemas/youtube-app-space-schema.ts',
  ],
  out: './drizzle-temp',
  dialect: 'postgresql',
  dbCredentials: {
    url: config.database.nonPoolingUrl || '',
  },
  // 🔑 중요: 여러 스키마를 관리하려면 schemaFilter 필수
  schemaFilter: ['public', 'image_app_space', 'youtube_app_space'],
  verbose: true,
  strict: true,
});
