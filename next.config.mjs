/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // 빌드 시 타입 체크 건너뛰기 (개발 시 IDE에서 체크)
    ignoreBuildErrors: true,
  },
  eslint: {
    // 빌드 시 ESLint 건너뛰기 (개발 시 로컬에서 체크)
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverActions: { bodySizeLimit: "10mb" },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos", pathname: "/**" },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "lh3.googleusercontent.com", pathname: "/**" },
      { protocol: "https", hostname: "p.kakaocdn.net", pathname: "/**" },
      { protocol: "https", hostname: "k.kakaocdn.net", pathname: "/**" },
      { protocol: "https", hostname: "phinf.pstatic.net", pathname: "/**" },
    ],
  },
};

export default nextConfig;
