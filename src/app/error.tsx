"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Header, Footer } from "@/components/layout";
import { Home, Search, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <>
      <Header />
      <main className="min-h-screen pt-[176px] md:pt-[192px] pb-12 px-4 md:px-6">
        <div className="max-w-[560px] mx-auto text-center">
          <h1 className="text-minbak-h2 md:text-minbak-h1 font-bold text-minbak-black mb-2">
            일시적인 오류가 발생했어요
          </h1>
          <p className="text-minbak-body text-minbak-gray mb-8">
            잠시 후 다시 시도해 주시거나, 아래 버튼으로 이어서 이용해 주세요.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-minbak bg-minbak-primary text-white font-medium hover:bg-minbak-primary-hover transition-colors"
            >
              <RefreshCw className="w-4 h-4" aria-hidden />
              다시 시도
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-minbak border border-minbak-light-gray text-minbak-black font-medium hover:bg-minbak-bg transition-colors"
            >
              <Home className="w-4 h-4" aria-hidden />
              홈으로
            </Link>
            <Link
              href="/search"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-minbak border border-minbak-light-gray text-minbak-black font-medium hover:bg-minbak-bg transition-colors"
            >
              <Search className="w-4 h-4" aria-hidden />
              숙소 검색
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
