import Link from "next/link";
import { Header, Footer } from "@/components/layout";
import { Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-[176px] md:pt-[192px] pb-12 px-4 md:px-6">
        <div className="max-w-[560px] mx-auto text-center">
          <p className="text-minbak-caption text-minbak-gray mb-1">404</p>
          <h1 className="text-minbak-h2 md:text-minbak-h1 font-bold text-minbak-black mb-2">
            페이지를 찾을 수 없어요
          </h1>
          <p className="text-minbak-body text-minbak-gray mb-8">
            주소가 잘못되었거나 페이지가 이동·삭제되었을 수 있습니다.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-minbak bg-minbak-primary text-white font-medium hover:bg-minbak-primary-hover transition-colors"
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
