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
          className="text-minbak-body text-minbak-gray hover:text-minbak-black"
        >
          ← 대시보드
        </Link>
      </div>
      <h1 className="text-minbak-h2 font-semibold text-minbak-black mb-6">
        회원 목록
      </h1>
      <div className="border border-minbak-light-gray rounded-minbak overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-minbak-body text-minbak-black">
            <thead>
              <tr className="border-b border-minbak-light-gray bg-minbak-bg text-left">
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
                <tr key={u.id} className="border-b border-minbak-light-gray">
                  <td className="py-3 px-4">{u.email}</td>
                  <td className="py-3 px-4">{u.name ?? "-"}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-minbak-caption px-2 py-0.5 rounded ${
                        u.role === "admin"
                          ? "bg-minbak-primary/10 text-minbak-primary"
                          : "bg-minbak-bg text-minbak-gray"
                      }`}
                    >
                      {u.role === "admin" ? "관리자" : "회원"}
                    </span>
                  </td>
                  <td className="py-3 px-4">{u._count.listings}</td>
                  <td className="py-3 px-4">{u._count.bookings}</td>
                  <td className="py-3 px-4 text-minbak-caption text-minbak-gray">
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
