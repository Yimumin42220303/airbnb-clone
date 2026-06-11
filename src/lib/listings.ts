import { cache } from "react";
import { prisma } from "./prisma";
import type { Prisma } from "@prisma/client";
import {
  getDateKeysBetween,
  getListingBlockedDateKeys,
  listingSlotOccupiedWhere,
} from "./availability";
import { STORED_CURRENCY, convertKrwToJpy } from "./currency";
import { mapWithConcurrency } from "./map-with-concurrency";
import { getNights } from "./bookings";

/** 날짜 필터 시 숙소별 iCal/Beds24 조회 동시 실행 상한 */
const LISTING_AVAILABILITY_CHECK_CONCURRENCY = 6;

function parseIcalImportUrls(json: string | null): string[] {
  if (!json?.trim()) return [];
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr.filter((u): u is string => typeof u === "string" && u.trim().length > 0) : [];
  } catch {
    return [];
  }
}

export type ListingFilters = {
  location?: string;
  guests?: number;
  minPrice?: number;
  maxPrice?: number;
  checkIn?: string;
  checkOut?: string;
  /** 정렬: price_asc | price_desc | newest | rating */
  sort?: string;
};

/**
 * 숙소 목록 조회 (홈/검색용)
 * 필터: 지역(부분일치), 인원(maxGuests 이상), 가격 범위, 예약 가능 날짜
 */
export async function getListings(filters?: ListingFilters) {
  const where: Prisma.ListingWhereInput = { status: "approved", hidden: false };

  if (filters?.location?.trim()) {
    where.location = { contains: filters.location.trim() };
  }
  if (filters?.guests != null && filters.guests > 0) {
    where.maxGuests = { gte: filters.guests };
  }
  const priceCond: { gte?: number; lte?: number } = {};
  // 가격 필터: 게스트는 KRW로 입력. 저장 통화가 JPY면 KRW→JPY 변환
  if (filters?.minPrice != null && filters.minPrice >= 0) {
    priceCond.gte = STORED_CURRENCY === "JPY" ? convertKrwToJpy(filters.minPrice) : filters.minPrice;
  }
  if (filters?.maxPrice != null && filters.maxPrice > 0) {
    priceCond.lte = STORED_CURRENCY === "JPY" ? convertKrwToJpy(filters.maxPrice) : filters.maxPrice;
  }
  if (Object.keys(priceCond).length > 0) where.pricePerNight = priceCond;
  let checkInDate: Date | null = null;
  let checkOutDate: Date | null = null;
  if (filters?.checkIn && filters?.checkOut) {
    const checkIn = new Date(filters.checkIn);
    const checkOut = new Date(filters.checkOut);
    if (!isNaN(checkIn.getTime()) && !isNaN(checkOut.getTime())) {
      checkInDate = checkIn;
      checkOutDate = checkOut;
      // 해당 기간에 결제 완료 확정 예약과 겹치지 않는 숙소만
      where.bookings = {
        none: {
          ...listingSlotOccupiedWhere,
          checkIn: { lt: checkOut },
          checkOut: { gt: checkIn },
        },
      };
      // 수동 막힘(availability)이 없는 숙소만
      const dateKeys = getDateKeysBetween(checkIn, checkOut);
      if (dateKeys.length > 0) {
        where.availability = {
          none: {
            date: { in: dateKeys },
            available: false,
          },
        };
      }
      // 최소/최대 숙박 일수 필터: 요청한 박수가 숙소 정책 범위 밖이면 결과에서 제외.
      // null(미설정)은 제약 없음으로 간주. (예약 시점 검증 getNights 와 동일한 박수)
      const nightsCount = getNights(checkIn, checkOut);
      if (nightsCount >= 1) {
        const stayConditions: Prisma.ListingWhereInput[] = [
          {
            OR: [
              { minStayNights: null },
              { minStayNights: { lte: nightsCount } },
            ],
          },
          {
            OR: [
              { maxStayNights: null },
              { maxStayNights: { gte: nightsCount } },
            ],
          },
        ];
        const existingAnd = where.AND;
        where.AND = existingAnd
          ? Array.isArray(existingAnd)
            ? [...existingAnd, ...stayConditions]
            : [existingAnd, ...stayConditions]
          : stayConditions;
      }
    }
  }

  const orderBy: Prisma.ListingOrderByWithRelationInput[] =
    filters?.sort === "price_asc"
      ? [{ pricePerNight: "asc" }]
      : filters?.sort === "price_desc"
        ? [{ pricePerNight: "desc" }]
        : [{ createdAt: "desc" }];

  const listings = await prisma.listing.findMany({
    where,
    orderBy,
    include: {
      category: true,
      listingAmenities: { include: { amenity: true } },
      _count: { select: { reviews: true } },
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
    },
  });

  const listingIds = listings.map((l) => l.id);
  const ratingAggs = listingIds.length > 0
    ? await prisma.review.groupBy({
        by: ["listingId"],
        where: { listingId: { in: listingIds } },
        _avg: { rating: true },
      })
    : [];
  const ratingMap = new Map(ratingAggs.map((r) => [r.listingId, r._avg.rating]));

  // iCal 등 외부 blocked 날짜 필터 (Prisma로는 불가)
  let filteredListings = listings;
  if (checkInDate && checkOutDate && listings.length > 0) {
    const stayKeys = getDateKeysBetween(checkInDate, checkOutDate);
    const results = await mapWithConcurrency(
      listings,
      LISTING_AVAILABILITY_CHECK_CONCURRENCY,
      async (l) => {
        const blocked = await getListingBlockedDateKeys(
          l.id,
          checkInDate!,
          checkOutDate!
        );
        const hasOverlap = stayKeys.some((k) => blocked.includes(k));
        return { id: l.id, available: !hasOverlap };
      }
    );
    const availableIds = new Set(
      results.filter((r) => r.available).map((r) => r.id)
    );
    filteredListings = listings.filter((l) => availableIds.has(l.id));
  }

  let mapped = filteredListings.map((l) => {
    const reviewCount = l._count.reviews;
    const avgRating = ratingMap.get(l.id) ?? null;
    const rating = avgRating !== null ? Math.round(avgRating * 100) / 100 : null;
    const coverUrl =
      l.images.length > 0 ? l.images[0].url : l.imageUrl;
    return {
      id: l.id,
      title: l.title,
      location: l.location,
      imageUrl: coverUrl,
      price: l.pricePerNight,
      rating: rating !== null ? rating : undefined,
      reviewCount: reviewCount > 0 ? reviewCount : undefined,
      category: l.category ? { id: l.category.id, name: l.category.name } : undefined,
      amenities: l.listingAmenities.map((la) => la.amenity.name),
      isPromoted: l.isPromoted,
      isVerified: (l as Record<string, unknown>).isVerified === true,
      listingCreatedAt: l.createdAt.toISOString(),
      cancellationPolicy: (l.cancellationPolicy as "flexible" | "moderate" | "strict") || "flexible",
      houseRules: l.houseRules ?? "",
      bedrooms: l.bedrooms,
      maxGuests: l.maxGuests,
      beds: l.beds,
    };
  });

  if (filters?.sort === "rating") {
    mapped = [...mapped].sort((a, b) => {
      const ra = a.rating ?? 0;
      const rb = b.rating ?? 0;
      return rb - ra;
    });
  }

  return mapped;
}

/**
 * 숙소 수정 폼용 조회 (리뷰 제외 — Review 테이블 스키마 변경 영향 없음)
 */
export async function getListingByIdForEdit(id: string) {
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, image: true } },
      category: true,
      listingAmenities: { include: { amenity: true } },
      images: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!listing) return null;
  const allImages = listing.images.length > 0
    ? listing.images.map((i) => ({ id: i.id, url: i.url, sortOrder: i.sortOrder }))
    : [{ id: "main" as const, url: listing.imageUrl, sortOrder: 0 }];
  const imageUrl = allImages[0].url;
  return {
    id: listing.id,
    title: listing.title,
    hostDisplayName: listing.hostDisplayName ?? null,
    location: listing.location,
    description: listing.description,
    imageUrl,
    images: allImages,
    pricePerNight: listing.pricePerNight,
    cleaningFee: listing.cleaningFee ?? 0,
    baseGuests: listing.baseGuests ?? 2,
    maxGuests: listing.maxGuests,
    extraGuestFee: listing.extraGuestFee ?? 0,
    januaryFactor: listing.januaryFactor ?? 1,
    februaryFactor: listing.februaryFactor ?? 1,
    marchFactor: listing.marchFactor ?? 1,
    aprilFactor: listing.aprilFactor ?? 1,
    mayFactor: listing.mayFactor ?? 1,
    juneFactor: listing.juneFactor ?? 1,
    julyFactor: listing.julyFactor ?? 1,
    augustFactor: listing.augustFactor ?? 1,
    septemberFactor: listing.septemberFactor ?? 1,
    octoberFactor: listing.octoberFactor ?? 1,
    novemberFactor: listing.novemberFactor ?? 1,
    decemberFactor: listing.decemberFactor ?? 1,
    bedrooms: listing.bedrooms,
    beds: listing.beds,
    baths: listing.baths,
    areaSqm: listing.areaSqm ?? null,
    bathroomToiletSeparate: listing.bathroomToiletSeparate ?? false,
    isPromoted: listing.isPromoted,
    instantBooking: listing.instantBooking ?? false,
    cancellationPolicy: (listing.cancellationPolicy as "flexible" | "moderate" | "strict") || "flexible",
    houseRules: listing.houseRules ?? "",
    category: listing.category ? { id: listing.category.id, name: listing.category.name } : null,
    mapUrl: listing.mapUrl ?? null,
    videoUrl: listing.videoUrl ?? null,
    amenities: listing.listingAmenities.map((la) => la.amenity.name),
    icalImportUrls: parseIcalImportUrls(listing.icalImportUrls),
    propertyType: listing.propertyType ?? "apartment",
    beds24Enabled: listing.beds24Enabled ?? false,
    beds24PropId: listing.beds24PropId ?? null,
    beds24RoomId: listing.beds24RoomId ?? null,
    beds24OfferIndex: listing.beds24OfferIndex ?? null,
    beds24AccountKey: listing.beds24AccountKey ?? null,
    beds24PriceMultiplier: listing.beds24PriceMultiplier ?? null,
    beds24JanuaryFactor: listing.beds24JanuaryFactor ?? 1,
    beds24FebruaryFactor: listing.beds24FebruaryFactor ?? 1,
    beds24MarchFactor: listing.beds24MarchFactor ?? 1,
    beds24AprilFactor: listing.beds24AprilFactor ?? 1,
    beds24MayFactor: listing.beds24MayFactor ?? 1,
    beds24JuneFactor: listing.beds24JuneFactor ?? 1,
    beds24JulyFactor: listing.beds24JulyFactor ?? 1,
    beds24AugustFactor: listing.beds24AugustFactor ?? 1,
    beds24SeptemberFactor: listing.beds24SeptemberFactor ?? 1,
    beds24OctoberFactor: listing.beds24OctoberFactor ?? 1,
    beds24NovemberFactor: listing.beds24NovemberFactor ?? 1,
    beds24DecemberFactor: listing.beds24DecemberFactor ?? 1,
    minStayNights: listing.minStayNights ?? null,
    maxStayNights: listing.maxStayNights ?? null,
    hidden: listing.hidden ?? false,
    checkInTime: listing.checkInTime ?? null,
    checkOutTime: listing.checkOutTime ?? null,
  };
}

/**
 * 숙소 상세 조회 (ID) — 승인된 숙소만. 게스트용 상세/예약 확인에서 사용.
 * React cache: 동일 요청 내 generateMetadata + page 등 중복 호출 시 DB 1회만 조회.
 */
export const getListingById = cache(async function getListingById(id: string) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [listing, recentBookingCount] = await Promise.all([
    prisma.listing.findFirst({
      where: { id, status: "approved", hidden: false },
      include: {
        user: { select: { name: true, image: true } },
        category: true,
        listingAmenities: { include: { amenity: true } },
        reviews: {
          orderBy: { createdAt: "desc" },
          include: {
            user: { select: { name: true, createdAt: true } },
            images: { orderBy: { sortOrder: "asc" } },
          },
        },
        images: { orderBy: { sortOrder: "asc" } },
      },
    }),
    prisma.booking.count({
      where: {
        listingId: id,
        status: "confirmed",
        createdAt: { gte: thirtyDaysAgo },
      },
    }),
  ]);

  if (!listing) return null;

  const reviewCount = listing.reviews.length;
  const rating =
    reviewCount > 0
      ? listing.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
      : null;
  const allImages = listing.images.length > 0
    ? listing.images.map((i) => ({ id: i.id, url: i.url, sortOrder: i.sortOrder }))
    : [{ id: "main", url: listing.imageUrl, sortOrder: 0 }];
  const imageUrl = allImages[0].url;

  return {
    id: listing.id,
    title: listing.title,
    location: listing.location,
    description: listing.description,
    imageUrl,
    images: allImages,
    pricePerNight: listing.pricePerNight,
    cleaningFee: listing.cleaningFee ?? 0,
    baseGuests: listing.baseGuests ?? 2,
    maxGuests: listing.maxGuests,
    extraGuestFee: listing.extraGuestFee ?? 0,
    januaryFactor: listing.januaryFactor ?? 1,
    februaryFactor: listing.februaryFactor ?? 1,
    marchFactor: listing.marchFactor ?? 1,
    aprilFactor: listing.aprilFactor ?? 1,
    mayFactor: listing.mayFactor ?? 1,
    juneFactor: listing.juneFactor ?? 1,
    julyFactor: listing.julyFactor ?? 1,
    augustFactor: listing.augustFactor ?? 1,
    septemberFactor: listing.septemberFactor ?? 1,
    octoberFactor: listing.octoberFactor ?? 1,
    novemberFactor: listing.novemberFactor ?? 1,
    decemberFactor: listing.decemberFactor ?? 1,
    bedrooms: listing.bedrooms,
    beds: listing.beds,
    baths: listing.baths,
    areaSqm: listing.areaSqm ?? null,
    bathroomToiletSeparate: listing.bathroomToiletSeparate ?? false,
    propertyType: listing.propertyType ?? "apartment",
    isPromoted: listing.isPromoted,
    instantBooking: listing.instantBooking ?? false,
    cancellationPolicy: (listing.cancellationPolicy as "flexible" | "moderate" | "strict") || "flexible",
    houseRules: listing.houseRules ?? "",
    category: listing.category ? { id: listing.category.id, name: listing.category.name } : null,
    mapUrl: listing.mapUrl ?? null,
    videoUrl: listing.videoUrl ?? null,
    rating: rating !== null ? Math.round(rating * 100) / 100 : null,
    reviewCount,
    hostName: listing.user.name ?? "호스트",
    hostImage: listing.user.image ?? null,
    amenities: listing.listingAmenities.map((la) => la.amenity.name),
    icalImportUrls: parseIcalImportUrls(listing.icalImportUrls),
    minStayNights: listing.minStayNights ?? null,
    maxStayNights: listing.maxStayNights ?? null,
    checkInTime: listing.checkInTime ?? null,
    checkOutTime: listing.checkOutTime ?? null,
    checkInMethod: listing.checkInMethod ?? null,
    infoVerifiedAt: listing.infoVerifiedAt?.toISOString() ?? null,
    verifiedAt: listing.verifiedAt?.toISOString() ?? null,
    licenseType: listing.licenseType ?? null,
    licenseNumber: listing.licenseNumber ?? null,
    isVerified: listing.isVerified === true,
    recentBookingCount,
    listingCreatedAt: listing.createdAt.toISOString(),
    reviews: listing.reviews.map((r) => {
      const joined = r.user.createdAt
        ? new Date(r.user.createdAt).getFullYear()
        : null;
      const now = new Date().getFullYear();
      const membershipYears =
        joined != null ? Math.max(1, now - joined) : null;
      return {
        rating: r.rating,
        body: r.body,
        userName: r.authorDisplayName ?? r.user.name,
        createdAt: r.createdAt.toISOString(),
        membershipYears,
        images: r.images?.map((img: { url: string }) => img.url) ?? [],
      };
    }),
  };
});

export type CreateListingInput = {
  title: string;
  /** 管理者・ホストがダッシュボードで識別するための表示名（日本語可） */
  hostDisplayName?: string | null;
  location: string;
  description?: string;
  mapUrl?: string | null;
  /** 숙소 소개 영상 URL (자체 업로드, 50MB 이하, 9:16 권장) */
  videoUrl?: string | null;
  pricePerNight: number;
  cleaningFee?: number;
  imageUrl?: string;
  imageUrls?: string[];
  baseGuests?: number;
  maxGuests?: number;
  extraGuestFee?: number;
  januaryFactor?: number;
  februaryFactor?: number;
  marchFactor?: number;
  aprilFactor?: number;
  mayFactor?: number;
  juneFactor?: number;
  julyFactor?: number;
  augustFactor?: number;
  septemberFactor?: number;
  octoberFactor?: number;
  novemberFactor?: number;
  decemberFactor?: number;
  bedrooms?: number;
  beds?: number;
  baths?: number;
  /** 전용 면적 (㎡). 선택 */
  areaSqm?: number | null;
  /** 화장실·욕실 분리 여부 */
  bathroomToiletSeparate?: boolean;
  isPromoted?: boolean;
  cancellationPolicy?: string;
  houseRules?: string;
  categoryId?: string | null;
  amenityIds?: string[];
  /** "detached_house" | "apartment" */
  propertyType?: string | null;
  /** 즉시 예약 허용 */
  instantBooking?: boolean;
  /** 최소 숙박 일수. null=1박 */
  minStayNights?: number | null;
  /** 최대 숙박 일수. null=제한 없음 */
  maxStayNights?: number | null;
  /** 체크인 시간 (HH:mm). 선택 */
  checkInTime?: string | null;
  /** 체크아웃 시간 (HH:mm). 선택 */
  checkOutTime?: string | null;
  /** OTA에서 숨기기 (검색·상세 노출 제외) */
  hidden?: boolean;
};

/**
 * 숙소 등록 (호스트)
 */
export async function createListing(
  userId: string,
  input: CreateListingInput
) {
  if (!input.title?.trim()) {
    return { ok: false as const, error: "숙소명을 입력해 주세요." };
  }
  if (!input.location?.trim()) {
    return { ok: false as const, error: "위치를 입력해 주세요." };
  }
  if (input.pricePerNight == null || input.pricePerNight < 0) {
    return { ok: false as const, error: "1박 요금을 입력해 주세요." };
  }
  const urls =
    input.imageUrls?.filter((u) => typeof u === "string" && u.trim()) ??
    (input.imageUrl?.trim() ? [input.imageUrl.trim()] : []);
  if (urls.length === 0) {
    return { ok: false as const, error: "이미지 URL을 1개 이상 입력해 주세요." };
  }
  const imageUrl = urls[0];

  const listing = await prisma.listing.create({
    data: {
      userId,
      title: input.title.trim(),
      hostDisplayName: input.hostDisplayName?.trim() || null,
      location: input.location.trim(),
      description: input.description?.trim() || null,
      mapUrl: input.mapUrl?.trim() || null,
      videoUrl: input.videoUrl?.trim() || null,
      pricePerNight: input.pricePerNight,
      cleaningFee: input.cleaningFee ?? 0,
      imageUrl,
      baseGuests: input.baseGuests ?? 2,
      maxGuests: input.maxGuests ?? 2,
      extraGuestFee: input.extraGuestFee ?? 0,
      januaryFactor: input.januaryFactor ?? 1,
      februaryFactor: input.februaryFactor ?? 1,
      marchFactor: input.marchFactor ?? 1,
      aprilFactor: input.aprilFactor ?? 1,
      mayFactor: input.mayFactor ?? 1,
      juneFactor: input.juneFactor ?? 1,
      julyFactor: input.julyFactor ?? 1,
      augustFactor: input.augustFactor ?? 1,
      septemberFactor: input.septemberFactor ?? 1,
      octoberFactor: input.octoberFactor ?? 1,
      novemberFactor: input.novemberFactor ?? 1,
      decemberFactor: input.decemberFactor ?? 1,
      bedrooms: input.bedrooms ?? 1,
      beds: input.beds ?? 1,
      baths: input.baths ?? 1,
      areaSqm: input.areaSqm != null && input.areaSqm > 0 ? input.areaSqm : null,
      bathroomToiletSeparate: input.bathroomToiletSeparate ?? false,
      isPromoted: input.isPromoted ?? false,
      instantBooking: input.instantBooking ?? false,
      cancellationPolicy: input.cancellationPolicy ?? "flexible",
      houseRules: input.houseRules?.trim() || null,
      categoryId: input.categoryId?.trim() || null,
      propertyType: input.propertyType === "detached_house" || input.propertyType === "apartment" ? input.propertyType : "apartment",
      status: "pending", // 어드민 승인 후 게재
      hidden: input.hidden ?? false,
      minStayNights: input.minStayNights != null && input.minStayNights >= 1 ? input.minStayNights : null,
      maxStayNights: input.maxStayNights != null && input.maxStayNights >= 1 ? input.maxStayNights : null,
      checkInTime: input.checkInTime?.trim() && /^\d{1,2}:\d{2}$/.test(input.checkInTime.trim()) ? input.checkInTime.trim() : null,
      checkOutTime: input.checkOutTime?.trim() && /^\d{1,2}:\d{2}$/.test(input.checkOutTime.trim()) ? input.checkOutTime.trim() : null,
    },
  });

  await prisma.listingImage.createMany({
    data: urls.map((url, i) => ({
      listingId: listing.id,
      url,
      sortOrder: i,
    })),
  });

  if (input.amenityIds?.length) {
    await prisma.listingAmenity.createMany({
      data: input.amenityIds.map((amenityId) => ({
        listingId: listing.id,
        amenityId,
      })),
    });
  }

  return {
    ok: true as const,
    listing: {
      id: listing.id,
      title: listing.title,
      location: listing.location,
    },
  };
}

export type UpdateListingInput = Partial<
  Omit<CreateListingInput, "title"> & {
    title?: string;
    /** OTA/PMS 캘린더 Import용 ICS URL 목록 (중복 예약 방지). 추후 Beds24 API 연동 시 동일 파이프라인 사용 */
    icalImportUrls?: string[];
    /** Beds24 API V2 연동 */
    beds24Enabled?: boolean;
    beds24PropId?: string | null;
    beds24RoomId?: string | null;
    beds24OfferIndex?: number | null;
    /** Beds24 계정 식별자 (관리자 전용). 값이 있으면 BEDS24_REFRESH_TOKEN_{key} 사용 */
    beds24AccountKey?: string | null;
    /** Beds24 가격 배율. 1=그대로, 0.5=-50% */
    beds24PriceMultiplier?: number | null;
    /** Beds24 가격 배율 월별 (미설정 시 beds24PriceMultiplier 또는 1) */
    beds24JanuaryFactor?: number | null;
    beds24FebruaryFactor?: number | null;
    beds24MarchFactor?: number | null;
    beds24AprilFactor?: number | null;
    beds24MayFactor?: number | null;
    beds24JuneFactor?: number | null;
    beds24JulyFactor?: number | null;
    beds24AugustFactor?: number | null;
    beds24SeptemberFactor?: number | null;
    beds24OctoberFactor?: number | null;
    beds24NovemberFactor?: number | null;
    beds24DecemberFactor?: number | null;
    /** 즉시 예약 허용 */
    instantBooking?: boolean;
    /** OTA에서 숨기기 */
    hidden?: boolean;
    /** 호스트 변경 (관리자 전용) */
    userId?: string;
    minStayNights?: number | null;
    maxStayNights?: number | null;
    checkInTime?: string | null;
    checkOutTime?: string | null;
  }
>;

export type UpdateListingOptions = {
  /** 관리자 모드: 소유자 검사 생략, userId 변경 허용 */
  isAdmin?: boolean;
};

/**
 * 숙소 수정 (본인 숙소만, 관리자는 타인 숙소도 수정 가능)
 */
export async function updateListing(
  listingId: string,
  userId: string,
  input: UpdateListingInput,
  options?: UpdateListingOptions
) {
  const existing = await prisma.listing.findUnique({
    where: { id: listingId },
  });
  if (!existing) {
    return { ok: false as const, error: "숙소를 찾을 수 없습니다." };
  }
  if (!options?.isAdmin && existing.userId !== userId) {
    return { ok: false as const, error: "수정 권한이 없습니다." };
  }

  const data: Prisma.ListingUpdateInput = {};
  if (input.title != null) data.title = input.title.trim();
  if (input.hostDisplayName !== undefined) data.hostDisplayName = input.hostDisplayName?.trim() || null;
  if (input.location != null) data.location = input.location.trim();
  if (input.description != null) data.description = input.description.trim() || null;
  if (input.pricePerNight != null) data.pricePerNight = input.pricePerNight;
  if (input.cleaningFee != null) data.cleaningFee = Math.max(0, input.cleaningFee);
  if (input.baseGuests != null) data.baseGuests = input.baseGuests;
  if (input.maxGuests != null) data.maxGuests = input.maxGuests;
  if (input.extraGuestFee != null) data.extraGuestFee = Math.max(0, input.extraGuestFee);
  if (input.januaryFactor != null) data.januaryFactor = input.januaryFactor;
  if (input.februaryFactor != null) data.februaryFactor = input.februaryFactor;
  if (input.marchFactor != null) data.marchFactor = input.marchFactor;
  if (input.aprilFactor != null) data.aprilFactor = input.aprilFactor;
  if (input.mayFactor != null) data.mayFactor = input.mayFactor;
  if (input.juneFactor != null) data.juneFactor = input.juneFactor;
  if (input.julyFactor != null) data.julyFactor = input.julyFactor;
  if (input.augustFactor != null) data.augustFactor = input.augustFactor;
  if (input.septemberFactor != null) data.septemberFactor = input.septemberFactor;
  if (input.octoberFactor != null) data.octoberFactor = input.octoberFactor;
  if (input.novemberFactor != null) data.novemberFactor = input.novemberFactor;
  if (input.decemberFactor != null) data.decemberFactor = input.decemberFactor;
  if (input.bedrooms != null) data.bedrooms = input.bedrooms;
  if (input.beds != null) data.beds = input.beds;
  if (input.baths != null) data.baths = input.baths;
  if (input.areaSqm !== undefined) {
    data.areaSqm = input.areaSqm != null && input.areaSqm > 0 ? input.areaSqm : null;
  }
  if (input.bathroomToiletSeparate !== undefined) data.bathroomToiletSeparate = input.bathroomToiletSeparate;
  if (input.isPromoted != null) data.isPromoted = input.isPromoted;
  if (input.cancellationPolicy && ["flexible", "moderate", "strict"].includes(input.cancellationPolicy)) {
    data.cancellationPolicy = input.cancellationPolicy;
  }
  if (input.houseRules !== undefined) data.houseRules = input.houseRules;
  if (input.mapUrl !== undefined) {
    const trimmed = input.mapUrl?.trim();
    data.mapUrl = trimmed && trimmed.length > 0 ? trimmed : null;
  }
  if (input.videoUrl !== undefined) {
    const trimmed = input.videoUrl?.trim();
    data.videoUrl = trimmed && trimmed.length > 0 ? trimmed : null;
  }
  if (input.categoryId !== undefined) {
    const catId = input.categoryId?.trim() || null;
    data.category = catId ? { connect: { id: catId } } : { disconnect: true };
  }
  if (input.propertyType !== undefined) {
    data.propertyType = input.propertyType === "detached_house" || input.propertyType === "apartment" ? input.propertyType : null;
  }
  if (options?.isAdmin && input.userId != null && input.userId.trim()) {
    const targetUser = await prisma.user.findUnique({ where: { id: input.userId } });
    if (!targetUser) {
      return { ok: false as const, error: "선택한 사용자를 찾을 수 없습니다." };
    }
    data.user = { connect: { id: input.userId } };
  }
  if (input.icalImportUrls !== undefined) {
    const arr = Array.isArray(input.icalImportUrls)
      ? input.icalImportUrls.filter((u): u is string => typeof u === "string" && u.trim().length > 0)
      : [];
    data.icalImportUrls = JSON.stringify(arr);
  }
  if (input.instantBooking !== undefined) data.instantBooking = input.instantBooking;
  if (input.hidden !== undefined) data.hidden = input.hidden;
  if (input.beds24Enabled !== undefined) data.beds24Enabled = input.beds24Enabled;
  if (input.beds24PropId !== undefined) data.beds24PropId = input.beds24PropId?.trim() || null;
  if (input.beds24RoomId !== undefined) data.beds24RoomId = input.beds24RoomId?.trim() || null;
  if (input.beds24AccountKey !== undefined) {
    // 관리자 전용 필드. API 레이어에서 권한 검증 후 호출되므로 여기서는 값 정규화만 수행.
    const raw = input.beds24AccountKey;
    if (raw == null || (typeof raw === "string" && raw.trim() === "")) {
      data.beds24AccountKey = null;
    } else if (typeof raw === "string") {
      const normalized = raw.trim().toUpperCase();
      if (/^[A-Z0-9_]{1,64}$/.test(normalized)) {
        data.beds24AccountKey = normalized;
      } else {
        return {
          ok: false as const,
          error: "Beds24 Account Key는 영문 대문자, 숫자, 밑줄(_) 1~64자만 허용됩니다.",
        };
      }
    }
  }
  if (input.beds24OfferIndex !== undefined) {
    const v = input.beds24OfferIndex;
    data.beds24OfferIndex = v != null ? Math.min(16, Math.max(1, Number(v))) : null;
  }
  if (input.beds24PriceMultiplier !== undefined) {
    const v = input.beds24PriceMultiplier;
    const num = v != null ? Number(v) : null;
    data.beds24PriceMultiplier = num != null && num > 0 ? num : null;
  }
  const setBeds24MonthFactor = (key: string, value: number | null | undefined) => {
    if (value === undefined) return;
    const num = value != null ? Number(value) : null;
    (data as Record<string, unknown>)[key] = num != null && num > 0 ? num : null;
  };
  setBeds24MonthFactor("beds24JanuaryFactor", input.beds24JanuaryFactor);
  setBeds24MonthFactor("beds24FebruaryFactor", input.beds24FebruaryFactor);
  setBeds24MonthFactor("beds24MarchFactor", input.beds24MarchFactor);
  setBeds24MonthFactor("beds24AprilFactor", input.beds24AprilFactor);
  setBeds24MonthFactor("beds24MayFactor", input.beds24MayFactor);
  setBeds24MonthFactor("beds24JuneFactor", input.beds24JuneFactor);
  setBeds24MonthFactor("beds24JulyFactor", input.beds24JulyFactor);
  setBeds24MonthFactor("beds24AugustFactor", input.beds24AugustFactor);
  setBeds24MonthFactor("beds24SeptemberFactor", input.beds24SeptemberFactor);
  setBeds24MonthFactor("beds24OctoberFactor", input.beds24OctoberFactor);
  setBeds24MonthFactor("beds24NovemberFactor", input.beds24NovemberFactor);
  setBeds24MonthFactor("beds24DecemberFactor", input.beds24DecemberFactor);
  if (input.minStayNights !== undefined) {
    const v = input.minStayNights;
    data.minStayNights = v != null && v >= 1 ? v : null;
  }
  if (input.maxStayNights !== undefined) {
    const v = input.maxStayNights;
    data.maxStayNights = v != null && v >= 1 ? v : null;
  }
  if (input.checkInTime !== undefined) {
    const s = input.checkInTime?.trim();
    data.checkInTime = s && /^\d{1,2}:\d{2}$/.test(s) ? s : null;
  }
  if (input.checkOutTime !== undefined) {
    const s = input.checkOutTime?.trim();
    data.checkOutTime = s && /^\d{1,2}:\d{2}$/.test(s) ? s : null;
  }

  if (input.imageUrls !== undefined) {
    const urls = input.imageUrls.filter((u) => typeof u === "string" && u.trim());
    if (urls.length > 0) {
      data.imageUrl = urls[0];
      await prisma.listingImage.deleteMany({ where: { listingId } });
      await prisma.listingImage.createMany({
        data: urls.map((url, i) => ({ listingId, url, sortOrder: i })),
      });
    }
  } else if (input.imageUrl != null && input.imageUrl.trim()) {
    data.imageUrl = input.imageUrl.trim();
  }

  if (Object.keys(data).length > 0) {
    await prisma.listing.update({
      where: { id: listingId },
      data,
    });
  }

  if (input.amenityIds) {
    await prisma.listingAmenity.deleteMany({ where: { listingId } });
    if (input.amenityIds.length) {
      await prisma.listingAmenity.createMany({
        data: input.amenityIds.map((amenityId) => ({ listingId, amenityId })),
      });
    }
  }

  return { ok: true as const };
}

/**
 * 숙소 삭제 (본인 숙소 또는 어드민)
 */
export async function deleteListing(listingId: string, userId: string, isAdmin = false) {
  const existing = await prisma.listing.findUnique({
    where: { id: listingId },
  });
  if (!existing) {
    return { ok: false as const, error: "숙소를 찾을 수 없습니다." };
  }
  if (existing.userId !== userId && !isAdmin) {
    return { ok: false as const, error: "삭제 권한이 없습니다." };
  }
  await prisma.listing.delete({ where: { id: listingId } });
  return { ok: true as const };
}
