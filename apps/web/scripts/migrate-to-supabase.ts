#!/usr/bin/env tsx
// scripts/migrate-to-supabase.ts
// Drizzle 마이그레이션을 Supabase migrations 폴더로 이동하는 자동화 스크립트

import fs from 'fs';
import path from 'path';

const DRIZZLE_TEMP_DIR = './drizzle-temp';
const SUPABASE_MIGRATIONS_DIR = './supabase/migrations';

interface MigrationFile {
  filename: string;
  fullPath: string;
  createdAt: Date;
}

function getMostRecentMigration(): MigrationFile | null {
  if (!fs.existsSync(DRIZZLE_TEMP_DIR)) {
    console.error('❌ drizzle-temp 폴더가 존재하지 않습니다.');
    console.log('💡 먼저 `pnpm db:generate`를 실행하세요.');
    return null;
  }

  const files = fs
    .readdirSync(DRIZZLE_TEMP_DIR)
    .filter(f => f.endsWith('.sql'))
    .map(f => {
      const fullPath = path.join(DRIZZLE_TEMP_DIR, f);
      const stats = fs.statSync(fullPath);
      return {
        filename: f,
        fullPath,
        createdAt: stats.mtime,
      };
    })
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  if (files.length === 0) {
    console.error('❌ drizzle-temp 폴더에 마이그레이션 파일이 없습니다.');
    console.log('💡 먼저 `pnpm db:generate`를 실행하세요.');
    return null;
  }

  return files[0]!;
}

function generateTimestamp(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  const hours = String(now.getUTCHours()).padStart(2, '0');
  const minutes = String(now.getUTCMinutes()).padStart(2, '0');
  const seconds = String(now.getUTCSeconds()).padStart(2, '0');

  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

function extractDescription(filename: string): string {
  // 0000_normal_wilson_fisk.sql -> normal_wilson_fisk
  const match = filename.match(/^\d+_(.+)\.sql$/);
  return match ? match[1]! : 'migration';
}

function main() {
  const args = process.argv.slice(2);
  const customDescription = args[0]; // 사용자가 제공한 설명

  console.log('🔄 Drizzle → Supabase 마이그레이션 자동화\n');

  // 1. 최신 마이그레이션 파일 찾기
  const latestMigration = getMostRecentMigration();
  if (!latestMigration) {
    process.exit(1);
  }

  console.log(`📄 최신 마이그레이션: ${latestMigration.filename}`);

  // 2. 설명 생성
  const autoDescription = extractDescription(latestMigration.filename);
  const description = customDescription || autoDescription;

  // 3. 타임스탬프 생성
  const timestamp = generateTimestamp();

  // 4. 새 파일명 생성
  const newFilename = `${timestamp}_${description}.sql`;
  const targetPath = path.join(SUPABASE_MIGRATIONS_DIR, newFilename);

  // 5. 파일이 이미 존재하는지 확인
  if (fs.existsSync(targetPath)) {
    console.error(`❌ 파일이 이미 존재합니다: ${newFilename}`);
    process.exit(1);
  }

  // 6. Supabase migrations 폴더 확인 및 생성
  if (!fs.existsSync(SUPABASE_MIGRATIONS_DIR)) {
    fs.mkdirSync(SUPABASE_MIGRATIONS_DIR, { recursive: true });
    console.log(`📁 생성됨: ${SUPABASE_MIGRATIONS_DIR}`);
  }

  // 7. 파일 복사
  const content = fs.readFileSync(latestMigration.fullPath, 'utf-8');
  fs.writeFileSync(targetPath, content);

  console.log(`\n✅ 마이그레이션 복사 완료!`);
  console.log(`   From: ${latestMigration.filename}`);
  console.log(`   To:   ${newFilename}`);

  // 8. 파일 크기 정보
  const sizeInKB = (fs.statSync(targetPath).size / 1024).toFixed(2);
  console.log(`   Size: ${sizeInKB} KB`);

  // 9. 다음 단계 안내
  console.log('\n📝 다음 단계:');
  console.log('   1. supabase db reset        # 로컬에서 테스트');
  console.log('   2. git add supabase/migrations/');
  console.log('   3. git commit -m "feat: add migration"');
  console.log('   4. git push                 # Supabase 자동 배포');
}

main();
