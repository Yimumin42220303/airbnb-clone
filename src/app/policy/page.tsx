import { Header, Footer } from "@/components/layout";
import Link from "next/link";

export const metadata = {
  title: "개인정보 이용방침",
  description:
    "도쿄민박 개인정보 이용방침. 이용자의 개인정보 수집, 이용, 보호에 관한 안내입니다.",
};

export default function PolicyPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-24">
        {/* Hero */}
        <section className="bg-minbak-bg border-b border-minbak-light-gray">
          <div className="max-w-[720px] mx-auto px-6 py-12">
            <h1 className="text-airbnb-h1 font-bold text-minbak-black mb-2">
              개인정보 이용방침
            </h1>
            <p className="text-airbnb-caption text-minbak-gray">
              마지막 업데이트: 2025년 10월 1일
            </p>
          </div>
        </section>

        <div className="max-w-[720px] mx-auto px-6 py-12 space-y-10">
          <article>
            <h2 className="text-airbnb-title font-semibold text-minbak-black mb-3">
              제 1 조 (목적)
            </h2>
            <p className="text-airbnb-body text-minbak-gray leading-relaxed">
              이 개인정보 이용방침은 도쿄민박(이하 &quot;회사&quot;)이 제공하는
              도쿄민박(이하 &quot;사이트&quot;)에서 이용자의 개인정보를 어떻게
              수집, 이용, 보호하는지를 설명합니다.
            </p>
          </article>

          <article>
            <h2 className="text-airbnb-title font-semibold text-minbak-black mb-3">
              제 2 조 (수집하는 개인정보의 항목)
            </h2>
            <p className="text-airbnb-body text-minbak-gray mb-4">
              회사는 서비스 제공을 위해 다음과 같은 개인정보를 수집합니다:
            </p>
            <ul className="space-y-2 text-airbnb-body text-minbak-gray list-none">
              <li>
                <strong className="text-minbak-black">필수 정보:</strong> 이름,
                이메일 주소, 전화번호, 결제 정보 (신용카드 정보 등)
              </li>
              <li>
                <strong className="text-minbak-black">선택 정보:</strong> 주소,
                프로필 사진, 서비스 이용 시 작성하는 후기 및 댓글
              </li>
            </ul>
          </article>

          <article>
            <h2 className="text-airbnb-title font-semibold text-minbak-black mb-3">
              제 3 조 (개인정보의 수집 및 이용 목적)
            </h2>
            <p className="text-airbnb-body text-minbak-gray mb-4">
              회사는 수집한 개인정보를 다음과 같은 목적으로 사용합니다.
            </p>
            <ul className="space-y-2 text-airbnb-body text-minbak-gray list-disc list-inside">
              <li>서비스 제공 및 관리</li>
              <li>예약 확인 및 관련 정보 전달</li>
              <li>고객 문의 및 서비스 개선</li>
              <li>
                마케팅 및 프로모션 정보 제공 (이용자가 동의한 경우에 한함)
              </li>
              <li>법적 의무 이행</li>
            </ul>
          </article>

          <article>
            <h2 className="text-airbnb-title font-semibold text-minbak-black mb-3">
              제 4 조 (개인정보의 보유 및 이용 기간)
            </h2>
            <p className="text-airbnb-body text-minbak-gray leading-relaxed">
              회사는 개인정보를 수집 목적이 달성될 때까지 보유하며, 이용자가
              요청하는 경우 즉시 삭제합니다. 단, 관련 법령에 따라 보관해야 하는
              경우는 예외로 합니다.
            </p>
          </article>

          <article>
            <h2 className="text-airbnb-title font-semibold text-minbak-black mb-3">
              제 5 조 (개인정보의 제3자 제공)
            </h2>
            <p className="text-airbnb-body text-minbak-gray mb-4">
              회사는 이용자의 개인정보를 제3자에게 제공하지 않으며, 아래의
              경우에 한하여 제공할 수 있습니다.
            </p>
            <ul className="space-y-2 text-airbnb-body text-minbak-gray list-disc list-inside">
              <li>이용자의 사전 동의가 있는 경우</li>
              <li>법령에 의한 요구가 있는 경우</li>
            </ul>
          </article>

          <article>
            <h2 className="text-airbnb-title font-semibold text-minbak-black mb-3">
              제 6 조 (개인정보의 안전성 확보 조치)
            </h2>
            <p className="text-airbnb-body text-minbak-gray mb-4">
              회사는 개인정보의 안전성을 확보하기 위해 다음과 같은 조치를
              취합니다.
            </p>
            <ul className="space-y-2 text-airbnb-body text-minbak-gray list-disc list-inside">
              <li>개인정보 접근 제한 및 관리</li>
              <li>데이터 암호화 및 보안 프로그램 사용</li>
              <li>내부 관리 계획 수립 및 이행</li>
            </ul>
          </article>

          <article>
            <h2 className="text-airbnb-title font-semibold text-minbak-black mb-3">
              제 7 조 (이용자의 권리)
            </h2>
            <p className="text-airbnb-body text-minbak-gray leading-relaxed">
              이용자는 언제든지 자신의 개인정보에 대한 열람, 수정, 삭제를
              요청할 수 있습니다. 요청 시, 회사는 신속하게 처리합니다.
            </p>
          </article>

          <article>
            <h2 className="text-airbnb-title font-semibold text-minbak-black mb-3">
              제 8 조 (개인정보 처리방침의 변경)
            </h2>
            <p className="text-airbnb-body text-minbak-gray leading-relaxed">
              회사는 개인정보 처리방침을 변경할 수 있으며, 변경되는 경우 사이트
              내에 공지합니다. 변경된 사항은 공지한 날로부터 효력이 발생합니다.
            </p>
          </article>

          <article>
            <h2 className="text-airbnb-title font-semibold text-minbak-black mb-3">
              제 9 조 (연락처)
            </h2>
            <p className="text-airbnb-body text-minbak-gray mb-4">
              개인정보 처리와 관련된 문의는 아래의 연락처로 해주시기 바랍니다.
            </p>
            <p className="text-airbnb-body text-minbak-black">
              이메일:{" "}
              <a
                href="mailto:tokyoreserve00@outlook.com"
                className="text-minbak-primary hover:underline"
              >
                tokyoreserve00@outlook.com
              </a>
            </p>
          </article>

          <div className="flex justify-center gap-4 pt-6 border-t border-minbak-light-gray">
            <Link
              href="/search"
              className="text-minbak-primary hover:underline font-medium"
            >
              민박집 찾기 →
            </Link>
            <Link href="/" className="text-minbak-gray hover:underline">
              ← 홈으로
            </Link>
          </div>
        </div>

        {/* 하단 CTA */}
        <section className="bg-minbak-primary text-white py-16 mt-16">
          <div className="max-w-[900px] mx-auto px-6 text-center">
            <h2 className="text-airbnb-h2 font-bold mb-3">
              합리적인 도쿄여행의 선택
            </h2>
            <p className="text-airbnb-body-lg mb-8 opacity-95">
              에어비앤비보다 최대 20% 저렴한 도쿄민박에서 나만의 민박을
              찾아보세요.
            </p>
            <Link
              href="/search"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-airbnb-full bg-white text-minbak-primary font-semibold hover:bg-gray-100 transition-colors"
            >
              나만을 위한 민박을 찾아보기
            </Link>
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
}
