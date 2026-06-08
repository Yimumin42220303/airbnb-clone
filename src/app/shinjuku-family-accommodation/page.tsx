import SeoLandingPage from "@/components/organic/SeoLandingPage";
import {
  SHINJUKU_FAMILY_ACCOMMODATION,
  buildLandingMetadata,
} from "@/lib/organic-landing";

export const metadata = buildLandingMetadata(SHINJUKU_FAMILY_ACCOMMODATION);

export default function ShinjukuFamilyAccommodationPage() {
  return <SeoLandingPage config={SHINJUKU_FAMILY_ACCOMMODATION} />;
}
