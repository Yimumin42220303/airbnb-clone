"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

type UserData = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  phone: string | null;
};

type Props = {
  user: UserData;
};

export default function ProfileEditForm({ user }: Props) {
  const router = useRouter();
  const [name, setName] = useState(user.name ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "저장에 실패했습니다.");
        return;
      }
      router.push("/mypage");
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white border border-minbak-light-gray rounded-minbak p-6">
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <div className="flex flex-col items-center gap-2 shrink-0">
            <div className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center overflow-hidden">
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name ?? "프로필"}
                  width={96}
                  height={96}
                  className="object-cover w-full h-full"
                />
              ) : (
                <span className="text-3xl font-bold text-white">
                  {(user.name ?? user.email ?? "?")[0].toUpperCase()}
                </span>
              )}
            </div>
            <p className="text-minbak-caption text-minbak-gray">
              프로필 사진은 소셜 로그인에서 가져옵니다
            </p>
          </div>
          <div className="flex-1 min-w-0 space-y-4 w-full">
            <div>
              <label
                htmlFor="name"
                className="block text-minbak-caption font-medium text-minbak-black mb-1.5"
              >
                이용자 이름
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="이름을 입력하세요"
                className="w-full min-h-[44px] px-4 py-2.5 border border-minbak-light-gray rounded-minbak text-minbak-body text-minbak-black placeholder:text-minbak-gray focus:outline-none focus:ring-2 focus:ring-minbak-primary focus:border-transparent"
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-minbak-caption font-medium text-minbak-black mb-1.5"
              >
                등록된 이메일
              </label>
              <input
                id="email"
                type="email"
                value={user.email}
                disabled
                className="w-full min-h-[44px] px-4 py-2.5 border border-minbak-light-gray rounded-minbak text-minbak-body text-minbak-gray bg-minbak-bg/50 cursor-not-allowed"
              />
              <p className="mt-1 text-minbak-caption text-minbak-gray">
                이메일은 소셜 로그인 연동 정보로 변경할 수 없습니다.
              </p>
            </div>
            <div>
              <label
                htmlFor="phone"
                className="block text-minbak-caption font-medium text-minbak-black mb-1.5"
              >
                전화번호
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="예: 010-1234-5678"
                className="w-full min-h-[44px] px-4 py-2.5 border border-minbak-light-gray rounded-minbak text-minbak-body text-minbak-black placeholder:text-minbak-gray focus:outline-none focus:ring-2 focus:ring-minbak-primary focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <p className="text-minbak-body text-red-600 font-medium">{error}</p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={loading}
          className="min-h-[44px] px-6 py-2.5 rounded-minbak text-minbak-body font-medium text-white bg-minbak-primary hover:bg-minbak-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "저장 중..." : "저장하기"}
        </button>
        <Link
          href="/mypage"
          className="min-h-[44px] px-6 py-2.5 rounded-minbak text-minbak-body font-medium text-minbak-black border border-minbak-light-gray hover:bg-minbak-bg transition-colors inline-flex items-center justify-center"
        >
          취소
        </Link>
      </div>
    </form>
  );
}
