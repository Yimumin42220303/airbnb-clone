"use client";

import { useState, useCallback } from "react";
import { Copy, Check, Loader2 } from "lucide-react";
import KakaoIcon from "@/components/ui/KakaoIcon";
import {
  buildConsultationMessage,
  CONFIRMATION_NOTE,
  generateTempLeadCode,
  getAccessibilityLabel,
  getBudgetLabel,
  getKakaoChannelChatUrl,
  type AccessibilityType,
  type BudgetType,
} from "@/lib/recommend-funnel";
import { trackRecommendEvent } from "@/lib/recommend-analytics";
import { BASE_URL } from "@/lib/site-url";

const PRIVACY_CONSENT_TEXT =
  "[필수] 숙소 추천 및 예약 상담을 위해 입력한 일정, 인원, 희망 조건 및 연락 정보를 수집·이용하는 데 동의합니다. 수집된 정보는 숙소 추천, 예약 전 상담, 문의 응대를 위해 사용됩니다.";

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
  tripTypeLabel?: string;
  accessibility: AccessibilityType;
  accessibilityOther: string;
  budgetType: BudgetType;
  prioritiesLabel?: string;
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
  tripType?: string;
  priorities?: string[];
};

export default function RecommendConsultBlock({
  checkIn,
  checkOut,
  adultCount,
  childCount,
  infantCount,
  tripTypeLabel,
  accessibility,
  accessibilityOther,
  budgetType,
  prioritiesLabel,
  freeText,
  listings,
  attribution,
  tripType,
  priorities,
}: Props) {
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [email, setEmail] = useState("");
  const [kakaoId, setKakaoId] = useState("");
  const [contactMethod, setContactMethod] = useState<"kakao" | "email">("kakao");
  const [leadCode, setLeadCode] = useState<string | null>(null);
  const [consentError, setConsentError] = useState("");
  const [copyDone, setCopyDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const kakaoUrl =
    typeof window !== "undefined"
      ? process.env.NEXT_PUBLIC_KAKAO_CHANNEL_CHAT_URL || getKakaoChannelChatUrl()
      : getKakaoChannelChatUrl();

  const buildMessage = useCallback(
    (code: string) =>
      buildConsultationMessage({
        leadCode: code,
        checkIn,
        checkOut,
        adultCount,
        childCount,
        infantCount,
        tripTypeLabel,
        accessibilityLabel: getAccessibilityLabel(accessibility, accessibilityOther),
        budgetLabel: getBudgetLabel(budgetType),
        prioritiesLabel,
        listings: listings.map((l) => ({
          rank: l.rank,
          title: l.title,
          url: `${BASE_URL}/listing/${l.id}`,
        })),
        freeText,
        sourcePage: attribution.sourcePage,
      }),
    [
      checkIn,
      checkOut,
      adultCount,
      childCount,
      infantCount,
      tripTypeLabel,
      accessibility,
      accessibilityOther,
      budgetType,
      prioritiesLabel,
      listings,
      freeText,
      attribution.sourcePage,
    ]
  );

  const ensureLead = async (): Promise<string | null> => {
    if (!privacyConsent) {
      setConsentError("개인정보 수집·이용에 동의해 주세요.");
      return null;
    }
    setConsentError("");
    if (leadCode) return leadCode;

    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch("/api/recommendation-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          privacyConsent: true,
          guestName: guestName.trim() || undefined,
          contactMethod,
          email: contactMethod === "email" ? email.trim() : email.trim() || undefined,
          kakaoId: kakaoId.trim() || undefined,
          tripType,
          checkIn,
          checkOut,
          adultCount,
          childCount,
          infantCount,
          accessibility,
          accessibilityOther: accessibilityOther.trim() || undefined,
          budgetType,
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
        setSaveError(data.error ?? "상담 요청 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.");
        return null;
      }
      setLeadCode(data.leadCode);
      trackRecommendEvent("recommend_lead_submit", {
        contact_method: contactMethod,
        source_page: attribution.sourcePage,
      });
      return data.leadCode;
    } catch {
      setSaveError("네트워크 오류가 발생했습니다.");
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async () => {
    if (!privacyConsent) {
      setConsentError("개인정보 수집·이용에 동의해 주세요.");
      return;
    }
    setConsentError("");
    let code = leadCode;
    if (!code) {
      code = await ensureLead();
      if (!code) {
        code = generateTempLeadCode();
        setSaveError((prev) => prev || "저장에 실패했지만 상담 내용은 복사할 수 있습니다. 카카오 상담 시 내용을 붙여넣어 주세요.");
      }
    }
    const text = buildMessage(code);
    try {
      await navigator.clipboard.writeText(text);
      setCopyDone(true);
      trackRecommendEvent("recommend_copy_message", { source_page: attribution.sourcePage });
      setTimeout(() => setCopyDone(false), 2500);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopyDone(true);
      trackRecommendEvent("recommend_copy_message", { source_page: attribution.sourcePage });
      setTimeout(() => setCopyDone(false), 2500);
    }
  };

  const handleKakao = async () => {
    const code = await ensureLead();
    if (!code) return;
    trackRecommendEvent("recommend_kakao_click", { source_page: attribution.sourcePage });
    if (kakaoUrl) {
      window.open(kakaoUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <section className="mt-10 rounded-minbak border border-minbak-primary/25 bg-gradient-to-br from-minbak-primary/5 via-amber-50/50 to-white p-5 md:p-6">
      <h2 className="text-minbak-body-lg font-bold text-minbak-black">
        이 중 어떤 숙소가 가장 좋을지 모르겠다면?
      </h2>
      <p className="text-minbak-body text-minbak-dark-gray mt-2">
        도쿄민박이 일정·인원·예산 기준으로 2~3개 숙소를 비교해드릴게요.
      </p>
      <p className="text-minbak-caption text-minbak-gray mt-2">
        바로 예약이 부담되면 카카오톡으로 비교 상담 후 진행할 수 있습니다.
      </p>

      <div className="mt-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-minbak-caption text-minbak-gray mb-1">이름 (선택)</label>
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="w-full px-3 py-2.5 border border-minbak-light-gray rounded-minbak text-minbak-body"
              maxLength={100}
              autoComplete="name"
            />
          </div>
          <div>
            <label className="block text-minbak-caption text-minbak-gray mb-1">연락 방법</label>
            <select
              value={contactMethod}
              onChange={(e) => setContactMethod(e.target.value as "kakao" | "email")}
              className="w-full px-3 py-2.5 border border-minbak-light-gray rounded-minbak text-minbak-body bg-white"
            >
              <option value="kakao">카카오톡</option>
              <option value="email">이메일</option>
            </select>
          </div>
        </div>

        {contactMethod === "email" ? (
          <div>
            <label className="block text-minbak-caption text-minbak-gray mb-1">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 border border-minbak-light-gray rounded-minbak text-minbak-body"
              maxLength={200}
              autoComplete="email"
            />
          </div>
        ) : (
          <div>
            <label className="block text-minbak-caption text-minbak-gray mb-1">
              카카오톡 ID (선택 — 상담번호로도 매칭 가능)
            </label>
            <input
              type="text"
              value={kakaoId}
              onChange={(e) => setKakaoId(e.target.value)}
              className="w-full px-3 py-2.5 border border-minbak-light-gray rounded-minbak text-minbak-body"
              maxLength={100}
            />
          </div>
        )}

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
        {leadCode && (
          <p className="text-minbak-caption text-minbak-primary font-medium">
            상담번호: {leadCode} (카카오 상담 시 이 번호를 알려주시면 빠르게 확인할 수 있어요)
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleCopy}
            disabled={saving}
            className="flex-1 inline-flex items-center justify-center gap-2 min-h-[48px] px-4 py-3 rounded-minbak border border-minbak-primary text-minbak-primary font-semibold hover:bg-minbak-primary/5 disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : copyDone ? (
              <Check className="w-5 h-5" />
            ) : (
              <Copy className="w-5 h-5" />
            )}
            {copyDone ? "복사됨" : "상담 내용 복사하기"}
          </button>
          <button
            type="button"
            onClick={handleKakao}
            disabled={saving || !kakaoUrl}
            className="flex-1 inline-flex items-center justify-center gap-2 min-h-[48px] px-4 py-3 rounded-minbak bg-[#FEE500] text-[#191919] font-semibold hover:bg-[#f5dc00] disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <KakaoIcon className="w-5 h-5" />
            )}
            카카오톡으로 상담하기
          </button>
        </div>
        {!kakaoUrl && (
          <p className="text-minbak-caption text-minbak-gray">
            카카오 채널 링크를 불러오지 못했습니다. 상담 내용을 복사한 뒤 카카오톡에서 도쿄민박 채널로 문의해 주세요.
          </p>
        )}

        <p className="text-minbak-caption text-minbak-gray">{CONFIRMATION_NOTE}</p>
      </div>
    </section>
  );
}

export { PRIVACY_CONSENT_TEXT };
