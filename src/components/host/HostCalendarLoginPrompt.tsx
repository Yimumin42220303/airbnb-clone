"use client";

import Link from "next/link";
import { Header, Footer } from "@/components/layout";
import { useHostTranslations } from "./HostLocaleProvider";

export default function HostCalendarLoginPrompt() {
  const t = useHostTranslations().t;

  return (
    <>
      <Header />
      <main className="min-h-screen pt-4 md:pt-8 px-4 md:px-6">
        <div className="max-w-[900px] mx-auto py-6 md:py-8">
          <p className="text-airbnb-body text-airbnb-gray">
            {t("calendar.loginPrompt")}{" "}
            <Link href="/auth/signin?callbackUrl=/host/calendar" className="text-airbnb-red hover:underline">
              {t("calendar.loginWithGoogle")}
            </Link>
          </p>
        </div>
        <Footer />
      </main>
    </>
  );
}
