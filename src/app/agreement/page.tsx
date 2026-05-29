import Link from "next/link";

export const metadata = {
  title: "이용약관",
  description: "도쿄민박 이용약관. 한일익스프레스가 운영하는 도쿄민박(tokyominbak.net) 서비스 이용과 관련한 권리·의무 및 책임사항을 안내합니다.",
};

export default function AgreementPage() {
  return (
    <main className="min-h-screen pt-24">
        {/* Hero */}
        <section className="bg-white border-b border-minbak-light-gray">
          <div className="max-w-[720px] mx-auto px-6 py-12">
            <h1 className="text-minbak-h1 font-bold text-minbak-black mb-2">
              도쿄민박 이용약관
            </h1>
            <p className="text-minbak-caption text-minbak-gray">
              한일익스프레스가 운영하는 도쿄민박(tokyominbak.net) 서비스 이용약관입니다.
            </p>
          </div>
        </section>

        <div className="max-w-[720px] mx-auto px-6 py-12 space-y-10">
          <article>
            <h2 className="text-minbak-title font-semibold text-minbak-black mb-3">
              제1조 (목적)
            </h2>
            <p className="text-minbak-body text-minbak-gray leading-relaxed">
              본 약관은 한일익스프레스(이하 &quot;회사&quot;)가 운영하는 도쿄민박(tokyominbak.net, 이하 &quot;서비스&quot;)의 이용과 관련하여 회사와 회원 간의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.
            </p>
          </article>

          <article>
            <h2 className="text-minbak-title font-semibold text-minbak-black mb-3">
              제2조 (서비스의 성격)
            </h2>
            <ul className="space-y-2 text-minbak-body text-minbak-gray list-none">
              <li>본 서비스는 숙박시설을 직접 소유·운영하지 않는 숙박 예약 플랫폼입니다.</li>
              <li>숙박 계약은 회원과 각 숙소 운영자(호스트) 간에 체결됩니다.</li>
              <li>회사는 예약 중개 및 결제 처리 역할을 수행합니다.</li>
              <li>회사는 등록 숙소에 대한 예약 전후 문의, 체크인 안내, 숙박 중 문제 접수, 환불·민원 접수를 고객지원 창구로서 한국어로 직접 접수·대응합니다.</li>
              <li>숙소의 소유·시설 관리·현장 운영 주체는 숙소별 운영자 또는 현지 파트너일 수 있으며, 숙박시설의 상태, 위생, 안전, 숙소 규정 준수 등 실제 숙박과 관련된 사항은 숙소 운영자의 책임입니다. 다만 게스트와의 주요 커뮤니케이션 및 문제 접수는 회사가 담당합니다.</li>
            </ul>
          </article>

          <article>
            <h2 className="text-minbak-title font-semibold text-minbak-black mb-3">
              제3조 (예약의 유형 및 성립)
            </h2>
            <p className="text-minbak-body text-minbak-gray mb-4">
              숙소는 다음 두 가지 방식으로 운영될 수 있습니다.
            </p>
            <ol className="space-y-3 text-minbak-body text-minbak-gray list-decimal list-inside mb-4">
              <li>
                <strong className="text-minbak-black">자동확정 숙소</strong>
                <br />
                회원이 결제를 완료한 시점에 예약이 확정됩니다.
              </li>
              <li>
                <strong className="text-minbak-black">승인형 숙소</strong>
                <br />
                회원이 예약 요청 후 결제를 완료하면 &quot;승인 대기&quot; 상태가 되며, 호스트가 승인한 시점에 예약이 확정됩니다. 승인이 거절될 경우 결제 금액은 전액 환불됩니다.
              </li>
            </ol>
            <p className="text-minbak-body text-minbak-gray leading-relaxed">
              시스템 오류, 중복 예약 등 불가피한 사유가 발생한 경우 회사는 예약을 취소하고 전액 환불할 수 있습니다.
            </p>
          </article>

          <article>
            <h2 className="text-minbak-title font-semibold text-minbak-black mb-3">
              제4조 (요금 및 결제)
            </h2>
            <ul className="space-y-2 text-minbak-body text-minbak-gray list-none">
              <li>숙박 요금은 숙소 상세 페이지에 표시된 금액을 기준으로 합니다.</li>
              <li>결제는 회사가 지정한 결제수단을 통해 이루어집니다.</li>
              <li>신용카드 정보는 회사가 직접 저장하지 않으며, 결제대행업체를 통해 안전하게 처리됩니다.</li>
              <li>환율 변동, 카드사 수수료 등에 따라 실제 청구 금액이 일부 차이 날 수 있습니다.</li>
            </ul>
          </article>

          <article>
            <h2 className="text-minbak-title font-semibold text-minbak-black mb-3">
              제5조 (취소 및 환불 정책)
            </h2>
            <p className="text-minbak-body text-minbak-gray mb-4">
              숙소 운영자는 다음 세 가지 취소 정책 중 하나를 선택하여 적용합니다.
            </p>
            <ol className="space-y-3 text-minbak-body text-minbak-gray list-decimal list-inside mb-4">
              <li>
                <strong className="text-minbak-black">유연</strong>
                <br />
                체크인 1일 전까지 취소 시 100% 환불
              </li>
              <li>
                <strong className="text-minbak-black">보통</strong>
                <br />
                체크인 7일 전까지 100% 환불 / 체크인 1~6일 전 취소 시 50% 환불
              </li>
              <li>
                <strong className="text-minbak-black">엄격</strong>
                <br />
                예약 후 48시간 이내(체크인 14일 이상 남은 경우) 100% 환불 / 체크인 7일 전까지 취소 시 50% 환불
              </li>
            </ol>
            <ul className="space-y-2 text-minbak-body text-minbak-gray list-none">
              <li>환불 기준일은 숙소 현지 시간 기준입니다.</li>
              <li>환불은 결제수단을 통해 처리됩니다.</li>
              <li>카드사 사정에 따라 환불 완료까지 영업일 기준 3~10일이 소요될 수 있습니다.</li>
              <li>노쇼(No-show)의 경우 환불되지 않습니다.</li>
            </ul>
          </article>

          <article>
            <h2 className="text-minbak-title font-semibold text-minbak-black mb-3">
              제6조 (회원의 의무)
            </h2>
            <ul className="space-y-2 text-minbak-body text-minbak-gray list-none">
              <li>회원은 정확한 정보를 제공해야 합니다.</li>
              <li>예약 인원 외 추가 인원 숙박은 금지됩니다.</li>
              <li>숙소 시설 훼손, 소음, 불법행위 발생 시 손해배상 책임을 질 수 있습니다.</li>
              <li>숙소 이용 규칙을 반드시 준수해야 합니다.</li>
            </ul>
          </article>

          <article>
            <h2 className="text-minbak-title font-semibold text-minbak-black mb-3">
              제7조 (책임의 제한)
            </h2>
            <ul className="space-y-2 text-minbak-body text-minbak-gray list-none">
              <li>회사는 게스트와의 책임 창구로서 문제 내용을 접수하고, 숙소 운영자 및 현지 파트너와 함께 확인·조정을 진행합니다.</li>
              <li>회사의 귀책사유 또는 운영관리 범위 내에서 발생한 문제는 관련 법령 및 본 약관에 따라 책임 있게 처리합니다.</li>
              <li>숙소 운영자 또는 회원의 귀책, 천재지변, 감염병, 항공편 취소 등 회사의 합리적 관리 범위를 벗어난 불가항력 사유에 대해서는 관계 법령, 숙소 취소 정책 및 개별 예약 조건에 따릅니다.</li>
            </ul>
          </article>

          <article>
            <h2 className="text-minbak-title font-semibold text-minbak-black mb-3">
              제8조 (약관의 변경)
            </h2>
            <p className="text-minbak-body text-minbak-gray leading-relaxed">
              회사는 관련 법령 범위 내에서 약관을 변경할 수 있으며, 변경 시 사이트를 통해 공지합니다.
            </p>
          </article>

          <article>
            <h2 className="text-minbak-title font-semibold text-minbak-black mb-3">
              제9조 (준거법 및 관할)
            </h2>
            <ul className="space-y-2 text-minbak-body text-minbak-gray list-none">
              <li>본 약관은 대한민국 법률을 준거법으로 합니다.</li>
              <li>서비스 이용과 관련한 분쟁은 회사 본점 소재지 관할 법원을 1심 전속 관할로 합니다.</li>
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
