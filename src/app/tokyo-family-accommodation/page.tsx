import SeoLandingPage from "@/components/organic/SeoLandingPage";
import {
  TOKYO_FAMILY_ACCOMMODATION,
  buildLandingMetadata,
} from "@/lib/organic-landing";

export const metadata = buildLandingMetadata(TOKYO_FAMILY_ACCOMMODATION);

export default function TokyoFamilyAccommodationPage() {
  return <SeoLandingPage config={TOKYO_FAMILY_ACCOMMODATION} />;
}
