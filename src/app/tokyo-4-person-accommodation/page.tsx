import SeoLandingPage from "@/components/organic/SeoLandingPage";
import {
  TOKYO_4_PERSON_ACCOMMODATION,
  buildLandingMetadata,
} from "@/lib/organic-landing";

export const metadata = buildLandingMetadata(TOKYO_4_PERSON_ACCOMMODATION);

export default function Tokyo4PersonAccommodationPage() {
  return <SeoLandingPage config={TOKYO_4_PERSON_ACCOMMODATION} />;
}
