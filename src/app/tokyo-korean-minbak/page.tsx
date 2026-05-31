import SeoLandingPage from "@/components/organic/SeoLandingPage";
import { TOKYO_KOREAN_MINBAK, buildLandingMetadata } from "@/lib/organic-landing";

export const metadata = buildLandingMetadata(TOKYO_KOREAN_MINBAK);

export default function TokyoKoreanMinbakPage() {
  return <SeoLandingPage config={TOKYO_KOREAN_MINBAK} />;
}
