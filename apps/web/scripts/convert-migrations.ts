// scripts/convert-migrations.ts
import fs from 'fs';
import path from 'path';

const DRIZZLE_DIR = './drizzle';
const SUPABASE_DIR = './supabase/migrations';

// Drizzle 마이그레이션 파일 읽기
const files = fs
  .readdirSync(DRIZZLE_DIR)
  .filter(f => f.endsWith('.sql'))
  .sort();

files.forEach((file, index) => {
  const content = fs.readFileSync(path.join(DRIZZLE_DIR, file), 'utf-8');

  // 타임스탬프 생성 (순차적으로)
  const baseTimestamp = new Date('2024-01-01').getTime();
  const timestamp = new Date(baseTimestamp + index * 1000);
  const timestampStr = timestamp
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d+Z$/, '')
    .slice(0, 14);

  // 파일명에서 설명 추출
  const description = file.replace(/^\d+_/, '').replace('.sql', '');

  const newFilename = `${timestampStr}_${description}.sql`;

  // 복사
  fs.writeFileSync(path.join(SUPABASE_DIR, newFilename), content);

  console.log(`✓ ${file} → ${newFilename}`);
});

console.log(`\n✅ Converted ${files.length} migrations`);
