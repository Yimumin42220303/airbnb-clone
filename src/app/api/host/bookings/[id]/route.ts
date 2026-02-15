import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cancelPayment } from "@/lib/portone";
import { sendEmailAsync, BASE_URL } from "@/lib/email";
import {
  bookingAcceptedGuest,
  bookingRejectedGuest,
} from "@/lib/email-templates";

/**
 * PATCH /api/host/bookings/[id]
 * 호스트가 예약 승인(accept) / 거절(reject) / 취소(cancel)
 * 본인 숙소의 예약만 가능
 *
 * 결제 완료된 예약을 호스트가 취소/거절할 경우 100% 전액 환불 처리
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const userId = (session as { userId?: string } | null)?.userId;
  if (!userId) {
    return NextResponse.json(
      { error: "로그인 후 이용할 수 있습니다." },
      { status: 401 }
    );
  }

  const { id } = await params;
  const body = await request.json();
  const action = body.action; // "accept" | "reject" | "cancel"

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      listing: { select: { userId: true, title: true, location: true } },
      user: { select: { name: true, email: true } },
      transactions: {
        where: { status: "paid" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
  if (!booking) {
    return NextResponse.json(
      { error: "예약을 찾을 수 없습니다." },
      { status: 404 }
    );
  }
  if (booking.listing.userId !== userId) {
    return NextResponse.json(
      { error: "권한이 없습니다." },
      { status: 403 }
    );
  }

  if (action === "accept") {
    if (booking.status !== "pending") {
      return NextResponse.json(
        { error: "대기 중인 예약만 수락할 수 있습니다." },
        { status: 400 }
      );
    }
    await prisma.booking.update({
      where: { id },
      data: { status: "confirmed" },
    });

    // 자동으로 대화방 생성 + 호스트 환영 메시지 전송
    let conversationId: string | null = null;
    try {
      let conversation = await prisma.conversation.findUnique({
        where: { bookingId: id },
      });
      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: { bookingId: id },
        });
      }
      conversationId = conversation.id;

      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: userId,
          body: "예약감사합니다. 3일내에 체크인방법에대해 안내드릴예정이니 조금 기다려주세요.",
        },
      });
    } catch (err) {
      console.error("자동 메시지 전송 오류:", err);
    }

    // Notify guest: booking accepted
    if (booking.user?.email) {
      const nights = Math.floor(
        (booking.checkOut.getTime() - booking.checkIn.getTime()) / (24 * 60 * 60 * 1000)
      );
      const mail = bookingAcceptedGuest({
        listingTitle: booking.listing.title,
        listingLocation: booking.listing.location || "",
        checkIn: booking.checkIn.toISOString().slice(0, 10),
        checkOut: booking.checkOut.toISOString().slice(0, 10),
        guests: booking.guests,
        nights,
        totalPrice: booking.totalPrice,
        guestName: booking.user.name || "Guest",
        guestEmail: booking.user.email,
        bookingId: id,
        baseUrl: BASE_URL,
      });
      sendEmailAsync({ to: booking.user.email, ...mail });
    }

    return NextResponse.json({ ok: true, status: "confirmed", conversationId });
  }

  if (action === "reject" || action === "cancel") {
    if (booking.status === "cancelled") {
      return NextResponse.json(
        { error: "이미 취소된 예약입니다." },
        { status: 400 }
      );
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (booking.checkIn < today) {
      return NextResponse.json(
        { error: "이미 지난 예약은 취소할 수 없습니다." },
        { status: 400 }
      );
    }

    // 결제 완료된 예약이면 호스트 사유로 100% 전액 환불
    const paidTransaction = booking.transactions[0];
    let refundDone = false;
    if (paidTransaction && booking.paymentStatus === "paid") {
      try {
        const reason =
          action === "reject"
            ? "호스트 거절로 인한 전액 환불"
            : "호스트 취소로 인한 전액 환불";
        const refundResult = await cancelPayment(
          paidTransaction.paymentId,
          reason
        );
        await prisma.paymentTransaction.create({
          data: {
            bookingId: id,
            paymentId: paidTransaction.paymentId,
            transactionId: refundResult.cancellation?.id || null,
            amount: booking.totalPrice,
            status: "refunded",
            method: paidTransaction.method,
            pgProvider: paidTransaction.pgProvider,
            rawResponse: JSON.stringify(refundResult),
            verifiedAt: new Date(),
          },
        });
        refundDone = true;
      } catch (err) {
        console.error("호스트 취소 환불 오류:", err);
        return NextResponse.json(
          { error: "환불 처리 중 오류가 발생했습니다. 관리자에게 문의해 주세요." },
          { status: 500 }
        );
      }
    }

    await prisma.booking.update({
      where: { id },
      data: {
        status: "cancelled",
        rejectedByHost: action === "reject",
        ...(refundDone ? { paymentStatus: "refunded" } : {}),
      },
    });
    // Notify guest: booking rejected/cancelled by host
    if (booking.user?.email) {
      const nights = Math.floor(
        (booking.checkOut.getTime() - booking.checkIn.getTime()) / (24 * 60 * 60 * 1000)
      );
      const mail = bookingRejectedGuest({
        listingTitle: booking.listing.title,
        listingLocation: booking.listing.location || "",
        checkIn: booking.checkIn.toISOString().slice(0, 10),
        checkOut: booking.checkOut.toISOString().slice(0, 10),
        guests: booking.guests,
        nights,
        totalPrice: booking.totalPrice,
        guestName: booking.user.name || "Guest",
        guestEmail: booking.user.email,
        bookingId: id,
        baseUrl: BASE_URL,
      });
      sendEmailAsync({ to: booking.user.email, ...mail });
    }

    return NextResponse.json({
      ok: true,
      status: "cancelled",
      refunded: refundDone,
      refundAmount: refundDone ? booking.totalPrice : 0,
    });
  }

  return NextResponse.json(
    { error: "지원하지 않는 요청입니다. (action: accept | reject | cancel)" },
    { status: 400 }
  );
}
