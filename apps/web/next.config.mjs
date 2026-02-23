import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@workspace/ui'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'uqffxkleuwgeqivimpck.supabase.co',
        pathname: '/storage/v1/object/**',
      },
      {
        protocol: 'https',
        hostname: 'dxuapvlsggobjosvqztm.supabase.co',
        pathname: '/storage/v1/object/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
    ],
  },
  // ✅ Server Actions body size limit 증가 (이미지 업로드용)
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb', // 기본값 1mb → 50mb로 증가 (Base64 인코딩 고려)
    },
  },
  // ✅ Turbopack 설정 - .md 파일 처리
  turbopack: {
    rules: {
      '*.md': {
        loaders: ['raw-loader'],
        as: '*.js',
      },
    },
  },
  // ✅ Webpack 설정 - .md 파일 처리 (프로덕션 빌드) + Yjs 단일 인스턴스
  webpack: config => {
    // .md 파일을 문자열로 처리
    config.module.rules.push({
      test: /\.md$/,
      type: 'asset/source',
    });
    // Yjs 중복 import 방지 (https://github.com/yjs/yjs/issues/438)
    config.resolve.alias = {
      ...config.resolve.alias,
      yjs: require.resolve('yjs'),
    };
    return config;
  },
};

export default nextConfig;
