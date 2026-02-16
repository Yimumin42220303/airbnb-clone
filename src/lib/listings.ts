import { prisma } from "./prisma";
import type { Prisma } from "@prisma/client";
import { getDateKeysBetween, getListingBlockedDateKeys } from "./availability";

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
  const where: Prisma.ListingWhereInput = {};

  if (filters?.location?.trim()) {
    where.location = { contains: filters.location.trim() };
  }
  if (filters?.guests != null && filters.guests > 0) {
    where.maxGuests = { gte: filters.guests };
  }
  const priceCond: { gte?: number; lte?: number } = {};
  if (filters?.minPrice != null && filters.minPrice >= 0) priceCond.gte = filters.minPrice;
  if (filters?.maxPrice != null && filters.maxPrice > 0) priceCond.lte = filters.maxPrice;
  if (Object.keys(priceCond).length > 0) where.pricePerNight = priceCond;
  let checkInDate: Date | null = null;
  let checkOutDate: Date | null = null;
  if (filters?.checkIn && filters?.checkOut) {
    const checkIn = new Date(filters.checkIn);
    const checkOut = new Date(filters.checkOut);
    if (!isNaN(checkIn.getTime()) && !isNaN(checkOut.getTime())) {
      checkInDate = checkIn;
      checkOutDate = checkOut;
      // 해당 기간에 겹치는 예약(취소 제외)이 없는 숙소만
      where.bookings = {
        none: {
          status: { not: "cancelled" },
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
      reviews: true,
      images: { orderBy: { sortOrder: "asc" } },
    },
  });

  // iCal 등 외부 blocked 날짜 필터 (Prisma로는 불가)
  let filteredListings = listings;
  if (checkInDate && checkOutDate && listings.length > 0) {
    const stayKeys = getDateKeysBetween(checkInDate, checkOutDate);
    const results = await Promise.all(
      listings.map(async (l) => {
        const blocked = await getListingBlockedDateKeys(
          l.id,
          checkInDate!,
          checkOutDate!
        );
        const hasOverlap = stayKeys.some((k) => blocked.includes(k));
        return { id: l.id, available: !hasOverlap };
      })
    );
    const availableIds = new Set(
      results.filter((r) => r.available).map((r) => r.id)
    );
    filteredListings = listings.filter((l) => availableIds.has(l.id));
  }

  let mapped = filteredListings.map((l) => {
    const reviewCount = l.reviews.length;
    const rating =
      reviewCount > 0
        ? l.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
        : null;
    const coverUrl =
      l.images.length > 0 ? l.images[0].url : l.imageUrl;
    return {
      id: l.id,
      title: l.title,
      location: l.location,
      imageUrl: coverUrl,
      price: l.pricePerNight,
      rating: rating !== null ? Math.round(rating * 100) / 100 : undefined,
      reviewCount: reviewCount > 0 ? reviewCount : undefined,
      category: l.category ? { id: l.category.id, name: l.category.name } : undefined,
      amenities: l.listingAmenities.map((la) => la.amenity.name),
      isPromoted: l.isPromoted,
      cancellationPolicy: (l.cancellationPolicy as "flexible" | "moderate" | "strict") || "flexible",
      houseRules: l.houseRules ?? "",
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
 * 숙소 상세 조회 (ID)
 */
export async function getListingById(id: string) {
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, image: true } },
      category: true,
      listingAmenities: { include: { amenity: true } },
      reviews: {
        include: {
          user: { select: { name: true, createdAt: true } },
        },
      },
      images: { orderBy: { sortOrder: "asc" } },
    },
  });

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
    isPromoted: listing.isPromoted,
    cancellationPolicy: (listing.cancellationPolicy as "flexible" | "moderate" | "strict") || "flexible",
    houseRules: listing.houseRules ?? "",
    category: listing.category ? { id: listing.category.id, name: listing.category.name } : null,
    mapUrl: listing.mapUrl ?? null,
    rating: rating !== null ? Math.round(rating * 100) / 100 : null,
    reviewCount,
    hostName: listing.user.name ?? "호스트",
    hostImage: listing.user.image ?? null,
    amenities: listing.listingAmenities.map((la) => la.amenity.name),
    icalImportUrls: parseIcalImportUrls(listing.icalImportUrls),
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
      };
    }),
  };
}

export type CreateListingInput = {
  title: string;
  location: string;
  description?: string;
  mapUrl?: string | null;
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
  isPromoted?: boolean;
  cancellationPolicy?: string;
  houseRules?: string;
  categoryId?: string | null;
  amenityIds?: string[];
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
      location: input.location.trim(),
      description: input.description?.trim() || null,
      mapUrl: input.mapUrl?.trim() || null,
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
      isPromoted: input.isPromoted ?? false,
      cancellationPolicy: input.cancellationPolicy ?? "flexible",
      houseRules: input.houseRules?.trim() || null,
      categoryId: input.categoryId?.trim() || null,
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
    /** 호스트 변경 (관리자 전용) */
    userId?: string;
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
  if (input.isPromoted != null) data.isPromoted = input.isPromoted;
  if (input.cancellationPolicy && ["flexible", "moderate", "strict"].includes(input.cancellationPolicy)) {
    data.cancellationPolicy = input.cancellationPolicy;
  }
  if (input.houseRules !== undefined) data.houseRules = input.houseRules;
  if (input.mapUrl !== undefined) {
    const trimmed = input.mapUrl?.trim();
    data.mapUrl = trimmed && trimmed.length > 0 ? trimmed : null;
  }
  if (input.categoryId !== undefined) {
    const catId = input.categoryId?.trim() || null;
    data.category = catId ? { connect: { id: catId } } : { disconnect: true };
  }
  if (options?.isAdmin && input.userId != null && input.userId.trim()) {
    const targetUser = await prisma.user.findUnique({ where: { id: input.userId } });
    if (!targetUser) {
      return { ok: false as const, error: "선택한 호스트를 찾을 수 없습니다." };
    }
    const isHost = await prisma.listing.count({ where: { userId: targetUser.id } }) > 0;
    if (!isHost) {
      return { ok: false as const, error: "선택한 사용자는 호스트가 아닙니다. (숙소를 1개 이상 보유한 사용자만 선택 가능)" };
    }
    data.user = { connect: { id: input.userId } };
  }
  if (input.icalImportUrls !== undefined) {
    const arr = Array.isArray(input.icalImportUrls)
      ? input.icalImportUrls.filter((u): u is string => typeof u === "string" && u.trim().length > 0)
      : [];
    data.icalImportUrls = JSON.stringify(arr);
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

  await prisma.listing.update({
    where: { id: listingId },
    data,
  });

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
