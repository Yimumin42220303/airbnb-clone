/**
 * /recommend 상담 — Channel.io Web SDK (클라이언트 전용, server import 금지)
 * ListingChannelInquiryButton 패턴 참고, PII·freeText 미전달
 */

export type RecommendChannelContext = {
  leadCode: string;
  checkIn: string;
  checkOut: string;
  guestCount: number;
  childCount: number;
  infantCount: number;
  preferredAreaLabel: string;
  priorityLabel: string;
  budgetLabel?: string;
  recommendedListingTitles: string[];
  recommendedListingIds: string[];
  sourcePage?: string;
  sourceListingId?: string;
};

const RETRY_DELAYS_MS = [0, 200, 400, 800, 1200];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isChannelIOReady(): boolean {
  return typeof window !== "undefined" && typeof window.ChannelIO === "function";
}

/** ChannelTalk.tsx 부트 대기 */
export async function waitForChannelIO(maxWaitMs = 4000): Promise<boolean> {
  const start = Date.now();
  let attempt = 0;
  while (Date.now() - start < maxWaitMs) {
    if (isChannelIOReady()) return true;
    const delay = RETRY_DELAYS_MS[Math.min(attempt, RETRY_DELAYS_MS.length - 1)];
    await sleep(delay);
    attempt += 1;
  }
  return isChannelIOReady();
}

function buildPageUrl(): string {
  if (typeof window === "undefined") return "/recommend";
  const { origin, pathname, search } = window.location;
  return `${origin}${pathname}${search}`;
}

function buildChatProfile(ctx: RecommendChannelContext) {
  const titles = ctx.recommendedListingTitles.slice(0, 3).join(" · ");
  const ids = ctx.recommendedListingIds.slice(0, 3).join(",");
  const guestLine =
    ctx.childCount > 0 || ctx.infantCount > 0
      ? `${ctx.guestCount}명(아동 ${ctx.childCount}${ctx.infantCount > 0 ? `, 유아 ${ctx.infantCount}` : ""})`
      : `${ctx.guestCount}명`;

  return {
    recommendLeadCode: ctx.leadCode,
    recommendCheckIn: ctx.checkIn,
    recommendCheckOut: ctx.checkOut,
    recommendGuestCount: guestLine,
    recommendPreferredArea: ctx.preferredAreaLabel,
    recommendPriority: ctx.priorityLabel,
    ...(ctx.budgetLabel ? { recommendBudget: ctx.budgetLabel } : {}),
    recommendListingSummary: titles.slice(0, 500),
    recommendListingIds: ids.slice(0, 500),
    ...(ctx.sourcePage ? { recommendSourcePage: ctx.sourcePage } : {}),
    ...(ctx.sourceListingId ? { recommendSourceListingId: ctx.sourceListingId } : {}),
  };
}

/** ChannelIO 호출 — 준비된 경우에만 */
export function pushRecommendConsultToChannel(ctx: RecommendChannelContext): boolean {
  if (!isChannelIOReady()) return false;

  const pageUrl = buildPageUrl();
  const profile = buildChatProfile(ctx);
  const titles = ctx.recommendedListingTitles.slice(0, 3);

  try {
    window.ChannelIO!("track", "Recommendation lead inquiry", {
      leadCode: ctx.leadCode,
      checkIn: ctx.checkIn,
      checkOut: ctx.checkOut,
      guestCount: ctx.guestCount,
      childCount: ctx.childCount,
      infantCount: ctx.infantCount,
      preferredAreaLabel: ctx.preferredAreaLabel,
      priorityLabel: ctx.priorityLabel,
      ...(ctx.budgetLabel ? { budgetLabel: ctx.budgetLabel } : {}),
      recommendedListingIds: ctx.recommendedListingIds.slice(0, 3),
      recommendedListingTitles: titles,
      sourcePage: ctx.sourcePage ?? null,
      sourceListingId: ctx.sourceListingId ?? null,
      pageUrl,
    });
  } catch {
    /* ignore */
  }

  try {
    window.ChannelIO!("setPage", pageUrl || "/recommend", profile);
  } catch {
    /* ignore */
  }

  try {
    window.ChannelIO!("updateUser", { profile });
  } catch {
    /* ignore */
  }

  try {
    window.ChannelIO!("addTags", ["recommendation_lead", "recommend_consultation"]);
  } catch {
    /* ignore */
  }

  try {
    window.ChannelIO!("showMessenger");
    return true;
  } catch {
    return false;
  }
}

export type ChannelOpenResult = "opened" | "not_ready" | "messenger_failed";

export async function openRecommendChannelConsult(
  ctx: RecommendChannelContext
): Promise<ChannelOpenResult> {
  const ready = await waitForChannelIO();
  if (!ready) return "not_ready";
  const ok = pushRecommendConsultToChannel(ctx);
  return ok ? "opened" : "messenger_failed";
}
