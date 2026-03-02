import { prisma } from "./prisma";
import { getNightlyAvailability } from "./availability";
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
 * 해당 기간에 겹치는 예약이 있는지
 */
async function hasOverlappingBooking(
  listingId: string,
  checkIn: Date,
  checkOut: Date
): Promise<boolean> {
  const overlap = await prisma.booking.findFirst({
    where: {
      listingId,
      status: { not: "cancelled" },
      checkIn: { lt: checkOut },
      checkOut: { gt: checkIn },
    },
  });
  return !!overlap;
}

/**
 * 예약 생성 (검증 포함)
 */
export async function createBooking(input: CreateBookingInput) {
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
  if (input.guests < 1) {
    return { ok: false as const, error: "인원은 1명 이상이어야 합니다." };
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

  const overlapping = await hasOverlappingBooking(
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
  }

  const nights = nightlyPrices.length;

  // 추가 인원 요금 계산: (게스트 수 - 기본 포함 인원) × 1인당 1박 요금 × 박수
  const extraGuests = Math.max(0, input.guests - (baseGuests ?? listing.baseGuests ?? 2));
  const extraFeePerNight = extraGuestFee ?? listing.extraGuestFee ?? 0;
  const extraTotal = extraGuests * extraFeePerNight * nights;

  const totalPrice = baseTotalPrice + extraTotal;

  const isInstant = listing.instantBooking === true;

  const booking = await prisma.booking.create({
    data: {
      listingId: input.listingId,
      userId,
      checkIn,
      checkOut,
      guests: input.guests,
      totalPrice,
      status: isInstant ? "confirmed" : "pending",
      guestName: input.guestName?.trim() || null,
      guestPhone: input.guestPhone?.trim() || null,
    },
    include: {
      listing: { select: { title: true, location: true, beds24Enabled: true, beds24PropId: true, beds24RoomId: true } },
    },
  });

  // Beds24: 즉시 예약(확정)인 경우에만 생성 시점에 전송. 결제 후 확정은 payments/verify·웹훅에서 전송.
  if (
    isInstant &&
    booking.listing.beds24Enabled &&
    booking.listing.beds24PropId?.trim() &&
    booking.listing.beds24RoomId?.trim()
  ) {
    const guestUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });
    const result = await postBeds24Booking({
      propId: booking.listing.beds24PropId,
      roomId: booking.listing.beds24RoomId,
      checkIn,
      checkOut,
      guests: input.guests,
      guestName: (input.guestName?.trim() || guestUser?.name) ?? undefined,
      guestEmail: guestUser?.email ?? undefined,
      guestPhone: input.guestPhone?.trim() || undefined,
      externalId: booking.id,
    });
    if (!result.ok) {
      console.error("[Beds24] 예약 전송 실패 (예약은 생성됨):", result.error);
    }
  }

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
        select: { beds24Enabled: true, beds24PropId: true, beds24RoomId: true },
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
  return postBeds24Booking({
    propId: booking.listing.beds24PropId!,
    roomId: booking.listing.beds24RoomId!,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    guests: booking.guests,
    guestName: booking.guestName ?? booking.user?.name ?? undefined,
    guestEmail: booking.user?.email ?? undefined,
    guestPhone: booking.guestPhone ?? undefined,
    externalId: booking.id,
  });
}
