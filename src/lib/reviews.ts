import { prisma } from "./prisma";

/**
 * 리뷰 작성 가능 여부: 어드민 또는 해당 숙소 숙박 완료(체크아웃 경과)한 게스트만
 * - 관리자인 경우: 항상 허용, 이후 createReview에서 중복 리뷰도 허용
 * - 일반 게스트인 경우: 숙박 완료 여부 체크 + 숙소당 1인 1리뷰 유지
 */
export async function canUserReview(
  listingId: string,
  userId: string
): Promise<{ allowed: boolean; reason?: string; isAdmin: boolean }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) {
    return {
      allowed: false,
      reason: "사용자를 찾을 수 없습니다.",
      isAdmin: false,
    };
  }

  if (user.role === "admin") {
    return { allowed: true, isAdmin: true };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const completedBooking = await prisma.booking.findFirst({
    where: {
      listingId,
      userId,
      status: "confirmed",
      checkOut: { lt: today },
    },
  });

  if (!completedBooking) {
    return {
      allowed: false,
      reason: "이 숙소의 숙박을 완료한 게스트만 리뷰를 작성할 수 있습니다.",
      isAdmin: false,
    };
  }

  return { allowed: true, isAdmin: false };
}

/**
 * 리뷰 작성 (어드민 또는 숙박 완료 게스트)
 * - 관리자(admin): 같은 숙소에 여러 개의 리뷰 작성 가능
 * - 일반 게스트: 숙소당 1인 1리뷰 유지
 */
export async function createReview(
  listingId: string,
  userId: string,
  rating: number,
  body?: string
) {
  if (rating < 1 || rating > 5) {
    return { ok: false as const, error: "평점은 1~5 사이로 선택해 주세요." };
  }

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
  });
  if (!listing) {
    return { ok: false as const, error: "숙소를 찾을 수 없습니다." };
  }

  const { allowed, reason, isAdmin } = await canUserReview(listingId, userId);
  if (!allowed) {
    return { ok: false as const, error: reason ?? "리뷰 작성 권한이 없습니다." };
  }

  // 일반 게스트인 경우에만 "숙소당 1인 1리뷰" 제한 유지
  if (!isAdmin) {
    const existing = await prisma.review.findFirst({
      where: {
        listingId,
        userId,
      },
    });
    if (existing) {
      return {
        ok: false as const,
        error: "이미 이 숙소에 리뷰를 작성하셨습니다.",
      };
    }
  }

  const review = await prisma.review.create({
    data: {
      listingId,
      userId,
      rating,
      body: body?.trim() || null,
    },
  });

  return {
    ok: true as const,
    review: {
      id: review.id,
      rating: review.rating,
      body: review.body,
      createdAt: review.createdAt,
    },
  };
}
