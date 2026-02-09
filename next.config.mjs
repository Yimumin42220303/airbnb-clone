/** @type {import('next').NextConfig} */
const nextConfig = {
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
