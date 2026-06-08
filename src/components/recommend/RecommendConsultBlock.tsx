"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import {
  getGuestAccessibilityLabel,
  getKakaoChannelChatUrl,
  getPrimaryPriorityLabel,
  getBudgetLabel,
  type AccessibilityType,
  type BudgetType,
  type PrimaryPriorityType,
} from "@/lib/recommend-funnel";
import {
  openRecommendChannelConsult,
  type RecommendChannelContext,
} from "@/lib/recommend-channel-talk";
import { trackRecommendEvent } from "@/lib/recommend-analytics";

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

export default function RecommendConsultBlock({
  checkIn,
  checkOut,
  adultCount,
  childCount,
  infantCount,
  accessibility,
  primaryPriority,
  listings,
  attribution,
  budgetType,
  priorities,
}: Props) {
  const [saveError, setSaveError] = useState("");
  const [channelError, setChannelError] = useState("");
  const [channelFailed, setChannelFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const savedContextRef = useRef<RecommendChannelContext | null>(null);

  const kakaoUrl =
    typeof window !== "undefined"
      ? process.env.NEXT_PUBLIC_KAKAO_CHANNEL_CHAT_URL || getKakaoChannelChatUrl()
      : getKakaoChannelChatUrl();

  const buildChannelContext = useCallback(
    (leadCode: string): RecommendChannelContext => ({
      leadCode,
      checkIn,
      checkOut,
      guestCount: adultCount + childCount,
      childCount,
      infantCount,
      preferredAreaLabel: getGuestAccessibilityLabel(accessibility),
      priorityLabel: getPrimaryPriorityLabel(primaryPriority),
      budgetLabel:
        budgetType && budgetType !== "undecided"
          ? getBudgetLabel(budgetType)
          : undefined,
      recommendedListingTitles: listings.map((l) => l.title),
      recommendedListingIds: listings.map((l) => l.id),
      sourcePage: attribution.sourcePage,
      sourceListingId: attribution.sourceListingId,
    }),
    [
      checkIn,
      checkOut,
      adultCount,
      childCount,
      infantCount,
      accessibility,
      primaryPriority,
      budgetType,
      listings,
      attribution.sourcePage,
      attribution.sourceListingId,
    ]
  );

  const openChannel = async (ctx: RecommendChannelContext) => {
    const result = await openRecommendChannelConsult(ctx);
    if (result === "opened") {
      setChannelError("");
      setChannelFailed(false);
      trackRecommendEvent("recommend_channeltalk_open", {
        source_page: attribution.sourcePage,
        listing_id: attribution.sourceListingId,
      });
      return true;
    }
    setChannelFailed(true);
    trackRecommendEvent("recommend_channeltalk_open_failed", {
      source_page: attribution.sourcePage,
      contact_method: result,
    });
    if (result === "not_ready") {
      setChannelError("상담창을 여는 데 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } else {
      setChannelError("상담창이 열리지 않았어요. 다시 시도해 주세요.");
    }
    return false;
  };

  const handleStartConsult = async () => {
    setSaveError("");
    setChannelError("");

    trackRecommendEvent("recommend_consult_start_click", {
      source_page: attribution.sourcePage,
      listing_id: attribution.sourceListingId,
    });

    if (savedContextRef.current) {
      await openChannel(savedContextRef.current);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/recommendation-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactMethod: "channel",
          checkIn,
          checkOut,
          adultCount,
          childCount,
          infantCount,
          accessibility,
          budgetType: budgetType ?? "undecided",
          priorities,
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

      trackRecommendEvent("recommend_consult_lead_created", {
        source_page: attribution.sourcePage,
        listing_id: attribution.sourceListingId,
      });
      trackRecommendEvent("recommend_lead_submit", {
        contact_method: "channel",
        source_page: attribution.sourcePage,
      });

      const ctx = buildChannelContext(data.leadCode);
      savedContextRef.current = ctx;
      await openChannel(ctx);
    } catch {
      setSaveError("잠시 후 다시 시도해 주세요.");
    } finally {
      setSaving(false);
    }
  };

  const handleRetryChannel = async () => {
    if (!savedContextRef.current) {
      setChannelError("상담창을 여는 데 실패했습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }
    setChannelError("");
    await openChannel(savedContextRef.current);
  };

  return (
    <section className="mt-10 rounded-minbak border border-minbak-primary/25 bg-gradient-to-br from-minbak-primary/5 via-amber-50/50 to-white p-5 md:p-6">
      <h2 className="text-minbak-body-lg font-bold text-minbak-black">
        어떤 숙소가 좋을지 고민된다면?
      </h2>
      <p className="text-minbak-body text-minbak-dark-gray mt-2">
        도쿄민박이 입력하신 조건을 보고 바로 상담해드릴게요.
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

        <p className="text-minbak-caption text-minbak-gray">
          상담을 진행하면 입력하신 조건과 추천 결과가 도쿄민박 고객지원팀에 전달됩니다.
        </p>

        <p className="text-minbak-caption text-minbak-gray/90 leading-relaxed">
          입력한 조건 처리에 대한 내용은{" "}
          <Link href="/policy" className="text-minbak-primary underline underline-offset-2">
            개인정보처리방침
          </Link>
          에서 확인할 수 있습니다.
        </p>

        {saveError && <p className="text-minbak-caption text-red-600">{saveError}</p>}
        {channelError && <p className="text-minbak-caption text-red-600">{channelError}</p>}

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
            "이 3곳 기준으로 한국인 스태프에게 상담받기"
          )}
        </button>

        {channelFailed && savedContextRef.current && (
          <button
            type="button"
            onClick={handleRetryChannel}
            className="w-full inline-flex items-center justify-center min-h-[48px] px-4 py-3 rounded-minbak border-2 border-minbak-primary text-minbak-primary font-semibold text-minbak-body hover:bg-minbak-primary/5 transition-colors"
          >
            상담창 다시 열기
          </button>
        )}

        {channelFailed && kakaoUrl && (
          <p className="text-minbak-caption text-minbak-gray text-center">
            채널톡이 열리지 않으면{" "}
            <a
              href={kakaoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-minbak-primary font-medium underline underline-offset-2"
              onClick={() =>
                trackRecommendEvent("recommend_kakao_click", {
                  source_page: attribution.sourcePage,
                })
              }
            >
              카카오톡으로 문의하기
            </a>
          </p>
        )}
      </div>
    </section>
  );
}
