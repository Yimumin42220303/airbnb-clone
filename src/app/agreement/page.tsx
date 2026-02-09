import { Header, Footer } from "@/components/layout";
import Link from "next/link";

export const metadata = {
  title: "이용약관",
  description: "도쿄민박 이용약관",
};

export default function AgreementPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-24 px-6">
        <div className="max-w-[720px] mx-auto py-12">
          <h1 className="text-airbnb-h1 font-semibold text-minbak-black mb-6">
            이용약관
          </h1>
          <p className="text-airbnb-body text-minbak-gray mb-8">
            이용약관 내용은 준비 중입니다. 문의는 고객 문의처로 연락 부탁드립니다.
          </p>
          <Link href="/" className="text-minbak-primary hover:underline">
            ← 홈으로
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
