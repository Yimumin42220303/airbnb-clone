import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      _count: { select: { listings: true, bookings: true } },
    },
  });

  return (
    <div className="max-w-[1100px] mx-auto px-6 py-8">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/admin"
          className="text-airbnb-body text-airbnb-gray hover:text-airbnb-black"
        >
          ← 대시보드
        </Link>
      </div>
      <h1 className="text-airbnb-h2 font-semibold text-airbnb-black mb-6">
        회원 목록
      </h1>
      <div className="border border-airbnb-light-gray rounded-airbnb overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-airbnb-body text-airbnb-black">
            <thead>
              <tr className="border-b border-airbnb-light-gray bg-airbnb-bg text-left">
                <th className="py-3 px-4">이메일</th>
                <th className="py-3 px-4">이름</th>
                <th className="py-3 px-4">역할</th>
                <th className="py-3 px-4">숙소 수</th>
                <th className="py-3 px-4">예약 수</th>
                <th className="py-3 px-4">가입일</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-airbnb-light-gray">
                  <td className="py-3 px-4">{u.email}</td>
                  <td className="py-3 px-4">{u.name ?? "-"}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-airbnb-caption px-2 py-0.5 rounded ${
                        u.role === "admin"
                          ? "bg-airbnb-red/10 text-airbnb-red"
                          : "bg-airbnb-bg text-airbnb-gray"
                      }`}
                    >
                      {u.role === "admin" ? "관리자" : "회원"}
                    </span>
                  </td>
                  <td className="py-3 px-4">{u._count.listings}</td>
                  <td className="py-3 px-4">{u._count.bookings}</td>
                  <td className="py-3 px-4 text-airbnb-caption text-airbnb-gray">
                    {u.createdAt.toLocaleDateString("ko-KR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
