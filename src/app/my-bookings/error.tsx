"use client";

import { useEffect } from "react";
import { Header, Footer } from "@/components/layout";
import Link from "next/link";

export default function MyBookingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[my-bookings]", error);
  }, [error]);

  return (
    <>
      <Header />
      <main className="min-h-screen pt-24 px-4 sm:px-6">
        <div className="max-w-[560px] mx-auto py-12 text-center">
          <p className="text-minbak-body text-minbak-gray mb-6">
            예약 목록을 불러오는 중 오류가 발생했어요.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={reset}
              className="min-h-[48px] px-6 py-3 text-minbak-body font-medium rounded-minbak-full bg-minbak-primary text-white hover:bg-minbak-primary-hover"
            >
              다시 시도
            </button>
            <Link
              href="/my-bookings"
              className="min-h-[48px] px-6 py-3 text-minbak-body font-medium rounded-minbak-full border border-minbak-light-gray text-minbak-black hover:bg-minbak-bg inline-flex items-center justify-center"
            >
              내 예약 (새로고침)
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
