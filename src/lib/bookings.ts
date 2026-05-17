import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { getNightlyAvailability, hasOverlappingPaidBooking } from "./availability";
import { hasExternalBlockedOverlap } from "./ical";
import { postBeds24Booking } from "./beds24";

export type CreateBookingInput = {
  listingId: string;
  checkIn: string; // ISO date
  checkOut: string; // ISO date
  guests: number;
  userId?: string; // 없으면 기본 게스트 사용
  /** 예약 확인 페이지에서 입력한 예약자 성함 (PG 구매자명 등) */
  guestName?: string;
  guestPhone?: string; // 예약 확인 페이지 긴급연락용 전화번호 (PG 결제 시 사용)
};

/**
 * 박수 계산 (체크아웃 당일 제외)
 */
export function getNights(checkIn: Date, checkOut: Date): number {
  const diff = checkOut.getTime() - checkIn.getTime();
  return Math.max(0, Math.floor(diff / (24 * 60 * 60 * 1000)));
}

/**
 * 예약 생성 (검증 포함)
 */
export async function createBooking(input: CreateBookingInput) {
  try {
    return await createBookingCore(input);
  } catch (err) {
    console.error("[createBooking]", err instanceof Error ? err.message : err);
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      const meta = (err.meta as Record<string, unknown> | undefined) ?? {};
      console.error("[createBooking] Prisma code:", err.code, "meta:", JSON.stringify(meta));
      if (err.code === "P2002") {
        return {
          ok: false as const,
          error: "동일한 예약이 이미 처리되었을 수 있습니다. 나의 예약에서 확인해 주세요.",
        };
      }
      if (err.code === "P2003") {
        return {
          ok: false as const,
          error: "예약 정보가 올바르지 않습니다. 다시 로그인 후 시도해 주세요.",
        };
      }
    }
    if (err instanceof Prisma.PrismaClientValidationError) {
      console.error("[createBooking] Validation:", err.message.slice(0, 500));
      return {
        ok: false as const,
        error: "입력값이 올바르지 않습니다. 날짜·인원을 다시 확인해 주세요.",
      };
    }
    return {
      ok: false as const,
      error:
        "예약 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요. 문제가 계속되면 고객센터로 문의해 주세요.",
    };
  }
}

async function createBookingCore(input: CreateBookingInput) {
  const checkIn = new Date(input.checkIn);
  const checkOut = new Date(input.checkOut);

  if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
    return { ok: false as const, error: "날짜 형식이 올바르지 않습니다." };
  }
  if (checkIn >= checkOut) {
    return { ok: false as const, error: "체크아웃은 체크인 다음 날 이후여야 합니다." };
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (checkIn < today) {
    return { ok: false as const, error: "체크인은 오늘 이후로 선택해 주세요." };
  }
  if (!Number.isFinite(input.guests) || input.guests < 1 || !Number.isInteger(input.guests)) {
    return { ok: false as const, error: "인원 수가 올바르지 않습니다." };
  }

  const listing = await prisma.listing.findUnique({
    where: { id: input.listingId },
  });
  if (!listing) {
    return { ok: false as const, error: "숙소를 찾을 수 없습니다." };
  }
  if (input.guests > listing.maxGuests) {
    return { ok: false as const, error: `최대 인원은 ${listing.maxGuests}명입니다.` };
  }

  const nightsCount = getNights(checkIn, checkOut);
  const minNights = listing.minStayNights ?? 1;
  const maxNights = listing.maxStayNights ?? null;
  if (nightsCount < minNights) {
    return { ok: false as const, error: `최소 ${minNights}박 이상 예약해 주세요.` };
  }
  if (maxNights != null && nightsCount > maxNights) {
    return { ok: false as const, error: `최대 ${maxNights}박까지 예약 가능합니다.` };
  }

  const overlapping = await hasOverlappingPaidBooking(
    input.listingId,
    checkIn,
    checkOut
  );
  if (overlapping) {
    return { ok: false as const, error: "선택한 날짜에 이미 예약이 있습니다." };
  }

  const externalBlocked = await hasExternalBlockedOverlap(
    input.listingId,
    checkIn,
    checkOut
  );
  if (externalBlocked) {
    return {
      ok: false as const,
      error: "선택한 날짜는 다른 채널(에어비앤비 등)에 이미 예약되어 있습니다.",
    };
  }

  const {
    totalPrice: baseTotalPrice,
    allAvailable,
    nights: nightlyPrices,
    cleaningFee,
    baseGuests,
    extraGuestFee,
  } = await getNightlyAvailability(input.listingId, checkIn, checkOut);
  if (!allAvailable) {
    return {
      ok: false as const,
      error: "선택한 날짜 중 예약 불가한 날이 있습니다.",
    };
  }

  let userId = input.userId;
  if (!userId) {
    const guest = await prisma.user.findUnique({
      where: { email: "guest@example.com" },
    });
    if (!guest) {
      return { ok: false as const, error: "예약을 처리할 수 없습니다. (게스트 계정 없음)" };
    }
    userId = guest.id;
  } else {
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!userExists) {
      console.error("[createBooking] userId not found in DB:", userId);
      return {
        ok: false as const,
        error: "사용자 정보를 찾을 수 없습니다. 다시 로그인 후 시도해 주세요.",
      };
    }
  }

  const nights = nightlyPrices.length;

  // 추가 인원 요금 계산: (게스트 수 - 기본 포함 인원) × 1인당 1박 요금 × 박수
  const extraGuests = Math.max(0, input.guests - (baseGuests ?? listing.baseGuests ?? 2));
  const extraFeePerNight = extraGuestFee ?? listing.extraGuestFee ?? 0;
  const extraTotal = extraGuests * extraFeePerNight * nights;

  const totalPrice = Math.round(baseTotalPrice + extraTotal);
  if (!Number.isFinite(totalPrice) || totalPrice < 0) {
    return {
      ok: false as const,
      error: "요금을 계산할 수 없습니다. 날짜·인원을 다시 선택한 뒤 시도해 주세요.",
    };
  }

  const isInstant = listing.instantBooking === true;

  console.log("[createBooking] create payload:", JSON.stringify({
    listingId: input.listingId,
    userId,
    checkIn: checkIn.toISOString(),
    checkOut: checkOut.toISOString(),
    guests: input.guests,
    totalPrice,
    status: isInstant ? "confirmed" : "pending",
  }));

  const booking = await prisma.booking.create({
    data: {
      listingId: input.listingId,
      userId,
      checkIn,
      checkOut,
      guests: input.guests,
      totalPrice,
      status: isInstant ? "confirmed" : "pending",
      confirmedAt: isInstant ? new Date() : undefined,
      guestName: input.guestName?.trim() || null,
      guestPhone: input.guestPhone?.trim() || null,
    },
    include: {
      listing: { select: { title: true, location: true, beds24Enabled: true, beds24PropId: true, beds24RoomId: true } },
    },
  });

  // Beds24 전송은 결제 완료 후 syncBookingToBeds24()에서 처리 (미결제 취소 시 잘못된 예약 방지)

  return {
    ok: true as const,
    booking: {
      id: booking.id,
      checkIn: booking.checkIn.toISOString().slice(0, 10),
      checkOut: booking.checkOut.toISOString().slice(0, 10),
      guests: booking.guests,
      totalPrice: booking.totalPrice,
      nights,
      listingTitle: booking.listing.title,
      listingLocation: booking.listing.location,
      instantBooking: isInstant,
    },
  };
}

/**
 * 결제 확정 등으로 예약이 확정된 뒤 Beds24 캘린더에 예약 정보 반영.
 * payments/verify, Portone 웹훅에서 호출.
 */
export async function syncBookingToBeds24(
  bookingId: string
): Promise<{ ok: boolean; error?: string }> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      listing: {
        select: {
          beds24Enabled: true,
          beds24PropId: true,
          beds24RoomId: true,
          beds24AccountKey: true,
        },
      },
      user: { select: { name: true, email: true } },
    },
  });
  if (!booking) return { ok: false, error: "예약을 찾을 수 없습니다." };
  if (
    !booking.listing.beds24Enabled ||
    !booking.listing.beds24PropId?.trim() ||
    !booking.listing.beds24RoomId?.trim()
  ) {
    return { ok: true };
  }
  const result = await postBeds24Booking({
    propId: booking.listing.beds24PropId!,
    roomId: booking.listing.beds24RoomId!,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    guests: booking.guests,
    guestName: booking.guestName ?? booking.user?.name ?? undefined,
    guestEmail: booking.user?.email ?? undefined,
    guestPhone: booking.guestPhone ?? undefined,
    externalId: booking.id,
    accountKey: booking.listing.beds24AccountKey ?? null,
  });
  if (result.ok && result.bookId != null) {
    await prisma.booking.update({
      where: { id: bookingId },
      data: { beds24BookId: String(result.bookId) },
    });
  }
  return { ok: result.ok, error: result.error };
}
