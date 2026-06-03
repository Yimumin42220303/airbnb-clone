"use client";

import { useState, useCallback } from "react";
import { Loader2 } from "lucide-react";
import {
  buildGuestConsultationMessage,
  getGuestAccessibilityLabel,
  getKakaoChannelChatUrl,
  getPrimaryPriorityLabel,
  type AccessibilityType,
  type BudgetType,
  type PrimaryPriorityType,
} from "@/lib/recommend-funnel";
import { trackRecommendEvent } from "@/lib/recommend-analytics";

export const PRIVACY_CONSENT_TEXT =
  "[필수] 숙소 추천 상담을 위해 입력한 조건을 저장하는 데 동의합니다.";

export type ConsultListingItem = {
  rank: number;
  id: string;
  title: string;
};

type Props = {
  checkIn: string;
  checkOut: string;
  adultCount: number;
  childCount: number;
  infantCount: number;
  accessibility: AccessibilityType;
  primaryPriority: PrimaryPriorityType;
  freeText: string;
  listings: ConsultListingItem[];
  attribution: {
    sourcePage?: string;
    sourceListingId?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    referrer?: string;
  };
  budgetType?: BudgetType;
  priorities?: string[];
};

/** window.open 반환값으로 팝업 차단 여부 추정 (async 이후 호출 시 모바일에서 자주 차단됨) */
function openKakaoChat(url: string): boolean {
  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (opened == null) return false;
  try {
    if (opened.closed) return false;
  } catch {
    return false;
  }
  return true;
}

export default function RecommendConsultBlock({
  checkIn,
  checkOut,
  adultCount,
  childCount,
  infantCount,
  accessibility,
  primaryPriority,
  freeText,
  listings,
  attribution,
  budgetType,
  priorities,
}: Props) {
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [consultNumber, setConsultNumber] = useState<string | null>(null);
  const [consentError, setConsentError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [successHint, setSuccessHint] = useState("");
  const [kakaoHint, setKakaoHint] = useState("");
  const [copyFailed, setCopyFailed] = useState(false);
  const [kakaoOpenFailed, setKakaoOpenFailed] = useState(false);
  const [saving, setSaving] = useState(false);

  const kakaoUrl =
    typeof window !== "undefined"
      ? process.env.NEXT_PUBLIC_KAKAO_CHANNEL_CHAT_URL || getKakaoChannelChatUrl()
      : getKakaoChannelChatUrl();

  const buildMessage = useCallback(
    (code: string) =>
      buildGuestConsultationMessage({
        leadCode: code,
        checkIn,
        checkOut,
        adultCount,
        childCount,
        infantCount,
        accessibilityLabel: getGuestAccessibilityLabel(accessibility),
        priorityLabel: getPrimaryPriorityLabel(primaryPriority),
        listings: listings.map((l) => ({ rank: l.rank, title: l.title })),
      }),
    [
      checkIn,
      checkOut,
      adultCount,
      childCount,
      infantCount,
      accessibility,
      primaryPriority,
      listings,
    ]
  );

  const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        return true;
      } catch {
        return false;
      }
    }
  };

  const tryOpenKakao = (): boolean => {
    if (!kakaoUrl) {
      setKakaoOpenFailed(true);
      return false;
    }
    const ok = openKakaoChat(kakaoUrl);
    if (ok) {
      setKakaoOpenFailed(false);
      setKakaoHint("");
      trackRecommendEvent("recommend_kakao_click", { source_page: attribution.sourcePage });
    } else {
      setKakaoOpenFailed(true);
      setKakaoHint("카카오톡 창이 열리지 않았다면 아래 버튼을 눌러주세요.");
    }
    return ok;
  };

  const handleOpenKakaoButton = () => {
    tryOpenKakao();
  };

  const handleStartConsult = async () => {
    if (!privacyConsent) {
      setConsentError("개인정보 수집·이용에 동의해 주세요.");
      return;
    }
    setConsentError("");
    setSaveError("");
    setSuccessHint("");
    setKakaoHint("");
    setCopyFailed(false);
    setKakaoOpenFailed(false);

    if (consultNumber) {
      const copied = await copyToClipboard(buildMessage(consultNumber));
      if (copied) {
        setSuccessHint("상담 내용이 복사됐어요. 카카오톡에 붙여넣어 보내주세요.");
        trackRecommendEvent("recommend_copy_message", { source_page: attribution.sourcePage });
      } else {
        setCopyFailed(true);
      }
      tryOpenKakao();
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/recommendation-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          privacyConsent: true,
          contactMethod: "kakao",
          checkIn,
          checkOut,
          adultCount,
          childCount,
          infantCount,
          accessibility,
          budgetType: budgetType ?? "undecided",
          priorities,
          freeText: freeText.trim() || undefined,
          recommendedListingIds: listings.map((l) => l.id),
          sourcePage: attribution.sourcePage,
          sourceListingId: attribution.sourceListingId,
          utmSource: attribution.utmSource,
          utmMedium: attribution.utmMedium,
          utmCampaign: attribution.utmCampaign,
          referrer: attribution.referrer,
          website: "",
        }),
      });
      const data = (await res.json()) as { ok?: boolean; leadCode?: string; error?: string };
      if (!res.ok || !data.ok || !data.leadCode) {
        setSaveError(data.error ?? "잠시 후 다시 시도해 주세요.");
        return;
      }

      setConsultNumber(data.leadCode);
      trackRecommendEvent("recommend_lead_submit", {
        contact_method: "kakao",
        source_page: attribution.sourcePage,
      });

      const messageText = buildMessage(data.leadCode);
      const copied = await copyToClipboard(messageText);
      if (copied) {
        setSuccessHint("상담 내용이 복사됐어요. 카카오톡에 붙여넣어 보내주세요.");
        trackRecommendEvent("recommend_copy_message", { source_page: attribution.sourcePage });
      } else {
        setCopyFailed(true);
      }

      tryOpenKakao();
    } catch {
      setSaveError("잠시 후 다시 시도해 주세요.");
    } finally {
      setSaving(false);
    }
  };

  const handleRetryCopy = async () => {
    if (!consultNumber) return;
    const copied = await copyToClipboard(buildMessage(consultNumber));
    if (copied) {
      setCopyFailed(false);
      setSuccessHint("상담 내용이 복사됐어요. 카카오톡에 붙여넣어 보내주세요.");
      trackRecommendEvent("recommend_copy_message", { source_page: attribution.sourcePage });
    }
  };

  return (
    <section className="mt-10 rounded-minbak border border-minbak-primary/25 bg-gradient-to-br from-minbak-primary/5 via-amber-50/50 to-white p-5 md:p-6">
      <h2 className="text-minbak-body-lg font-bold text-minbak-black">
        어떤 숙소가 좋을지 고민된다면?
      </h2>
      <p className="text-minbak-body text-minbak-dark-gray mt-2">
        상담번호를 보내주시면 입력하신 조건을 기준으로 더 정확히 안내드릴게요.
      </p>

      <div className="mt-5 space-y-4">
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          className="absolute opacity-0 pointer-events-none h-0 w-0 overflow-hidden"
          value=""
          readOnly
        />

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={privacyConsent}
            onChange={(e) => {
              setPrivacyConsent(e.target.checked);
              if (e.target.checked) setConsentError("");
            }}
            className="mt-1 h-4 w-4 rounded border-minbak-light-gray text-minbak-primary focus:ring-minbak-primary"
          />
          <span className="text-minbak-caption text-minbak-dark-gray leading-relaxed">
            {PRIVACY_CONSENT_TEXT}{" "}
            <a href="/policy" className="text-minbak-primary underline" target="_blank" rel="noopener noreferrer">
              개인정보처리방침
            </a>
          </span>
        </label>

        {consentError && <p className="text-minbak-caption text-red-600">{consentError}</p>}
        {saveError && <p className="text-minbak-caption text-red-600">{saveError}</p>}

        {consultNumber && (
          <p className="text-minbak-body font-semibold text-minbak-primary">
            상담번호: <span className="tabular-nums">{consultNumber}</span>
          </p>
        )}

        {successHint && (
          <p className="text-minbak-caption text-minbak-dark-gray">{successHint}</p>
        )}

        {kakaoHint && (
          <p className="text-minbak-caption text-minbak-dark-gray">{kakaoHint}</p>
        )}

        <button
          type="button"
          onClick={handleStartConsult}
          disabled={saving}
          className="w-full inline-flex items-center justify-center gap-2 min-h-[52px] px-4 py-3 rounded-minbak bg-minbak-primary text-white font-semibold text-minbak-body hover:bg-minbak-primary-hover disabled:opacity-60 transition-colors shadow-lg shadow-minbak-primary/20"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              처리 중…
            </>
          ) : (
            "상담 시작하기"
          )}
        </button>

        {copyFailed && consultNumber && (
          <button
            type="button"
            onClick={handleRetryCopy}
            className="w-full text-minbak-caption text-minbak-primary font-medium underline underline-offset-2"
          >
            상담 내용 다시 복사
          </button>
        )}

        {kakaoOpenFailed && kakaoUrl && consultNumber && (
          <button
            type="button"
            onClick={handleOpenKakaoButton}
            className="w-full inline-flex items-center justify-center min-h-[48px] px-4 py-3 rounded-minbak border-2 border-minbak-primary text-minbak-primary font-semibold text-minbak-body hover:bg-minbak-primary/5 transition-colors"
          >
            카카오톡 상담 열기
          </button>
        )}
      </div>
    </section>
  );
}
