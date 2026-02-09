"use client";

import { useState } from "react";

/** minbak.tokyo 자주 묻는 질문 (아코디언) - https://minbak.tokyo/ 동일 문구 */
const FAQ_ITEMS = [
  {
    q: "체크인은 어떻게 하나요?",
    a: "스태프가 시설에 상주하지 않는 무인체크인 시스템이므로, 예약 확정 후 온라인 상에서 저희가 체크인 가이드를 보내드립니다.",
  },
  {
    q: "반드시 지켜야할 사항이 있나요?",
    a: "네, 각 시설의 쓰레기 처리방침을 반드시 준수해 주시고, 소음 등 주변 주민들에게 피해가 되는 행동은 절대 삼가주시길 부탁드려요.",
  },
  {
    q: "게스트하우스처럼 방, 화장실 등을 다른 게스트와 같이 사용하나요?",
    a: "아니에요. 호텔과 같이 게스트의 실내 모든 시설의 단독 사용이 보장됩니다.",
  },
  {
    q: "모든 시설은 한인 민박인가요?",
    a: "아니에요. 도쿄민박은 도쿄현지민박시설들을 한국인 담당자가 안내드리는 플랫폼이에요.(일부 한인민박시설도 있어요)",
  },
  {
    q: "한국어 등 외국어 대응이 가능한가요?",
    a: "네. 모든 안내는 한국어로 대응드려요.",
  },
  {
    q: "예약 방법 및 변경/취소 정책은 어떻게 되나요?",
    a: "취소정책(모든시설공통) - 체크인 30일전: 100%환불 - 체크인 29~8일전: 50%환불 - 체크인 7일전: 30%환불 - 체크인 당일/노쇼: 환불불가",
  },
  {
    q: "결제 방법에는 어떤 것이 있나요? 매장현금결제, 신용카드, 전자머니는 가능한가요?",
    a: "현재는 계좌이체로만 결제가 가능해요. (카드 및 현금, 페이계열은 현재불가)",
  },
  {
    q: "추가 게스트(친구/가족) 숙박 요청이 가능한가요?",
    a: "네. 사전에 문의를 부탁드려요.",
  },
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="bg-minbak-bg border-y border-minbak-light-gray">
      <div className="max-w-[800px] mx-auto px-4 md:px-6 py-8 md:py-12">
        <h2 className="text-airbnb-h2 font-semibold text-minbak-black mb-6 md:mb-8 text-center">
          자주 묻는 질문
        </h2>
        <ul className="space-y-2">
          {FAQ_ITEMS.map((item, i) => (
            <li
              key={i}
              className="bg-white border border-minbak-light-gray rounded-airbnb overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 text-airbnb-body font-medium text-minbak-black hover:bg-minbak-bg/50 transition-colors"
              >
                {item.q}
                <span
                  className={`flex-shrink-0 text-minbak-primary transition-transform ${
                    openIndex === i ? "rotate-180" : ""
                  }`}
                  aria-hidden
                >
                  ▼
                </span>
              </button>
              {openIndex === i && (
                <div className="px-5 pb-4 pt-0 text-airbnb-body text-minbak-gray border-t border-minbak-light-gray">
                  {item.a}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
