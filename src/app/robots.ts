import { MetadataRoute } from "next";
import { BASE_URL } from "@/lib/site-url";

/**
 * robots.txt 정책.
 *
 * - 일반 검색 크롤러(Googlebot, Bingbot 등): / 전체 허용 (sitemap 그대로)
 * - 비공개 영역(예약·결제·관리자·내 페이지·메시지 등): 모든 봇에 차단
 * - AI 검색 크롤러(GPTBot, ChatGPT-User, OAI-SearchBot, PerplexityBot, Google-Extended):
 *   AEO 노출을 위해 명시적으로 허용. 비공개 영역은 동일하게 차단.
 *
 * 차단/허용을 바꾸고 싶을 때는 disallow 또는 userAgent 항목만 수정하면 된다.
 */
const PRIVATE_PATHS = [
  "/api",
  "/admin",
  "/host",
  "/messages",
  "/mypage",
  "/my-bookings",
  "/booking",
  "/notifications",
  "/wishlist",
  "/auth",
];

const AI_CRAWLERS = [
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "PerplexityBot",
  "Google-Extended",
  "ClaudeBot",
  "Claude-Web",
  "anthropic-ai",
  "Bingbot",
] as const;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // 일반 크롤러: 공개 페이지 허용, 비공개 차단
      {
        userAgent: "*",
        allow: "/",
        disallow: PRIVATE_PATHS,
      },
      // AI 크롤러를 명시적으로 허용 (AEO 노출 목적)
      ...AI_CRAWLERS.map((ua) => ({
        userAgent: ua,
        allow: "/",
        disallow: PRIVATE_PATHS,
      })),
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
