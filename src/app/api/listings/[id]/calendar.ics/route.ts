import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const CRLF = "\r\n";

/**
 * GET /api/listings/[id]/calendar.ics
 * 우리 플랫폼의 확정 예약만 iCal 형식으로 내보내기.
 * 호스트가 이 URL을 Airbnb·Beds24·구글캘린더 등 "캘린더 가져오기"에 등록해 중복 예약 방지.
 * (추후 Beds24 API 연동 시 동일한 "blocked dates" 파이프라인으로 대체 가능)
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: listingId } = await params;
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true, title: true },
  });
  if (!listing) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const bookings = await prisma.booking.findMany({
    where: {
      listingId,
      status: "confirmed",
    },
    select: { id: true, checkIn: true, checkOut: true },
    orderBy: { checkIn: "asc" },
  });

  const events = bookings.map((b) => {
    const start = formatICalDate(b.checkIn);
    const end = formatICalDate(b.checkOut);
    const uid = `booking-${b.id}@calendar`;
    const summary = escapeICalText(`예약: ${listing.title}`);
    return [
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTART;VALUE=DATE:${start}`,
      `DTEND;VALUE=DATE:${end}`,
      `SUMMARY:${summary}`,
      "END:VEVENT",
    ].join(CRLF);
  });

  const calendar = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Calendar Export//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    events.join(CRLF),
    "END:VCALENDAR",
  ].join(CRLF);

  return new NextResponse(calendar, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="listing-${listingId}.ics"`,
      "Cache-Control": "private, max-age=300",
    },
  });
}

function formatICalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

function escapeICalText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}
