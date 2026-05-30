import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { BASE_URL } from "@/lib/site-url";
import { t } from "@/lib/host-i18n";
import {
  POLICY_CONTACT_EMAIL,
  POLICY_CONTACT_EMAIL_HREF,
  POLICY_EFFECTIVE_DATE,
  POLICY_SUMMARY_INTRO,
  POLICY_SUMMARY_CARDS,
  POLICY_COLLECTION_GROUPS,
  POLICY_PURPOSES,
  POLICY_THIRD_PARTY_ROWS,
  POLICY_ENTRUSTMENT_ROWS,
  POLICY_OVERSEAS_ROWS,
  POLICY_RETENTION_ROWS,
  POLICY_USER_RIGHTS,
  POLICY_REMEDY_LINKS,
  POLICY_HISTORY_ROWS,
} from "@/lib/policy-content";

const POLICY_URL = `${BASE_URL}/policy`;

export const metadata: Metadata = {
  title: {
    absolute: "개인정보처리방침 | 도쿄민박",
  },
  description:
    "도쿄민박의 개인정보처리방침입니다. 수집하는 개인정보 항목, 이용 목적, 제3자 제공, 처리 위탁, 국외 이전, 보유 기간, 파기 절차, 이용자 권리 및 개인정보 보호책임자 정보를 안내합니다.",
  alternates: { canonical: POLICY_URL },
  openGraph: {
    title: "개인정보처리방침 | 도쿄민박",
    description:
      "도쿄민박의 개인정보 수집 항목, 이용 목적, 제3자 제공, 처리 위탁, 국외 이전, 보유 기간 및 이용자 권리 행사 방법을 안내합니다.",
    url: POLICY_URL,
    type: "website",
    locale: "ko_KR",
    siteName: "도쿄민박",
  },
  twitter: {
    card: "summary",
    title: "개인정보처리방침 | 도쿄민박",
    description:
      "도쿄민박의 개인정보 수집 항목, 이용 목적, 제3자 제공, 처리 위탁, 국외 이전, 보유 기간 및 이용자 권리 행사 방법을 안내합니다.",
  },
};

function PolicyTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) {
  return (
    <div className="overflow-x-auto -mx-1 px-1">
      <table className="w-full min-w-[520px] text-minbak-body text-minbak-gray border border-minbak-light-gray rounded-minbak">
        <thead>
          <tr className="bg-minbak-bg/80">
            {headers.map((h) => (
              <th
                key={h}
                scope="col"
                className="text-left p-3 font-semibold text-minbak-black border-b border-minbak-light-gray"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-minbak-light-gray last:border-0">
              {row.map((cell, j) => (
                <td key={j} className="p-3 align-top">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-minbak-primary hover:underline"
    >
      {children}
    </a>
  );
}

export default function PolicyPage() {
  const companyName = t("ko", "footer.companyName").replace(/^상호명\s*/, "");
  const ceo = t("ko", "footer.ceo").replace(/^대표\s*/, "");
  const contactKr = t("ko", "footer.contactKr").replace(/^고객 문의\(한국\)\s*:\s*/, "");
  const partnerCompany = t("ko", "footer.partnerCompany").replace(
    /^일본현지파트너사\s*/,
    ""
  );

  return (
    <main className="min-h-screen pt-24">
      <section className="bg-white border-b border-minbak-light-gray">
        <div className="max-w-[800px] mx-auto px-6 py-12">
          <p className="text-minbak-caption text-minbak-primary font-medium tracking-widest uppercase mb-3">
            PRIVACY POLICY
          </p>
          <h1 className="text-minbak-h1 font-bold text-minbak-black mb-3 leading-tight">
            개인정보처리방침
          </h1>
          <p className="text-minbak-body text-minbak-gray leading-relaxed">
            {companyName}(이하 &quot;회사&quot;)는 도쿄민박(
            <ExternalLink href={BASE_URL}>tokyominbak.net</ExternalLink>, 이하
            &quot;서비스&quot;)을 운영함에 있어 「개인정보 보호법」 등 관련 법령을
            준수하며, 이용자의 개인정보를 보호하기 위하여 다음과 같이
            개인정보처리방침을 수립·공개합니다.
          </p>
          <p className="mt-3 text-minbak-caption text-minbak-gray">
            시행일: {POLICY_EFFECTIVE_DATE}
          </p>
        </div>
      </section>

      <div className="max-w-[800px] mx-auto px-6 py-12 space-y-14">
        {/* 요약 */}
        <section aria-labelledby="policy-summary-heading">
          <h2
            id="policy-summary-heading"
            className="text-minbak-h2 font-semibold text-minbak-black mb-2"
          >
            개인정보 처리방침 요약
          </h2>
          <p className="text-minbak-body text-minbak-gray mb-6 leading-relaxed">
            {POLICY_SUMMARY_INTRO}
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 list-none p-0 m-0">
            {POLICY_SUMMARY_CARDS.map((card) => (
              <li
                key={card.title}
                className="p-4 border border-minbak-light-gray rounded-minbak bg-minbak-bg/40"
              >
                <h3 className="text-minbak-title font-semibold text-minbak-black mb-2">
                  {card.title}
                </h3>
                <p className="text-minbak-body text-minbak-gray leading-relaxed">
                  {card.body}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <article>
          <h2 className="text-minbak-h2 font-semibold text-minbak-black mb-3">
            1. 수집하는 개인정보 항목
          </h2>
          <p className="text-minbak-body text-minbak-gray mb-4 leading-relaxed">
            회사는 서비스 제공에 필요한 범위에서 다음 개인정보를 수집할 수
            있습니다. 건강·종교·정치적 견해 등 「개인정보 보호법」상 민감정보는
            원칙적으로 수집하지 않습니다.
          </p>
          <div className="space-y-5">
            {POLICY_COLLECTION_GROUPS.map((group) => (
              <div
                key={group.title}
                className="p-4 border border-minbak-light-gray rounded-minbak bg-white"
              >
                <h3 className="text-minbak-title font-semibold text-minbak-black mb-2">
                  {group.title}
                </h3>
                <ul className="list-none space-y-1.5 text-minbak-body text-minbak-gray">
                  {group.items.map((item) => (
                    <li key={item}>· {item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </article>

        <article>
          <h2 className="text-minbak-h2 font-semibold text-minbak-black mb-3">
            2. 개인정보의 수집 및 이용 목적
          </h2>
          <p className="text-minbak-body text-minbak-gray mb-4">
            회사는 수집한 개인정보를 다음 목적에 한하여 이용합니다.
          </p>
          <ul className="space-y-2 text-minbak-body text-minbak-gray list-disc list-inside">
            {POLICY_PURPOSES.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <p className="mt-4 text-minbak-caption text-minbak-gray leading-relaxed">
            ※ 광고성 정보 수신·맞춤형 광고를 위한 별도 마케팅 목적 이용은, 해당
            동의·설정 구조가 마련된 경우에만 안내합니다. 현재 서비스의 필수
            예약·고객지원 목적과 구분하여 운영합니다.
          </p>
        </article>

        <article>
          <h2 className="text-minbak-h2 font-semibold text-minbak-black mb-3">
            3. 개인정보의 제3자 제공
          </h2>
          <p className="text-minbak-body text-minbak-gray mb-4 leading-relaxed">
            회사는 이용자의 동의 또는 법령에 따른 경우를 제외하고, 개인정보를
            제3자에게 제공합니다. 결제 처리 등은 「개인정보 처리 위탁」에 해당하며
            본 조와 구분합니다.
          </p>
          <PolicyTable
            headers={["제공받는 자", "제공 목적", "제공 항목", "보유·이용 기간"]}
            rows={POLICY_THIRD_PARTY_ROWS.map((r) => [
              r.recipient,
              r.purpose,
              r.items,
              r.period,
            ])}
          />
          <p className="mt-4 text-minbak-body text-minbak-gray leading-relaxed">
            회사는 이용자의 동의 없이 위 범위를 초과하여 개인정보를 제3자에게
            제공하지 않습니다. (단, 법령에 의한 경우는 예외)
          </p>
        </article>

        <article>
          <h2 className="text-minbak-h2 font-semibold text-minbak-black mb-3">
            4. 개인정보 처리 위탁
          </h2>
          <p className="text-minbak-body text-minbak-gray mb-4 leading-relaxed">
            회사는 원활한 서비스 제공을 위해 개인정보 처리 업무의 일부를 외부
            전문 업체에 위탁할 수 있습니다. 회사는 위탁계약 체결 시 개인정보가
            안전하게 처리될 수 있도록 필요한 사항을 관리·감독합니다.
          </p>
          <PolicyTable
            headers={["수탁자", "위탁 업무"]}
            rows={POLICY_ENTRUSTMENT_ROWS.map((r) => [r.trustee, r.task])}
          />
          <p className="mt-4 text-minbak-caption text-minbak-gray leading-relaxed">
            ※ Resend·Meta Pixel·Beds24 등은 환경 설정·숙소 연동 여부에 따라
            실제 사용 여부가 달라질 수 있습니다.
          </p>
        </article>

        <article>
          <h2 className="text-minbak-h2 font-semibold text-minbak-black mb-3">
            5. 개인정보의 국외 이전
          </h2>
          <p className="text-minbak-body text-minbak-gray mb-4 leading-relaxed">
            서비스는 일본 숙소 예약을 목적으로 하므로, 예약 이행·현지 고객지원을
            위해 개인정보가 일본으로 이전될 수 있습니다. 이전받는 자에는 사이트에
            공개된 {partnerCompany} 등 현지 파트너가 포함될 수 있습니다.
          </p>
          <div className="space-y-2 border border-minbak-light-gray rounded-minbak p-4 text-minbak-body text-minbak-gray">
            {POLICY_OVERSEAS_ROWS.map((row) => (
              <p key={row.label}>
                <strong className="text-minbak-black">{row.label}:</strong>{" "}
                {row.value}
              </p>
            ))}
          </div>
          <p className="mt-4 text-minbak-body text-minbak-gray leading-relaxed">
            이용자는 국외 이전을 거부할 권리가 있으나, 국외 이전이 필요한 숙소
            예약 서비스의 이용이 제한될 수 있습니다.
          </p>
        </article>

        <article>
          <h2 className="text-minbak-h2 font-semibold text-minbak-black mb-3">
            6. 개인정보 보유 및 이용 기간
          </h2>
          <p className="text-minbak-body text-minbak-gray mb-4">
            회사는 개인정보 수집·이용 목적 달성 후 지체 없이 파기합니다. 단,
            아래와 같이 관계 법령에 따라 보관할 수 있습니다.
          </p>
          <PolicyTable
            headers={["구분", "보유 기간", "근거·사유"]}
            rows={POLICY_RETENTION_ROWS.map((r) => [r.category, r.period, r.note])}
          />
        </article>

        <article>
          <h2 className="text-minbak-h2 font-semibold text-minbak-black mb-3">
            7. 개인정보의 파기 절차 및 방법
          </h2>
          <ul className="space-y-2 text-minbak-body text-minbak-gray list-none">
            <li>
              · 보유 기간이 경과하거나 처리 목적이 달성된 개인정보는 지체 없이
              파기합니다.
            </li>
            <li>
              · 전자적 파일은 복구·재생이 어렵도록 삭제하며, 접근 권한을
              제한합니다.
            </li>
            <li>
              · 법령에 따라 보관이 필요한 정보는 별도 저장·접근 제한 조치를
              합니다.
            </li>
            <li>
              · 종이 문서로 보관하는 경우 분쇄 또는 소각 등의 방법으로
              파기합니다. (해당하는 경우)
            </li>
          </ul>
        </article>

        <article>
          <h2 className="text-minbak-h2 font-semibold text-minbak-black mb-3">
            8. 이용자의 권리 및 행사 방법
          </h2>
          <p className="text-minbak-body text-minbak-gray mb-4">
            이용자는 언제든지 다음 권리를 행사할 수 있습니다.
          </p>
          <ul className="space-y-2 text-minbak-body text-minbak-gray list-disc list-inside mb-4">
            {POLICY_USER_RIGHTS.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <p className="text-minbak-body text-minbak-gray leading-relaxed">
            권리 행사는 이메일{" "}
            <a
              href={POLICY_CONTACT_EMAIL_HREF}
              className="text-minbak-primary hover:underline"
            >
              {POLICY_CONTACT_EMAIL}
            </a>
            , 고객 문의({contactKr}), 서비스 내 메시지·채널톡 등으로 접수할 수
            있습니다. 회사는 본인 확인 후 처리하며, 법령상 제한이 있는 경우
            일부 요청이 제한될 수 있습니다.
          </p>
        </article>

        <article>
          <h2 className="text-minbak-h2 font-semibold text-minbak-black mb-3">
            9. 권익침해 구제방법
          </h2>
          <p className="text-minbak-body text-minbak-gray mb-4 leading-relaxed">
            이용자는 개인정보 침해로 인한 구제를 받기 위해 아래 기관에 상담
            또는 분쟁조정을 신청할 수 있습니다.
          </p>
          <ul className="space-y-3 list-none">
            {POLICY_REMEDY_LINKS.map((link) => (
              <li
                key={link.url}
                className="p-3 border border-minbak-light-gray rounded-minbak"
              >
                <ExternalLink href={link.url}>{link.name}</ExternalLink>
                <span className="text-minbak-caption text-minbak-gray ml-2">
                  — {link.desc}
                </span>
              </li>
            ))}
          </ul>
        </article>

        <article>
          <h2 className="text-minbak-h2 font-semibold text-minbak-black mb-3">
            10. 개인정보의 안전성 확보 조치
          </h2>
          <ul className="space-y-2 text-minbak-body text-minbak-gray list-disc list-inside">
            <li>개인정보 접근 권한 최소화 및 내부 관리 기준 운영</li>
            <li>개인정보 취급자 최소화 및 접속 기록 관리</li>
            <li>HTTPS 등 안전한 전송 구간 적용</li>
            <li>관리자 계정·인증 보안 관리</li>
            <li>
              신용카드 번호 등 결제정보는 회사가 직접 저장하지 않으며,
              결제대행업체(KG이니시스, PortOne 연동)를 통해 처리
            </li>
          </ul>
        </article>

        <article>
          <h2 className="text-minbak-h2 font-semibold text-minbak-black mb-3">
            11. 쿠키 및 분석·광고 도구
          </h2>
          <div className="space-y-4 text-minbak-body text-minbak-gray leading-relaxed">
            <p>
              회사는 로그인 유지(세션·쿠키), 예약 편의, 서비스 이용 통계·오류
              확인, 광고 성과 측정 등을 위해 쿠키 및 유사 기술을 사용할 수
              있습니다.
            </p>
            <p>
              이용자는 브라우저 설정을 통해 쿠키 저장을 거부하거나 삭제할 수
              있습니다. 다만 필수 쿠키·로그인 세션을 거부할 경우 일부 서비스
              이용이 제한될 수 있습니다.
            </p>
            <div className="p-4 border border-minbak-light-gray rounded-minbak bg-white">
              <p className="font-semibold text-minbak-black mb-2">
                서비스 제공 및 분석을 위해 사용될 수 있는 도구
              </p>
              <ul className="list-none space-y-1">
                <li>· NextAuth 세션 쿠키: 로그인 유지</li>
                <li>
                  · Meta Pixel 및 Meta Conversions API: 광고 성과 측정 및 이벤트
                  분석, 연동 시
                </li>
                <li>
                  · Google Analytics / Google Tag Manager: 서비스 이용 통계 분석,
                  연동 시
                </li>
                <li>· Naver Analytics: 서비스 이용 통계 분석, 연동 시</li>
              </ul>
              <p className="mt-2 text-minbak-caption">
                각 도구는 실제 서비스 운영 환경과 연동 설정에 따라 사용 여부가
                달라질 수 있습니다. Meta 광고 연동 시 광고 식별자·이용 기록이
                수집될 수 있으며, 맞춤형 광고는 플랫폼·브라우저 설정에 따라
                달라질 수 있습니다.
              </p>
            </div>
          </div>
        </article>

        <article>
          <h2 className="text-minbak-h2 font-semibold text-minbak-black mb-3">
            12. AI 숙소 추천 및 메시지 기능
          </h2>
          <div className="space-y-3 text-minbak-body text-minbak-gray leading-relaxed">
            <p>
              <strong className="text-minbak-black">AI 숙소 추천:</strong>{" "}
              이용자가 입력한 일정·인원·선호 조건·요청 문구는 추천 결과 제공을
              위해 서버에서 처리되며, OpenAI API로 전송될 수 있습니다. 별도
              추천 이력 DB에 장기 보관하지 않는 구조입니다.
            </p>
            <p>
              <strong className="text-minbak-black">메시지:</strong> 예약과
              연결된 대화의 본문·첨부 이미지는 서비스 DB에 저장되며, 예약 확인·
              고객지원·호스트 소통 목적으로 이용됩니다. 자동 번역 사용 시 번역
              결과가 캐시될 수 있습니다.
            </p>
          </div>
        </article>

        <article>
          <h2 className="text-minbak-h2 font-semibold text-minbak-black mb-3">
            13. 개인정보 보호책임자 및 문의처
          </h2>
          <ul className="space-y-2 text-minbak-body text-minbak-gray list-none">
            <li>
              <strong className="text-minbak-black">개인정보 보호책임자:</strong>{" "}
              {ceo} ({companyName})
            </li>
            <li>
              <strong className="text-minbak-black">이메일:</strong>{" "}
              <a
                href={POLICY_CONTACT_EMAIL_HREF}
                className="text-minbak-primary hover:underline"
              >
                {POLICY_CONTACT_EMAIL}
              </a>
            </li>
            <li>
              <strong className="text-minbak-black">고객 문의(한국):</strong>{" "}
              <a href={`tel:${contactKr.replace(/-/g, "")}`} className="text-minbak-primary hover:underline">
                {contactKr}
              </a>
            </li>
          </ul>
          <p className="mt-3 text-minbak-caption text-minbak-gray">
            접수 후 본인 확인·처리 범위 안내를 거쳐 결과를 통지합니다.
          </p>
        </article>

        <article>
          <h2 className="text-minbak-h2 font-semibold text-minbak-black mb-3">
            14. 시행일 및 변경 이력
          </h2>
          <p className="text-minbak-body text-minbak-gray mb-4 leading-relaxed">
            본 개인정보처리방침은 {POLICY_EFFECTIVE_DATE}부터 시행됩니다.
            개인정보처리방침이 변경되는 경우 변경 내용과 시행일을 본 페이지를
            통해 안내합니다.
          </p>
          <PolicyTable
            headers={["버전", "시행일", "주요 변경 내용"]}
            rows={POLICY_HISTORY_ROWS.map((r) => [r.version, r.date, r.note])}
          />
        </article>

        <nav
          className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-minbak-light-gray"
          aria-label="관련 페이지"
        >
          <Link
            href="/search"
            className="text-minbak-primary hover:underline font-medium"
          >
            도쿄 숙소 둘러보기 →
          </Link>
          <Link href="/trust" className="text-minbak-primary hover:underline font-medium">
            안심예약센터 →
          </Link>
          <Link href="/agreement" className="text-minbak-gray hover:underline">
            이용약관 →
          </Link>
        </nav>
      </div>

      <section className="bg-minbak-primary text-white py-14 md:py-16 mt-8">
        <div className="max-w-[800px] mx-auto px-6 text-center">
          <h2 className="text-minbak-h2 font-bold mb-4">
            개인정보 처리 기준을 확인하셨다면, 이제 숙소를 비교해보세요
          </h2>
          <p className="text-minbak-body-lg mb-8 opacity-95 leading-relaxed max-w-[640px] mx-auto">
            도쿄민박은 예약 전 문의부터 체크인 안내, 숙박 중 문제 접수까지
            한국어로 안내합니다. 내 일정에 맞는 도쿄 숙소를 확인해 보세요.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/search"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-minbak-full bg-white text-minbak-primary font-semibold hover:bg-gray-100 transition-colors"
            >
              도쿄 숙소 둘러보기
              <ChevronRight className="w-4 h-4" aria-hidden />
            </Link>
            <Link
              href="/trust"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-minbak-full border border-white/80 text-white font-semibold hover:bg-white/10 transition-colors"
            >
              안심예약센터 보기
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
