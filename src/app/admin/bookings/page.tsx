import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminBookingsPage() {
  const bookings = await prisma.booking.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      listing: { select: { id: true, title: true } },
      user: { select: { id: true, email: true, name: true } },
      transactions: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/admin"
          className="text-minbak-body text-minbak-gray hover:text-minbak-black"
        >
          ← 대시보드
        </Link>
      </div>
      <h1 className="text-minbak-h2 font-semibold text-minbak-black mb-6">
        예약 목록
      </h1>
      <div className="border border-minbak-light-gray rounded-minbak overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-minbak-body text-minbak-black">
            <thead>
              <tr className="border-b border-minbak-light-gray bg-minbak-bg text-left">
                <th className="py-3 px-4">게스트</th>
                <th className="py-3 px-4">숙소</th>
                <th className="py-3 px-4">체크인</th>
                <th className="py-3 px-4">체크아웃</th>
                <th className="py-3 px-4">상태</th>
                <th className="py-3 px-4">결제</th>
                <th className="py-3 px-4">금액</th>
                <th className="py-3 px-4">환불</th>
                <th className="py-3 px-4">결제수단</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => {
                const paidTx = b.transactions.find(
                  (t) => t.status === "paid"
                );
                const refundTx = b.transactions.find(
                  (t) => t.status === "refunded"
                );
                return (
                  <tr
                    key={b.id}
                    className="border-b border-minbak-light-gray"
                  >
                    <td className="py-3 px-4">
                      {b.user.name || b.user.email}
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/listing/${b.listing.id}`}
                        className="hover:underline"
                      >
                        {b.listing.title}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-minbak-caption">
                      {b.checkIn.toISOString().slice(0, 10)}
                    </td>
                    <td className="py-3 px-4 text-minbak-caption">
                      {b.checkOut.toISOString().slice(0, 10)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-minbak-caption px-2 py-0.5 rounded ${
                          b.status === "confirmed"
                            ? "bg-green-100 text-green-800"
                            : b.status === "cancelled"
                              ? "bg-gray-100 text-gray-600"
                              : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {b.status === "confirmed"
                          ? "확정"
                          : b.status === "cancelled"
                            ? "취소"
                            : "대기"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-minbak-caption px-2 py-0.5 rounded ${
                          b.paymentStatus === "paid"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {b.paymentStatus === "paid" ? "결제완료" : "대기"}
                      </span>
                      {paidTx?.verifiedAt && (
                        <p className="text-[11px] text-minbak-gray mt-0.5">
                          {new Date(paidTx.verifiedAt).toLocaleString("ko-KR")}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      ₩{b.totalPrice.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      {refundTx ? (
                        <span className="text-minbak-caption px-2 py-0.5 rounded bg-orange-100 text-orange-800">
                          ₩{refundTx.amount.toLocaleString()} 환불
                        </span>
                      ) : (
                        <span className="text-minbak-caption text-minbak-gray">
                          -
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-minbak-caption text-minbak-gray">
                      {paidTx?.method || "-"}
                      {paidTx?.pgProvider && (
                        <span className="block text-[11px]">
                          {paidTx.pgProvider}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
