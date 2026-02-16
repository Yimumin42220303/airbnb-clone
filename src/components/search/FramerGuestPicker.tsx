"use client";

import { Minus, Plus } from "lucide-react";
import { useHostTranslations } from "@/components/host/HostLocaleProvider";

/** Framer 스타일: 성인/어린이/유아 +/- 로 인원 선택, 표시 "게스트 N명" 또는 "게스트 N명, 유아 M명" */
export interface GuestCounts {
  adult: number;
  child: number;
  infant: number;
}

export const defaultGuestCounts: GuestCounts = {
  adult: 1,
  child: 0,
  infant: 0,
};

export function formatGuestLabel(counts: GuestCounts): string {
  const total = counts.adult + counts.child;
  if (counts.infant > 0) return `게스트 ${total}명, 유아 ${counts.infant}명`;
  return `게스트 ${total}명`;
}

/** 검색/예약 시 사용할 총 게스트 수 (유아 제외 또는 포함은 정책에 따름. 여기서는 adult+child만) */
export function totalGuests(counts: GuestCounts): number {
  return counts.adult + counts.child;
}

export interface FramerGuestPickerProps {
  counts: GuestCounts;
  onChange: (counts: GuestCounts) => void;
  onClose?: () => void;
  /** 패널만 렌더 (오버레이 없음) */
  panelOnly?: boolean;
}

const ROW_CLASS =
  "flex items-center justify-between py-4 border-b border-[#f0f0f0] last:border-0";
const LABEL_CLASS = "text-[16px] text-minbak-black font-medium";
const BTN_CLASS =
  "w-9 h-9 rounded-full border border-minbak-light-gray flex items-center justify-center text-minbak-black hover:border-minbak-primary hover:bg-minbak-bg disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:border-minbak-light-gray disabled:hover:bg-transparent transition-colors";

export default function FramerGuestPicker({
  counts,
  onChange,
  onClose,
  panelOnly,
}: FramerGuestPickerProps) {
  const t = useHostTranslations().t;
  const setAdult = (n: number) =>
    onChange({ ...counts, adult: Math.max(1, Math.min(20, n)) });
  const setChild = (n: number) =>
    onChange({ ...counts, child: Math.max(0, Math.min(20, n)) });
  const setInfant = (n: number) =>
    onChange({ ...counts, infant: Math.max(0, Math.min(10, n)) });

  const panel = (
    <div
      className="bg-white rounded-[24px] overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.15)] min-w-[320px] max-w-[400px]"
      style={{ fontFamily: "var(--font-noto-sans-kr), 'Noto Sans KR', sans-serif" }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-6 pt-2 pb-1">
        <div className={ROW_CLASS}>
          <span className={LABEL_CLASS}>{t("guest.adult")}</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label={t("guest.adultDecrease")}
              disabled={counts.adult <= 1}
              className={BTN_CLASS}
              onClick={() => setAdult(counts.adult - 1)}
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center text-[16px] text-minbak-black font-medium">
              {counts.adult}
            </span>
            <button
              type="button"
              aria-label={t("guest.adultIncrease")}
              className={BTN_CLASS}
              onClick={() => setAdult(counts.adult + 1)}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className={ROW_CLASS}>
          <span className={LABEL_CLASS}>{t("guest.child")}</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label={t("guest.childDecrease")}
              disabled={counts.child <= 0}
              className={BTN_CLASS}
              onClick={() => setChild(counts.child - 1)}
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center text-[16px] text-minbak-black font-medium">
              {counts.child}
            </span>
            <button
              type="button"
              aria-label={t("guest.childIncrease")}
              className={BTN_CLASS}
              onClick={() => setChild(counts.child + 1)}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className={ROW_CLASS}>
          <span className={LABEL_CLASS}>{t("guest.infant")}</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label={t("guest.infantDecrease")}
              disabled={counts.infant <= 0}
              className={BTN_CLASS}
              onClick={() => setInfant(counts.infant - 1)}
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center text-[16px] text-minbak-black font-medium">
              {counts.infant}
            </span>
            <button
              type="button"
              aria-label={t("guest.infantIncrease")}
              className={BTN_CLASS}
              onClick={() => setInfant(counts.infant + 1)}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (panelOnly) return panel;

  return (
    <div
      className="fixed inset-0 z-[10002] flex items-start justify-center pt-[184px] md:pt-[200px] pb-8 px-4 bg-black/40"
      onClick={onClose}
      role="presentation"
    >
      <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
        {panel}
      </div>
    </div>
  );
}
