import { Headset } from "lucide-react";

const ITEMS = [
  "숙소, 일정, 인원, 총액을 확인해 주세요.",
  "숙소별 취소·환불 조건은 예약 전 확인할 수 있습니다.",
  "예약확정 방식은 숙소에 따라 자동확정 또는 승인형으로 나뉠 수 있습니다.",
  "숙박 중 문제가 발생하면 도쿄민박 고객지원팀이 한국어 1차 창구로 접수하고 확인합니다.",
];

/**
 * 결제/예약 직전 화면의 불안 해소 안내 박스 (UI 안내 전용).
 * 예약·결제 로직과 무관하며 표시 목적으로만 사용한다.
 */
export default function BookingConfidenceNotice() {
  return (
    <div className="rounded-minbak border border-minbak-light-gray bg-minbak-bg/60 p-4">
      <div className="flex items-center gap-2 mb-1.5">
        <Headset className="w-5 h-5 text-minbak-primary flex-shrink-0" aria-hidden />
        <p className="text-minbak-body font-semibold text-minbak-black">
          결제 후에도 도쿄민박이 함께합니다
        </p>
      </div>
      <p className="text-minbak-caption text-minbak-gray leading-relaxed mb-3">
        예약확정, 체크인 안내, 숙박 중 문의, 환불·민원 접수는 도쿄민박이 한국어로 직접
        대응합니다. 문제가 발생하면 도쿄민박 고객지원팀으로 먼저 연락해 주세요.
      </p>
      <ul className="space-y-1.5">
        {ITEMS.map((text) => (
          <li
            key={text}
            className="flex items-start gap-2 text-minbak-caption text-minbak-gray leading-relaxed"
          >
            <span className="flex-shrink-0 mt-0.5 text-minbak-primary">·</span>
            <span>{text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
