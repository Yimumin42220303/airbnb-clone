import Link from "next/link";
import {
  Headset,
  ShieldCheck,
  KeyRound,
  ReceiptText,
  CalendarCheck,
  ArrowRight,
} from "lucide-react";
import { HOME_TRUST_BADGES, type TrustBadgeId } from "@/lib/trust-content";

const BADGE_ICONS: Partial<Record<TrustBadgeId, React.ComponentType<{ className?: string }>>> = {
  "direct-response": Headset,
  "single-window": ShieldCheck,
  "checkin-guide": KeyRound,
  "refund-intake": ReceiptText,
  "pre-conditions": CalendarCheck,
};

/**
 * 홈 상단 신뢰 배지 스트립.
 * 핵심 메시지: 예약부터 숙박 중 문제 대응까지 도쿄민박이 한국어 책임 창구로 직접 대응.
 * 모바일: 2열 / 데스크톱: 5열. 예약 CTA보다 튀지 않도록 가벼운 구성 유지.
 */
export default function TrustBadgeStrip() {
  return (
    <section
      aria-labelledby="home-trust-heading"
      className="bg-white border-b border-minbak-light-gray"
    >
      <div className="max-w-[1240px] mx-auto px-4 md:px-6 py-7 md:py-9">
        <div className="text-center mb-5 md:mb-7">
          <h2
            id="home-trust-heading"
            className="text-minbak-title md:text-minbak-h3 font-semibold text-minbak-black"
          >
            예약부터 숙박 중 문제 대응까지, 도쿄민박이 직접 챙깁니다.
          </h2>
          <p className="text-minbak-caption md:text-minbak-body text-minbak-gray mt-2 max-w-[680px] mx-auto leading-relaxed">
            등록된 숙소는 도쿄민박이 한국어로 예약 전 문의, 체크인 안내, 숙박 중 문제
            접수, 환불·민원 접수까지 직접 대응합니다.
          </p>
        </div>
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 md:gap-3">
          {HOME_TRUST_BADGES.map((badge) => {
            const Icon = BADGE_ICONS[badge.id];
            return (
              <li
                key={badge.id}
                className="flex flex-col gap-1.5 px-3 py-3 rounded-minbak border border-minbak-light-gray bg-minbak-bg/60"
              >
                <span className="flex items-center gap-2">
                  <span className="inline-flex w-8 h-8 flex-shrink-0 items-center justify-center rounded-full bg-minbak-primary/10 text-minbak-primary">
                    {Icon && <Icon className="w-4 h-4" />}
                  </span>
                  <span className="text-minbak-caption md:text-minbak-body font-semibold text-minbak-black leading-snug">
                    {badge.title}
                  </span>
                </span>
                <span className="text-[12px] md:text-minbak-caption text-minbak-gray leading-snug">
                  {badge.desc}
                </span>
              </li>
            );
          })}
        </ul>
        <div className="text-center mt-4 md:mt-5">
          <Link
            href="/trust"
            className="inline-flex items-center gap-1 text-minbak-body font-medium text-minbak-primary hover:underline"
          >
            안심예약센터에서 자세히 보기
            <ArrowRight className="w-4 h-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
