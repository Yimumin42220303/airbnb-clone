import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmailAsync } from "@/lib/email";
import { recommendationLeadNotifyEmail } from "@/lib/email-templates";
import {
  validateRecommendationLeadInput,
  generateLeadCode,
  checkLeadRateLimit,
  getClientIp,
} from "@/lib/recommendation-lead";
import {
  getAccessibilityLabel,
  getBudgetLabel,
  type AccessibilityType,
  type BudgetType,
} from "@/lib/recommend-funnel";

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    if (!checkLeadRateLimit(ip)) {
      return NextResponse.json(
        { error: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = validateRecommendationLeadInput(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    const userId = (session as { userId?: string } | null)?.userId ?? null;

    const leadCode = generateLeadCode();
    const data = parsed.data;

    const lead = await prisma.recommendationLead.create({
      data: {
        leadCode,
        status: "new",
        userId,
        guestName: data.guestName,
        contactMethod: data.contactMethod,
        email: data.email,
        kakaoId: data.kakaoId,
        tripType: data.tripType,
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        adultCount: data.adultCount,
        childCount: data.childCount,
        infantCount: data.infantCount,
        preferredAreas: data.preferredAreas,
        budgetType: data.budgetType,
        budgetMin: data.budgetMin,
        budgetMax: data.budgetMax,
        budgetCurrency: data.budgetCurrency,
        priorities: data.priorities,
        freeText: data.freeText,
        referralSource: data.referralSource,
        recommendedListingIds: data.recommendedListingIds,
        sourcePage: data.sourcePage,
        sourceListingId: data.sourceListingId,
        utmSource: data.utmSource,
        utmMedium: data.utmMedium,
        utmCampaign: data.utmCampaign,
        referrer: data.referrer,
        privacyConsentAt: new Date(),
      },
    });

    const notifyEmail = process.env.RECOMMENDATION_LEAD_NOTIFY_EMAIL;
    if (notifyEmail) {
      let accessibilityLabel = "—";
      try {
        const areas = JSON.parse(data.preferredAreas) as {
          value?: string;
          other?: string;
        };
        if (areas?.value) {
          accessibilityLabel = getAccessibilityLabel(
            areas.value as AccessibilityType,
            areas.other
          );
        }
      } catch {
        /* ignore */
      }

      const listingIds: string[] = data.recommendedListingIds
        ? (JSON.parse(data.recommendedListingIds) as string[])
        : [];

      let listingLines = listingIds.map((id, i) => `${i + 1}. /listing/${id}`).join("<br/>");
      if (listingIds.length > 0) {
        try {
          const rows = await prisma.listing.findMany({
            where: { id: { in: listingIds.slice(0, 5) } },
            select: { id: true, title: true },
          });
          const byId = new Map(rows.map((r) => [r.id, r.title]));
          listingLines = listingIds
            .slice(0, 5)
            .map((id, i) => `${i + 1}. ${byId.get(id) ?? id}`)
            .join("<br/>");
        } catch {
          /* titles optional */
        }
      }

      sendEmailAsync({
        to: notifyEmail,
        subject: `[도쿄민박] 숙소추천 상담 요청 ${leadCode}`,
        html: recommendationLeadNotifyEmail({
          leadCode,
          leadId: lead.id,
          checkIn: data.checkIn,
          checkOut: data.checkOut,
          adultCount: data.adultCount,
          childCount: data.childCount,
          infantCount: data.infantCount,
          tripType: data.tripType,
          accessibilityLabel,
          budgetLabel: getBudgetLabel(data.budgetType as BudgetType),
          priorities: data.priorities,
          contactMethod: data.contactMethod,
          guestName: data.guestName,
          email: data.email,
          kakaoId: data.kakaoId,
          freeText: data.freeText,
          listingLines,
          sourcePage: data.sourcePage,
          sourceListingId: data.sourceListingId,
          utmSource: data.utmSource,
          utmMedium: data.utmMedium,
          utmCampaign: data.utmCampaign,
          referrer: data.referrer,
        }),
      });
    }

    return NextResponse.json({ ok: true, leadId: lead.id, leadCode: lead.leadCode });
  } catch (err) {
    console.error("[recommendation-leads] create failed:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json(
      { error: "상담 요청 저장에 실패했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 }
    );
  }
}
