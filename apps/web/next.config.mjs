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
};

export default nextConfig;
