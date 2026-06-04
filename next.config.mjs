/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: "10mb" },
    /** 동적 라우트도 짧게 클라이언트 캐시 → 같은 링크 재방문·뒤로가기 체감 개선 */
    staleTimes: {
      dynamic: 30,
      static: 300,
    },
    /** 사용된 아이콘만 번들링 — lucide-react 전체 패키지 임포트 방지 */
    optimizePackageImports: ["lucide-react"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos", pathname: "/**" },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "lh3.googleusercontent.com", pathname: "/**" },
      { protocol: "https", hostname: "p.kakaocdn.net", pathname: "/**" },
      { protocol: "https", hostname: "k.kakaocdn.net", pathname: "/**" },
      { protocol: "https", hostname: "phinf.pstatic.net", pathname: "/**" },
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com", pathname: "/**" },
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
      { protocol: "https", hostname: "placehold.co", pathname: "/**" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://t1.kakaocdn.net https://accounts.google.com https://cdn.channel.io https://wcs.channel.io https://cdn.portone.io https://www.googletagmanager.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.channel.io https://*.channel.io",
              "img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com https://lh3.googleusercontent.com https://p.kakaocdn.net https://k.kakaocdn.net https://phinf.pstatic.net https://image.inicis.com https://*.public.blob.vercel-storage.com https://*.channel.io https://cf.channel.io https://cdn.channel.io https://*.cdninstagram.com https://*.fbcdn.net https://*.instagram.com https://www.google-analytics.com https://www.googletagmanager.com",
              "media-src 'self' https://res.cloudinary.com https://*.cloudinary.com https://cdn.channel.io https://*.cdninstagram.com https://*.fbcdn.net https://*.instagram.com blob:",
              "font-src 'self' https://fonts.gstatic.com https://cdn.channel.io https://*.channel.io",
              "frame-src 'self' https://www.google.com https://maps.google.com https://www.google.co.jp https://stdpay.inicis.com https://*.inicis.com https://accounts.google.com https://cdn.portone.io https://*.portone.io https://*.iamport.co https://*.channel.io https://*.instagram.com",
              "connect-src 'self' https://api.cloudinary.com https://wcs.channel.io https://api.channel.io https://*.channel.io https://*.channel.app https://*.sentry.io wss://*.channel.io wss://*.desk-ws.channel.io wss://*.front-ws.channel.io https://*.portone.io https://portone.io https://*.iamport.co https://*.inicis.com https://stdpay.inicis.com https://iniweb.inicis.com https://*.instagram.com https://*.fbcdn.net https://*.cdninstagram.com https://www.google-analytics.com https://analytics.google.com https://*.google-analytics.com https://www.googletagmanager.com",
            ].join("; "),
          },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
};

export default nextConfig;
