"use client";

import Link from "next/link";
import { useHostTranslations } from "@/components/host/HostLocaleProvider";

export default function MessagesPageTitle({ isHost }: { isHost: boolean }) {
  const { t } = useHostTranslations();
  return (
    <div className="flex items-center justify-between gap-4 mb-4 md:mb-6">
      <h1 className="text-[22px] sm:text-minbak-h2 font-semibold text-minbak-black">
        {t("nav.messages")}
      </h1>
      {isHost && (
        <Link
          href="/host/scheduled-messages"
          className="shrink-0 px-4 py-2 rounded-minbak bg-minbak-primary text-white text-sm font-medium hover:bg-minbak-primary-hover transition-colors"
        >
          {t("nav.scheduledMessages")}
        </Link>
      )}
    </div>
  );
}
