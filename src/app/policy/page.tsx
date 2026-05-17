import Link from "next/link";

export const metadata = {
  title: "개인정보처리방침",
  description:
    "도쿄민박 개인정보처리방침. 한일익스프레스가 운영하는 도쿄민박(tokyominbak.net)의 개인정보 수집, 이용, 보호에 관한 안내입니다.",
};

export default function PolicyPage() {
  return (
    <main className="min-h-screen pt-24">
        {/* Hero */}
        <section className="bg-white border-b border-minbak-light-gray">
          <div className="max-w-[720px] mx-auto px-6 py-12">
            <h1 className="text-minbak-h1 font-bold text-minbak-black mb-2">
              도쿄민박 개인정보처리방침
            </h1>
            <p className="text-minbak-caption text-minbak-gray">
              한일익스프레스(이하 &quot;회사&quot;)는 도쿄민박(tokyominbak.net, 이하 &quot;서비스&quot;)을 운영함에 있어 「개인정보 보호법」 등 관련 법령을 준수하며, 이용자의 개인정보를 보호하기 위하여 다음과 같이 개인정보처리방침을 수립·공개합니다.
            </p>
          </div>
        </section>

        <div className="max-w-[720px] mx-auto px-6 py-12 space-y-10">
          <article>
            <h2 className="text-minbak-title font-semibold text-minbak-black mb-3">
              1. 수집하는 개인정보 항목
            </h2>
            <p className="text-minbak-body text-minbak-gray mb-4">
              회사는 다음의 개인정보를 수집할 수 있습니다.
            </p>
            <div className="space-y-4 text-minbak-body text-minbak-gray">
              <div>
                <p className="font-semibold text-minbak-black mb-2">① 회원 가입 및 예약 시</p>
                <ul className="list-none space-y-1 ml-2">
                  <li>· 이름</li>
                  <li>· 이메일 주소</li>
                  <li>· 휴대전화번호</li>
                  <li>· 예약 정보 (체크인/체크아웃, 인원수)</li>
                  <li>· 결제 승인 정보(결제수단 종류, 승인번호 등)</li>
                </ul>
                <p className="mt-2 text-minbak-caption text-minbak-gray">
                  ※ 신용카드 번호 등 민감한 결제정보는 회사가 직접 저장하지 않으며, 결제대행업체(PG사)를 통해 처리됩니다.
                </p>
              </div>
              <div>
                <p className="font-semibold text-minbak-black mb-2">② 서비스 이용 과정에서 자동 수집되는 정보</p>
                <ul className="list-none space-y-1 ml-2">
                  <li>· IP 주소</li>
                  <li>· 접속 로그</li>
                  <li>· 쿠키</li>
                  <li>· 기기 정보</li>
                  <li>· 방문 기록</li>
                </ul>
              </div>
            </div>
          </article>

          <article>
            <h2 className="text-minbak-title font-semibold text-minbak-black mb-3">
              2. 개인정보의 수집 및 이용 목적
            </h2>
            <p className="text-minbak-body text-minbak-gray mb-4">
              회사는 수집한 개인정보를 다음 목적에 한하여 이용합니다.
            </p>
            <ul className="space-y-2 text-minbak-body text-minbak-gray list-disc list-inside">
              <li>숙소 예약 및 결제 처리</li>
              <li>예약 확인, 변경, 취소 및 고객 응대</li>
              <li>숙소 운영자(호스트)에게 예약 정보 전달</li>
              <li>서비스 개선 및 통계 분석</li>
              <li>법령상 의무 이행</li>
            </ul>
          </article>

          <article>
            <h2 className="text-minbak-title font-semibold text-minbak-black mb-3">
              3. 개인정보의 제3자 제공
            </h2>
            <p className="text-minbak-body text-minbak-gray mb-4">
              회사는 다음의 경우 개인정보를 제3자에게 제공합니다.
            </p>
            <div className="space-y-4 text-minbak-body text-minbak-gray mb-4">
              <div className="border border-minbak-light-gray rounded-minbak p-4">
                <p className="font-semibold text-minbak-black mb-2">① 숙소 운영자(호스트)</p>
                <ul className="space-y-1 list-none">
                  <li><strong className="text-minbak-black">제공 항목:</strong> 이름, 연락처, 예약 정보</li>
                  <li><strong className="text-minbak-black">제공 목적:</strong> 숙박 서비스 제공 및 체크인 안내</li>
                  <li><strong className="text-minbak-black">보유 기간:</strong> 숙박 종료 후 관련 법령에 따른 기간까지</li>
                </ul>
                <p className="mt-2 text-minbak-caption">
                  ※ 숙소 운영자는 일본 내 사업자일 수 있으며, 이 경우 개인정보는 국외로 이전될 수 있습니다.
                </p>
              </div>
              <div className="border border-minbak-light-gray rounded-minbak p-4">
                <p className="font-semibold text-minbak-black mb-2">② 결제대행업체(PG사)</p>
                <ul className="space-y-1 list-none">
                  <li><strong className="text-minbak-black">제공 항목:</strong> 결제에 필요한 정보</li>
                  <li><strong className="text-minbak-black">제공 목적:</strong> 결제 처리</li>
                  <li><strong className="text-minbak-black">보유 기간:</strong> 관련 법령에 따른 기간</li>
                </ul>
              </div>
            </div>
            <p className="text-minbak-body text-minbak-gray leading-relaxed">
              회사는 이용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다. (단, 법령에 의한 경우 제외)
            </p>
          </article>

          <article>
            <h2 className="text-minbak-title font-semibold text-minbak-black mb-3">
              4. 개인정보의 국외 이전
            </h2>
            <p className="text-minbak-body text-minbak-gray mb-4">
              서비스 특성상 숙소 운영자가 일본에 소재할 수 있으며, 예약 이행을 위하여 다음과 같이 개인정보가 국외로 이전될 수 있습니다.
            </p>
            <ul className="space-y-2 text-minbak-body text-minbak-gray list-none mb-4">
              <li><strong className="text-minbak-black">이전 국가:</strong> 일본</li>
              <li><strong className="text-minbak-black">이전 항목:</strong> 이름, 연락처, 예약 정보</li>
              <li><strong className="text-minbak-black">이전 목적:</strong> 숙박 서비스 제공</li>
              <li><strong className="text-minbak-black">이전 시점:</strong> 예약 확정 시</li>
              <li><strong className="text-minbak-black">보유 및 이용 기간:</strong> 숙박 종료 후 관련 법령에 따른 기간</li>
            </ul>
            <p className="text-minbak-body text-minbak-gray leading-relaxed">
              이용자는 개인정보의 국외 이전을 거부할 권리가 있으나, 이 경우 예약 서비스 이용이 제한될 수 있습니다.
            </p>
          </article>

          <article>
            <h2 className="text-minbak-title font-semibold text-minbak-black mb-3">
              5. 개인정보 보유 및 이용 기간
            </h2>
            <p className="text-minbak-body text-minbak-gray mb-4">
              회사는 개인정보 수집 및 이용 목적 달성 후 지체 없이 파기합니다.
              단, 다음의 경우 관련 법령에 따라 일정 기간 보관합니다.
            </p>
            <ul className="space-y-2 text-minbak-body text-minbak-gray list-none">
              <li>· 계약 또는 청약철회 기록: 5년</li>
              <li>· 대금결제 및 재화 공급 기록: 5년</li>
              <li>· 소비자 불만 또는 분쟁 처리 기록: 3년</li>
              <li>· 접속 로그: 3개월</li>
            </ul>
            <p className="mt-2 text-minbak-caption text-minbak-gray">
              (전자상거래법 등 관련 법령 기준)
            </p>
          </article>

          <article>
            <h2 className="text-minbak-title font-semibold text-minbak-black mb-3">
              6. 개인정보의 파기 절차 및 방법
            </h2>
            <ul className="space-y-2 text-minbak-body text-minbak-gray list-none">
              <li>· 보유 기간이 경과하거나 처리 목적이 달성된 개인정보는 지체 없이 파기합니다.</li>
              <li>· 전자적 파일은 복구 불가능한 방식으로 삭제합니다.</li>
              <li>· 종이 문서는 분쇄 또는 소각합니다.</li>
            </ul>
          </article>

          <article>
            <h2 className="text-minbak-title font-semibold text-minbak-black mb-3">
              7. 이용자의 권리 및 행사 방법
            </h2>
            <p className="text-minbak-body text-minbak-gray mb-4">
              이용자는 언제든지 다음 권리를 행사할 수 있습니다.
            </p>
            <ul className="space-y-2 text-minbak-body text-minbak-gray list-disc list-inside mb-4">
              <li>개인정보 열람 요청</li>
              <li>정정 요청</li>
              <li>삭제 요청</li>
              <li>처리 정지 요청</li>
            </ul>
            <p className="text-minbak-body text-minbak-gray leading-relaxed">
              요청은 이메일{" "}
              <a href="mailto:ishitsuka@micro-idea.org" className="text-minbak-primary hover:underline">
                ishitsuka@micro-idea.org
              </a>
              로 접수 가능합니다.
            </p>
          </article>

          <article>
            <h2 className="text-minbak-title font-semibold text-minbak-black mb-3">
              8. 개인정보 보호를 위한 안전성 확보 조치
            </h2>
            <p className="text-minbak-body text-minbak-gray mb-4">
              회사는 개인정보 보호를 위하여 다음 조치를 취합니다.
            </p>
            <ul className="space-y-2 text-minbak-body text-minbak-gray list-disc list-inside">
              <li>SSL 암호화 통신 적용</li>
              <li>접근 권한 최소화</li>
              <li>관리자 계정 보안 관리</li>
              <li>결제정보 비저장 정책</li>
            </ul>
          </article>

          <article>
            <h2 className="text-minbak-title font-semibold text-minbak-black mb-3">
              9. 쿠키의 사용
            </h2>
            <p className="text-minbak-body text-minbak-gray leading-relaxed">
              회사는 이용자 맞춤 서비스 제공 및 통계 분석을 위해 쿠키를 사용할 수 있습니다.
              이용자는 브라우저 설정을 통해 쿠키 저장을 거부할 수 있습니다.
            </p>
          </article>

          <article>
            <h2 className="text-minbak-title font-semibold text-minbak-black mb-3">
              10. 개인정보 보호책임자
            </h2>
            <ul className="space-y-2 text-minbak-body text-minbak-gray list-none">
              <li><strong className="text-minbak-black">책임자:</strong> 한일익스프레스 대표 임민철</li>
              <li>
                <strong className="text-minbak-black">이메일:</strong>{" "}
                <a href="mailto:ishitsuka@micro-idea.org" className="text-minbak-primary hover:underline">
                  ishitsuka@micro-idea.org
                </a>
              </li>
              <li><strong className="text-minbak-black">연락처:</strong> 010-4689-4411</li>
            </ul>
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
            <h2 className="text-minbak-h2 font-bold mb-3">
              합리적인 도쿄여행의 선택
            </h2>
            <p className="text-minbak-body-lg mb-8 opacity-95">
              에어비앤비보다 최대 20% 저렴한 도쿄민박에서 나만의 민박을
              찾아보세요.
            </p>
            <Link
              href="/search"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-minbak-full bg-white text-minbak-primary font-semibold hover:bg-gray-100 transition-colors"
            >
              나만을 위한 민박을 찾아보기
            </Link>
          </div>
        </section>
      </main>
  );
}
