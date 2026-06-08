import SeoLandingPage from "@/components/organic/SeoLandingPage";
import {
  TOKYO_5_PERSON_ACCOMMODATION,
  buildLandingMetadata,
} from "@/lib/organic-landing";

export const metadata = buildLandingMetadata(TOKYO_5_PERSON_ACCOMMODATION);

export default function Tokyo5PersonAccommodationPage() {
  return <SeoLandingPage config={TOKYO_5_PERSON_ACCOMMODATION} />;
}
