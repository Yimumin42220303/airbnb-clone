import { Header, Footer } from "@/components/layout";
import Link from "next/link";

export const metadata = {
  title: "도쿄민박에 대해",
  description:
    "도쿄민박은 한국 여행객을 위해 만들어진 도쿄 숙소 예약 서비스입니다. 합리적인 가격, 한국어 전면 지원, 엄선된 숙소만 등록합니다.",
};

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-24">
        {/* Hero */}
        <section className="bg-minbak-bg border-b border-minbak-light-gray">
          <div className="max-w-[720px] mx-auto px-6 py-16 text-center">
            <p className="text-airbnb-caption text-minbak-primary font-medium tracking-widest uppercase mb-2">
              ABOUT US
            </p>
            <h1 className="text-airbnb-h1 font-bold text-minbak-black mb-3">
              도쿄민박 서비스 소개
            </h1>
            <p className="text-airbnb-body-lg text-minbak-gray">
              도쿄에서의 숙소 선택, 더 믿을 수 있고 더 편안하게
            </p>
          </div>
        </section>

        <div className="max-w-[720px] mx-auto px-6 py-12 space-y-16">
          {/* Intro */}
          <section>
            <p className="text-airbnb-body text-minbak-gray leading-relaxed mb-6">
              도쿄민박은 한국 여행객을 위해 만들어진 도쿄 숙소 예약 서비스입니다.
              복잡한 해외숙소 선택 과정, 언어 장벽, 예약 플랫폼 수수료로 인한 높은
              숙박 요금 때문에 불안했던 경험에서 출발했습니다.
            </p>
            <blockquote className="border-l-4 border-minbak-primary pl-5 py-2 my-6 text-airbnb-body-lg text-minbak-black font-medium italic">
              &ldquo;도쿄 숙소를 조금 더 합리적이고, 조금 더 안심하고 예약할 수는
              없을까?&rdquo;
            </blockquote>
            <p className="text-airbnb-body text-minbak-gray">
              이 질문에 대한 답이 바로 도쿄민박입니다.
            </p>
          </section>

          {/* 우리가 도쿄민박을 운영하는 이유 */}
          <section>
            <h2 className="text-airbnb-h2 font-semibold text-minbak-black mb-4">
              우리가 도쿄민박을 운영하는 이유
            </h2>
            <p className="text-airbnb-body text-minbak-gray mb-6">
              도쿄 숙소의 예약만큼은 늘 쉽지 않습니다.
            </p>
            <ul className="space-y-2 text-airbnb-body text-minbak-gray mb-6 list-disc list-inside">
              <li>숙소측과 한국어로 정확한 소통이 어려운 점</li>
              <li>교통편, 현지 정보 등의 부족</li>
              <li>실제와 다른 숙소 정보</li>
              <li>플랫폼 수수료로 인한 가격 부담</li>
            </ul>
            <p className="text-airbnb-body text-minbak-black font-medium">
              도쿄민박은 이런 불편을 줄이기 위해 직접 확인한 숙소만 선별하고,
              한국어로 끝까지 책임지는 예약 경험을 제공합니다.
            </p>
          </section>

          {/* 신뢰를 가장 중요하게 */}
          <section>
            <h2 className="text-airbnb-h2 font-semibold text-minbak-black mb-6">
              도쿄민박이 신뢰를 가장 중요하게 생각하는 이유
            </h2>

            <div className="space-y-8">
              <div className="p-5 border border-minbak-light-gray rounded-airbnb bg-white">
                <h3 className="text-airbnb-title font-semibold text-minbak-black mb-1">
                  정식 여행업 허가 사업자
                </h3>
                <p className="text-airbnb-caption text-minbak-primary font-medium mb-2">
                  경남 창원시 제2026-000002호
                </p>
                <p className="text-airbnb-body text-minbak-gray">
                  도쿄민박은 정식 여행업 허가를 받은 사업자로 운영되고 있습니다.
                  단순 중개가 아닌, 여행 서비스로서의 책임을 전제로 숙소를
                  소개합니다.
                </p>
              </div>

              <ul className="space-y-3 text-airbnb-body text-minbak-gray">
                <li className="flex items-start gap-2">
                  <span className="text-minbak-primary font-bold">·</span>
                  실제 운영 상태를 확인한 숙소만 등록
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-minbak-primary font-bold">·</span>
                  허위·과장 사진 없는 정직한 정보 제공
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-minbak-primary font-bold">·</span>
                  예약 전·후 한국어 응대 지원
                </li>
              </ul>

              <blockquote className="border-l-4 border-minbak-primary pl-5 py-2 text-airbnb-body text-minbak-black italic">
                &ldquo;여행 중 머무는 공간은, 무엇보다 믿을 수 있어야 한다고
                생각합니다.&rdquo;
              </blockquote>
            </div>
          </section>

          {/* 서비스 특징 4가지 */}
          <section>
            <h2 className="text-airbnb-h2 font-semibold text-minbak-black mb-8">
              도쿄민박 서비스 특징
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {[
                {
                  num: "1",
                  title: "합리적인 가격",
                  desc: "해외 대형 플랫폼 대비 불필요한 수수료를 최소화해, 같은 숙소라도 더 합리적인 가격으로 제공합니다.",
                },
                {
                  num: "2",
                  title: "한국어 전면 지원",
                  desc: "문의부터 예약, 숙박 중 문제 발생 시까지 한국어로 빠르고 정확하게 응대합니다.",
                },
                {
                  num: "3",
                  title: "엄선된 숙소만 등록",
                  desc: "수량보다 품질을 우선합니다. 직접 확인하거나 신뢰할 수 있는 파트너 숙소만 선별해 소개합니다.",
                },
                {
                  num: "4",
                  title: "여행자 입장에서 설계된 안내",
                  desc: "체크인 방법, 주변 정보, 주의사항까지 처음 도쿄를 방문하는 분도 이해하기 쉽게 안내합니다.",
                },
              ].map((item) => (
                <div
                  key={item.num}
                  className="p-5 border border-minbak-light-gray rounded-airbnb bg-minbak-bg/50"
                >
                  <span className="inline-flex w-8 h-8 items-center justify-center rounded-full bg-minbak-primary text-white text-airbnb-caption font-bold mb-3">
                    {item.num}
                  </span>
                  <h3 className="text-airbnb-title font-semibold text-minbak-black mb-2">
                    {item.title}
                  </h3>
                  <p className="text-airbnb-body text-minbak-gray">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* 추천 대상 */}
          <section>
            <h2 className="text-airbnb-h2 font-semibold text-minbak-black mb-6">
              이런 분들께 도쿄민박을 추천합니다
            </h2>
            <ul className="space-y-3 text-airbnb-body text-minbak-gray">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-minbak-primary flex-shrink-0" />
                에어비앤비보다 조금 더 안심되는 예약을 원하시는 분
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-minbak-primary flex-shrink-0" />
                일본 현지 숙소와의 소통이 부담스러운 분
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-minbak-primary flex-shrink-0" />
                가격과 신뢰, 둘 다 포기하고 싶지 않은 분
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-minbak-primary flex-shrink-0" />
                도쿄에 처음 방문하는 한국 여행객
              </li>
            </ul>
          </section>

          {/* 숙소를 넘어 경험을 */}
          <section>
            <h2 className="text-airbnb-h2 font-semibold text-minbak-black mb-4">
              숙소를 넘어, 경험을 연결합니다
            </h2>
            <p className="text-airbnb-body text-minbak-gray leading-relaxed mb-4">
              도쿄민박은 단순히 숙소를 연결하는 플랫폼이 아닙니다. 여행의
              시작부터 머무는 시간까지, 불안함을 줄이고 만족도를 높이는 역할을
              하고자 합니다.
            </p>
            <p className="text-airbnb-body text-minbak-gray leading-relaxed">
              숙소뿐 아니라, 특별한 경험, 픽업, 가족 여행 등까지 여러 형태의 도쿄
              숙소와 여행 상품을 순차적으로 확장해 나가고 있습니다.
            </p>
          </section>

          {/* Closing */}
          <section className="text-center py-8 border-t border-b border-minbak-light-gray">
            <h2 className="text-airbnb-h2 font-bold text-minbak-black mb-3">
              도쿄에서의 숙박, 도쿄민박과 함께하세요
            </h2>
            <p className="text-airbnb-body text-minbak-gray mb-2">
              조금 더 친절하게
            </p>
            <p className="text-airbnb-body text-minbak-gray mb-2">
              조금 더 정직하게,
            </p>
            <p className="text-airbnb-body text-minbak-gray mb-6">
              그리고 끝까지 책임지는 서비스로.
            </p>
            <p className="text-airbnb-body-lg text-minbak-black font-medium">
              도쿄민박은 여러분의 도쿄 여행이 편안한 기억으로 남도록 돕겠습니다.
            </p>
          </section>

          <div className="flex justify-center gap-4 pt-4">
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

        {/* 하단 CTA (홈과 동일) */}
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
