import type { BlogListingCardData } from "@/lib/blog-listing-data";

/** 예전 글의 [LISTING_CARD:classic] 등 — 코드 배포 없이 본문만으로도 동작 */
export const LEGACY_LISTING_CARD_ALIASES: Record<string, string> = {
  classic: "cmo74q3da004e5uv4wdnqo3sy",
  apartment: "cmo74ef3l00345uv4hafvr7l7",
  riverside: "cmpbamgil0001m9motgb7aptv",
  asahi: "cmncytjx30001mvd6qszlltf5",
};

const LISTING_ID_RE = /^c[a-z0-9]{20,}$/i;

export function listingPath(id: string): string {
  return `/listing/${id}`;
}

export function isListingId(value: string): boolean {
  return LISTING_ID_RE.test(value.trim());
}

export function resolveListingId(raw: string): string | null {
  const t = raw.trim();
  if (isListingId(t)) return t;
  return LEGACY_LISTING_CARD_ALIASES[t] ?? null;
}

export type BlogListingCardOverrides = {
  recommendedFor?: string;
  recommendReason?: string;
  caution?: string;
  /** 카드·앵커에 쓸 짧은 숙소명 (미입력 시 listing.title) */
  displayName?: string;
};

export type BlogListingCardDisplay = {
  listingId: string;
  displayName: string;
  anchorLabel: string;
  recommendedFor: string;
  recommendReason: string;
  caution: string;
  imageAlt?: string;
};

export type BlogCompareTableRow = {
  listingId: string;
  displayName: string;
  guestRange: string;
  station: string;
  feature: string;
  caution: string;
};

/** [LISTING_CARD:id|추천대상|추천이유|주의] */
export function parseListingCardToken(
  token: string
): { listingId: string; overrides: BlogListingCardOverrides } | null {
  const parts = token.split("|").map((p) => p.trim());
  const listingId = resolveListingId(parts[0] ?? "");
  if (!listingId) return null;
  return {
    listingId,
    overrides: {
      recommendedFor: parts[1] || undefined,
      recommendReason: parts[2] || undefined,
      caution: parts[3] || undefined,
      displayName: parts[4] || undefined,
    },
  };
}

/** [BLOG_COMPARE:id1,id2] 또는 빈 [BLOG_COMPARE] */
export function parseCompareListingIds(inner: string | undefined): string[] | "auto" {
  const raw = (inner ?? "").trim();
  if (!raw) return "auto";
  const ids: string[] = [];
  for (const part of raw.split(",")) {
    const id = resolveListingId(part.trim());
    if (id && !ids.includes(id)) ids.push(id);
  }
  return ids;
}

export function buildListingCardDisplay(
  listing: BlogListingCardData,
  overrides: BlogListingCardOverrides = {}
): BlogListingCardDisplay {
  const displayName =
    overrides.displayName?.trim() ||
    (listing.title.length > 48 ? `${listing.title.slice(0, 48)}…` : listing.title);
  const roomLine = `침실 ${listing.bedrooms} · 침대 ${listing.beds}${
    listing.areaSqm ? ` · ${listing.areaSqm}㎡` : ""
  }`;
  const defaultReason =
    listing.description?.replace(/\s+/g, " ").trim().slice(0, 120) ||
    `최대 ${listing.maxGuests}명 · ${roomLine}`;

  return {
    listingId: listing.id,
    displayName,
    anchorLabel: `이 숙소 상세·요금 확인하기`,
    recommendedFor: overrides.recommendedFor ?? `최대 ${listing.maxGuests}명`,
    recommendReason: overrides.recommendReason ?? defaultReason,
    caution: overrides.caution ?? "예약 전 상세페이지에서 시설·주의사항을 확인하세요.",
    imageAlt: displayName,
  };
}

export function buildCompareRowFromListing(
  listing: BlogListingCardData,
  overrides: Partial<BlogCompareTableRow> = {}
): BlogCompareTableRow {
  const displayName =
    listing.title.length > 40 ? `${listing.title.slice(0, 40)}…` : listing.title;
  const feature =
    overrides.feature ??
    `최대 ${listing.maxGuests}명 · 침실 ${listing.bedrooms} · 침대 ${listing.beds}${
      listing.areaSqm ? ` · ${listing.areaSqm}㎡` : ""
    }`;

  return {
    listingId: listing.id,
    displayName,
    guestRange: overrides.guestRange ?? `최대 ${listing.maxGuests}인`,
    station: overrides.station ?? listing.location,
    feature,
    caution: overrides.caution ?? "상세페이지에서 확인",
  };
}

/** 본문에서 숙소 ID 등장 순서(중복 제거) — JSON-LD·데이터 조회용 */
export function collectListingIdsInOrder(body: string): string[] {
  const hits: { index: number; id: string }[] = [];

  const add = (index: number, raw: string) => {
    const id = resolveListingId(raw);
    if (id) hits.push({ index, id });
  };

  for (const m of Array.from(body.matchAll(/\/listing\/([a-z0-9]{20,})/gi))) {
    add(m.index ?? 0, m[1]);
  }
  for (const m of Array.from(body.matchAll(/\[LISTING_CARD:([^\]]+)\]/gi))) {
    const parsed = parseListingCardToken(m[1]);
    if (parsed) add(m.index ?? 0, parsed.listingId);
  }
  for (const m of Array.from(body.matchAll(/listing:([a-z0-9]{20,})/gi))) {
    add(m.index ?? 0, m[1]);
  }
  for (const m of Array.from(body.matchAll(/\[BLOG_COMPARE:([^\]]+)\]/gi))) {
    const ids = parseCompareListingIds(m[1]);
    if (Array.isArray(ids)) {
      let offset = 0;
      for (const id of ids) {
        add((m.index ?? 0) + offset, id);
        offset += 1;
      }
    }
  }

  hits.sort((a, b) => a.index - b.index);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const h of hits) {
    if (!seen.has(h.id)) {
      seen.add(h.id);
      out.push(h.id);
    }
  }
  return out;
}

/** compare 블록 직전까지 본문에 등장한 LISTING_CARD 순서 */
export function listingIdsFromCardsBeforeCompare(
  blocks: Array<{ type: string; listingId?: string }>,
  compareBlockIndex: number
): string[] {
  const ids: string[] = [];
  for (let i = 0; i < compareBlockIndex; i++) {
    const b = blocks[i];
    if (b.type === "listing_card" && b.listingId && !ids.includes(b.listingId)) {
      ids.push(b.listingId);
    }
  }
  return ids;
}
